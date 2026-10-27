import { describe, it, expect, vi, beforeEach } from "vitest";
import { AutosaveEngine } from "@/lib/cv/autosave-engine";
import { initialCvData, cvDraftSchema } from "@/types/cv";
import { PATCH } from "@/app/api/cv/[id]/route";

// Mock Supabase Server Client for integration tests
const mockGetUser = vi.fn();
const mockCvDatabase: Record<string, { id: string; user_id: string; title: string; version: number; data: any; language: string }> = {};

vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(async () => ({
      auth: {
        getUser: mockGetUser,
      },
      from: vi.fn((tableName: string) => {
        if (tableName === "cvs") {
          return {
            select: vi.fn((fields: string) => ({
              eq: vi.fn((col1: string, val1: string) => ({
                eq: vi.fn((col2: string, val2: string) => ({
                  maybeSingle: vi.fn(async () => {
                    const found = Object.values(mockCvDatabase).find(
                      (item) => item.id === val1 && item.user_id === val2
                    );
                    return { data: found || null, error: null };
                  }),
                })),
              })),
            })),
            update: vi.fn((updatePayload: any) => ({
              eq: vi.fn((col1: string, val1: string) => ({
                eq: vi.fn((col2: string, val2: string) => ({
                  select: vi.fn(() => ({
                    single: vi.fn(async () => {
                      const existing = mockCvDatabase[val1];
                      if (!existing || existing.user_id !== val2) {
                        return { data: null, error: new Error("Not found") };
                      }
                      const updated = {
                        ...existing,
                        ...updatePayload,
                      };
                      mockCvDatabase[val1] = updated;
                      return { data: updated, error: null };
                    }),
                  })),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    })),
  };
});

describe("MASALAH 1: Autosave Engine Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should debounce multiple triggers within 1500ms and execute only once", async () => {
    const mockSaveFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: { cv: { version: 2 } },
    });

    const engine = new AutosaveEngine({
      cvId: "cv-1",
      initialVersion: 1,
      debounceMs: 50, // short for test
      saveFn: mockSaveFn,
    });

    // Fire 3 rapid triggers
    engine.trigger(initialCvData, "Title 1");
    engine.trigger(initialCvData, "Title 2");
    engine.trigger(initialCvData, "Title 3");

    expect(engine.getStatus()).toBe("dirty");
    expect(mockSaveFn).not.toHaveBeenCalled();

    // Wait past debounce
    await new Promise((r) => setTimeout(r, 70));

    expect(mockSaveFn).toHaveBeenCalledTimes(1);
    expect(mockSaveFn).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Title 3", version: 1 }),
      expect.any(AbortSignal)
    );
    expect(engine.getStatus()).toBe("saved");
    expect(engine.getVersion()).toBe(2);
  });

  it("should abort in-flight request when superseded and save newest data", async () => {
    let abortedFirstSignal = false;

    const mockSaveFn = vi.fn().mockImplementation((payload, signal: AbortSignal) => {
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => {
          abortedFirstSignal = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
        setTimeout(() => {
          resolve({ ok: true, status: 200, data: { cv: { version: payload.version + 1 } } });
        }, 100);
      });
    });

    const engine = new AutosaveEngine({
      cvId: "cv-1",
      initialVersion: 1,
      debounceMs: 10,
      saveFn: mockSaveFn,
    });

    // First save starts
    engine.trigger(initialCvData, "First");
    await new Promise((r) => setTimeout(r, 20));
    expect(engine.getStatus()).toBe("saving");

    // While first is in flight, second save triggers
    engine.trigger(initialCvData, "Second Super Fast");
    await new Promise((r) => setTimeout(r, 20));

    expect(abortedFirstSignal).toBe(true);

    // Wait for the queued newest save to resolve
    await new Promise((r) => setTimeout(r, 150));
    expect(engine.getStatus()).toBe("saved");
    expect(mockSaveFn).toHaveBeenCalledTimes(2);
  });

  it("should retry 3 times with exponential backoff on 5xx or network errors", async () => {
    let callCount = 0;
    const mockSaveFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve({ ok: false, status: 500, data: { message: "Internal Error" } });
      }
      return Promise.resolve({ ok: true, status: 200, data: { cv: { version: 2 } } });
    });

    const engine = new AutosaveEngine({
      cvId: "cv-1",
      initialVersion: 1,
      debounceMs: 10,
      maxRetries: 3,
      saveFn: mockSaveFn,
    });

    await engine.saveNow(initialCvData, "Retry Test");

    // Should have succeeded on 3rd attempt
    expect(callCount).toBe(3);
    expect(engine.getStatus()).toBe("saved");
  });

  it("should NOT retry on 4xx client errors (400 validation or 409 conflict)", async () => {
    const mockSaveFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      data: { code: "VALIDATION_ERROR", message: "Data tidak valid" },
    });

    const engine = new AutosaveEngine({
      cvId: "cv-1",
      initialVersion: 1,
      maxRetries: 3,
      saveFn: mockSaveFn,
    });

    await engine.saveNow(initialCvData, "Bad Data");

    // Must be called exactly ONCE, no retry for 4xx
    expect(mockSaveFn).toHaveBeenCalledTimes(1);
    expect(engine.getStatus()).toBe("error");
    expect(engine.getErrorMessage()).toContain("Data tidak valid");
  });

  it("should detect version conflict (409) and enter conflict state without retry", async () => {
    const onConflict = vi.fn();
    const mockSaveFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      data: {
        code: "VERSION_CONFLICT",
        message: "Dokumen telah diubah di sesi lain.",
        serverVersion: 5,
      },
    });

    const engine = new AutosaveEngine({
      cvId: "cv-1",
      initialVersion: 2,
      maxRetries: 3,
      onConflict,
      saveFn: mockSaveFn,
    });

    await engine.saveNow(initialCvData, "Conflict Title");

    expect(mockSaveFn).toHaveBeenCalledTimes(1);
    expect(engine.getStatus()).toBe("conflict");
    expect(onConflict).toHaveBeenCalledWith(5);
  });
});

