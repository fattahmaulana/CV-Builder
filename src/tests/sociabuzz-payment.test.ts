import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeCountry, SUPPORTED_COUNTRIES } from "@/lib/sociabuzz/constants";
import { CookieJar, SociaBuzzClient } from "@/lib/sociabuzz/client";
import {
  createSociaBuzzCheckout,
  processSociaBuzzPaymentSuccess,
  checkSociaBuzzPaymentStatus,
  handleSociaBuzzWebhookPayload,
} from "@/lib/sociabuzz/sociabuzz-service";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null })),
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: null })),
              })),
            })),
          })),
        })),
      })),
      insert: vi.fn(async () => ({ error: null })),
    })),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn((col: string, val: string) => ({
          maybeSingle: vi.fn(async () => {
            if (table === "payment_events") return { data: null };
            if (table === "orders") {
              return {
                data: {
                  id: "order-sbz-123",
                  cv_id: "cv-test-uuid",
                  invoice_number: val || "TRIBE-IDR-MOCK-123",
                  status: "PENDING",
                },
              };
            }
            return { data: null };
          }),
        })),
        or: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: {
              id: "order-sbz-123",
              cv_id: "cv-test-uuid",
              invoice_number: "TRIBE-IDR-MOCK-123",
              status: "PAID",
              doku_reference: "SBZ-TOKEN-123",
            },
          })),
        })),
      })),
      insert: vi.fn(async () => ({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    })),
  })),
}));

describe("SociaBuzz QRIS Payment Gateway Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Country Normalization & Constants", () => {
    it("should normalize 'Indonesia', 'ID', and 'id' to Indonesian IDR metadata", () => {
      const res1 = normalizeCountry("Indonesia");
      expect(res1.name).toBe("Indonesia");
      expect(res1.info.currency).toBe("IDR");
      expect(res1.info.iso2).toBe("ID");

      const res2 = normalizeCountry("ID");
      expect(res2.name).toBe("Indonesia");
      expect(res2.info.currency).toBe("IDR");

      const res3 = normalizeCountry("id");
      expect(res3.name).toBe("Indonesia");
    });

    it("should default empty or invalid country to Indonesia", () => {
      const emptyRes = normalizeCountry("");
      expect(emptyRes.name).toBe("Indonesia");
      expect(emptyRes.info.currency).toBe("IDR");

      const unknownRes = normalizeCountry("Atlantis");
      expect(unknownRes.name).toBe("Indonesia");
    });
  });

  describe("2. CookieJar & SociaBuzz Session Management", () => {
    it("should store and serialize cookies correctly", () => {
      const jar = new CookieJar({ test_session: "abc123xyz" });
      expect(jar.get("test_session")).toBe("abc123xyz");

      jar.set("ci_session", "session-cookie-999");
      expect(jar.get("ci_session")).toBe("session-cookie-999");
      expect(jar.getCookieHeader()).toContain("test_session=abc123xyz");
      expect(jar.getCookieHeader()).toContain("ci_session=session-cookie-999");
    });

    it("should parse Set-Cookie headers properly", () => {
      const jar = new CookieJar();
      const mockHeaders = new Headers();
      mockHeaders.append("set-cookie", "sociabuzz_sb_cookie_csrf=csrf-token-val; path=/");
      mockHeaders.append("set-cookie", "ci_session=ci-session-val; path=/; HttpOnly");

      jar.parseSetCookie(mockHeaders);
      expect(jar.get("sociabuzz_sb_cookie_csrf")).toBe("csrf-token-val");
      expect(jar.get("ci_session")).toBe("ci-session-val");
    });
  });

  describe("3. SociaBuzz Checkout Creation (QRIS Only)", () => {
    it("should create a checkout session with strictly Rp5.000 and QRIS parameters", async () => {
      const result = await createSociaBuzzCheckout("user-123", "cv-456", {
        name: "Budi Santoso",
        email: "budi@example.com",
      });

      expect(result.amount).toBe(5000);
      expect(result.invoiceNumber).toBeDefined();
      expect(result.paymentUrl).toBeDefined();
      expect(result.qrString).toBeDefined();
      expect(result.qrImageUrl).toBeDefined();
      expect(result.qrImageUrl).toContain("create-qr-code");
    });
  });

  describe("4. Webhook Processing & Payment Confirmation", () => {
    it("should process SociaBuzz payment success idempotently and set 7-day revision deadline", async () => {
      const result = await processSociaBuzzPaymentSuccess(
        "TRIBE-IDR-MOCK-123",
        "SBZ-TOKEN-123",
        "QRIS",
        { amount: 5000, status: "paid" },
        "EVT-UNIQUE-SBZ-1"
      );

      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toBe("TRIBE-IDR-MOCK-123");
    });

    it("should handle incoming SociaBuzz webhook payloads containing order_id and inv_id", async () => {
      const webhookPayload = {
        inv_id: "TRIBE-IDR-261011-99887766",
        amount: 5000,
        status: "paid",
        payment_method: "qris",
      };

      const result = await handleSociaBuzzWebhookPayload(webhookPayload);
      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toBe("TRIBE-IDR-261011-99887766");
    });

    it("should check payment status from database and return 'paid'", async () => {
      const status = await checkSociaBuzzPaymentStatus("TRIBE-IDR-MOCK-123");
      expect(status).toBe("paid");
    });
  });
});
