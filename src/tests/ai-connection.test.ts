import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  encryptApiKey,
  decryptApiKey,
  verifyEncryptionKeyHealth,
  testGeminiKey,
  validateGeminiModels,
  getKeyPoolCooldownStatus,
  getOptimalApiKey,
  recordKeyUsage,
  __setMockDbKeys,
  AiQueueFullError,
  AiUnavailableError,
} from "@/lib/admin/api-key-manager";
import fs from "fs";
import path from "path";

describe("MASALAH 4: AI Connection, Key Pool, Rotation & Security", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    __setMockDbKeys([]);
  });

  afterEach(() => {
    process.env = originalEnv;
    __setMockDbKeys([]);
  });

  describe("1. Key Encryption & Decryption (ENCRYPTION_MASTER_KEY)", () => {
    it("should encrypt and decrypt keys cleanly with ENCRYPTION_MASTER_KEY", () => {
      process.env.ENCRYPTION_MASTER_KEY = "master-secret-key-for-cvbuilder-ai-test-suite";
      const sampleKey = "AIzaSyD-sample-gemini-api-key-1234567890";

      const encrypted = encryptApiKey(sampleKey);
      expect(encrypted).not.toEqual(sampleKey);
      expect(encrypted.split(":")).toHaveLength(3); // iv:authTag:ciphertext

      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(sampleKey);
    });

    it("should pass verifyEncryptionKeyHealth round-trip check", () => {
      const health = verifyEncryptionKeyHealth();
      expect(health.healthy).toBe(true);
      expect(health.error).toBeUndefined();
    });

    it("should throw error on tampered encrypted payload", () => {
      const encrypted = encryptApiKey("valid-key");
      const parts = encrypted.split(":");
      // Corrupt the ciphertext
      const tampered = `${parts[0]}:${parts[1]}:deadbeef`;
      expect(() => decryptApiKey(tampered)).toThrow();
    });
  });

  describe("2. Key Diagnostics & Differentiated Status Handling", () => {
    it("should handle mock key with status 'aktif' and 200 code", async () => {
      const res = await testGeminiKey("mock-gemini-key", "gemini-2.0-flash");
      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(res.status).toBe("aktif");
    });

    it("should return tidak_valid on empty API key", async () => {
      const res = await testGeminiKey("");
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.status).toBe("tidak_valid");
    });

    it("should validate models registry via validateGeminiModels", async () => {
      const val = await validateGeminiModels("mock-gemini-key", "gemini-2.0-flash", "gemini-1.5-flash");
      expect(val.valid).toBe(true);
      expect(val.primaryAvailable).toBe(true);
      expect(val.fallbackAvailable).toBe(true);
      expect(val.models).toContain("gemini-2.0-flash");
    });
  });

  describe("3. Key Rotation & 429 Cooldown Simulation", () => {
    it("should rotate from rate-limited key to next active key in pool", async () => {
      const now = new Date().toISOString();
      __setMockDbKeys([
        {
          id: "key-primary",
          provider: "gemini",
          label: "Primary Key",
          last_four_chars: "1111",
          masked_key: "AIza...1111",
          status: "aktif",
          priority: 2,
          weight: 1,
          requests_today: 0,
          errors_today: 0,
          cooldown_until: null,
          last_used_at: null,
          last_error: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: "key-backup",
          provider: "gemini",
          label: "Backup Key",
          last_four_chars: "2222",
          masked_key: "AIza...2222",
          status: "aktif",
          priority: 1,
          weight: 1,
          requests_today: 0,
          errors_today: 0,
          cooldown_until: null,
          last_used_at: null,
          last_error: null,
          created_at: now,
          updated_at: now,
        },
      ]);

      // 1. Initial selection
      const key1 = await getOptimalApiKey("gemini");
      expect(key1?.id).toBe("key-primary");

      // 2. Simulate 429 rate limit error on primary key
      await recordKeyUsage("key-primary", 200, 429, "Resource exhausted (429)");

      // 3. Optimal key should now rotate to key-backup
      const key2 = await getOptimalApiKey("gemini");
      expect(key2?.id).toBe("key-backup");

      // 4. Exclude attempted keys if both tried
      const key3 = await getOptimalApiKey("gemini", ["key-backup"]);
      // primary is in cooldown, so key3 is null or env fallback
      expect(key3?.id).not.toBe("key-primary");
    });

    it("should report queue full with retry countdown when all keys in cooldown", async () => {
      const futureCooldown = new Date(Date.now() + 45_000).toISOString();
      __setMockDbKeys([
        {
          id: "cooldown-key",
          provider: "gemini",
          label: "Cooldown Key",
          last_four_chars: "9999",
          masked_key: "AIza...9999",
          status: "cooldown",
          priority: 1,
          weight: 1,
          requests_today: 100,
          errors_today: 1,
          cooldown_until: futureCooldown,
          last_used_at: null,
          last_error: "Rate limit",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const poolStatus = await getKeyPoolCooldownStatus("gemini");
      expect(poolStatus.hasActiveKey).toBe(false);
      expect(poolStatus.inCooldownCount).toBe(1);
      expect(poolStatus.earliestCooldownSeconds).toBeGreaterThan(0);
      expect(poolStatus.earliestCooldownSeconds).toBeLessThanOrEqual(45);
    });

    it("should instantiate AiQueueFullError and AiUnavailableError with friendly Indonesian text", () => {
      const queueErr = new AiQueueFullError(25);
      expect(queueErr.name).toBe("AiQueueFullError");
      expect(queueErr.retryAfterSeconds).toBe(25);
      expect(queueErr.message).toContain("Antrean AI penuh, coba lagi sekitar 25 detik");

      const unavailErr = new AiUnavailableError();
      expect(unavailErr.name).toBe("AiUnavailableError");
      expect(unavailErr.message).toContain("AI sedang tidak tersedia");
    });
  });

  describe("4. Security: Zero API Key Leaks to Client Bundles", () => {
    it("should confirm sensitive env keys never have NEXT_PUBLIC_ prefix in .env.local", () => {
      const envLocalPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envLocalPath)) {
        const content = fs.readFileSync(envLocalPath, "utf-8");
        const lines = content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

        for (const line of lines) {
          const [key] = line.split("=");
          if (/GEMINI_API_KEY|ENCRYPTION_KEY|SERVICE_ROLE|DOKU_SECRET|GOOGLE_CLIENT_SECRET/i.test(key)) {
            expect(key).not.toMatch(/^NEXT_PUBLIC_/);
          }
        }
      }
    });

    it("should verify no client components ('use client') import @google/genai or api-key-manager directly", () => {
      const componentsDir = path.resolve(process.cwd(), "src", "components");
      const clientFiles: string[] = [];

      function scanDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
            const code = fs.readFileSync(fullPath, "utf-8");
            if (code.includes('"use client"') || code.includes("'use client'")) {
              clientFiles.push(fullPath);
            }
          }
        }
      }

      scanDir(componentsDir);

      for (const file of clientFiles) {
        const code = fs.readFileSync(file, "utf-8");
        expect(code).not.toContain("@google/genai");
        expect(code).not.toContain("api-key-manager");
        expect(code).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      }
    });
  });
});