describe("MASALAH 1: Route Handler PATCH /api/cv/[id] Integration Tests", () => {
  beforeEach(() => {
    mockCvDatabase["cv-test-1"] = {
      id: "cv-test-1",
      user_id: "user-101",
      title: "My CV Draft",
      version: 1,
      data: initialCvData,
      language: "id",
    };

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-101", email: "user@example.com" } },
      error: null,
    });
  });

  it("returns 200 and increments version on successful autosave of draft data", async () => {
    const req = new Request("http://localhost:3000/api/cv/cv-test-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 1,
        title: "Updated Title",
        data: {
          ...initialCvData,
          personalInfo: {
            ...initialCvData.personalInfo,
            fullName: "Budi", // partial draft during typing
          },
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "cv-test-1" }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cv.version).toBe(2);
    expect(body.cv.title).toBe("Updated Title");
    expect(body.cv.data.personalInfo.fullName).toBe("Budi");
  });

  it("returns 401 Unauthorized when session is invalid or user is unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("No session"),
    });

    const req = new Request("http://localhost:3000/api/cv/cv-test-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hack" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "cv-test-1" }) });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when incoming CV data has corrupted structure", async () => {
    const req = new Request("http://localhost:3000/api/cv/cv-test-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 1,
        data: {
          personalInfo: "not-an-object", // invalid type
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "cv-test-1" }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 Conflict when client sends an outdated version (Optimistic Locking)", async () => {
    // Current DB version is 1
    const req = new Request("http://localhost:3000/api/cv/cv-test-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 0, // Outdated version!
        title: "Stale update",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "cv-test-1" }) });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.code).toBe("VERSION_CONFLICT");
    expect(body.serverVersion).toBe(1);
  });
});

describe("MASALAH 1: E2E Persistence Simulation", () => {
  it("persists typed form inputs into the database draft across page reloads", async () => {
    mockCvDatabase["cv-persist"] = {
      id: "cv-persist",
      user_id: "user-101",
      title: "Initial CV",
      version: 1,
      data: initialCvData,
      language: "id",
    };

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-101", email: "user@example.com" } },
      error: null,
    });

    // 1. User types in their summary
    const updatedData = {
      ...initialCvData,
      personalInfo: {
        ...initialCvData.personalInfo,
        fullName: "Siti Rahmawati",
        summary: "Software Quality Assurance Engineer dengan pengalaman testing otomatis.",
      },
    };

    const patchReq = new Request("http://localhost:3000/api/cv/cv-persist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 1,
        title: "CV QA Siti",
        data: updatedData,
      }),
    });

    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: "cv-persist" }) });
    expect(patchRes.status).toBe(200);

    // 2. Simulate refresh: read from database
    const refreshed = mockCvDatabase["cv-persist"];
    expect(refreshed.title).toBe("CV QA Siti");
    expect(refreshed.version).toBe(2);
    expect(refreshed.data.personalInfo.fullName).toBe("Siti Rahmawati");
    expect(refreshed.data.personalInfo.summary).toContain("Software Quality Assurance");
  });
});
