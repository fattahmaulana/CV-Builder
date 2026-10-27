import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Environment Variables Validation (Zod)", () => {
  const envTestSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_MODEL: z.string().min(1),
    GEMINI_FALLBACK_MODEL: z.string().min(1),
    DOKU_CLIENT_ID: z.string().min(1),
    DOKU_SECRET_KEY: z.string().min(1),
    DOKU_BASE_URL: z.string().url(),
    ENCRYPTION_KEY: z.string().min(32),
    NEXT_PUBLIC_PRICE_IDR: z.coerce.number().min(1000),
  });

  it("should validate a correct environment config successfully", () => {
    const validConfig = {
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://cvbuilder.id",
      NEXT_PUBLIC_SUPABASE_URL: "https://xyz.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-valid",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-valid",
      GEMINI_API_KEY: "gemini-api-key-valid",
      GEMINI_MODEL: "gemini-2.0-flash",
      GEMINI_FALLBACK_MODEL: "gemini-1.5-flash",
      DOKU_CLIENT_ID: "MALLID-1234",
      DOKU_SECRET_KEY: "secret-key-32-chars-length-doku!!",
      DOKU_BASE_URL: "https://api.doku.com",
      ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      NEXT_PUBLIC_PRICE_IDR: "5000",
    };

    const parsed = envTestSchema.safeParse(validConfig);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.NEXT_PUBLIC_PRICE_IDR).toBe(5000);
      expect(parsed.data.GEMINI_MODEL).toBe("gemini-2.0-flash");
    }
  });

  it("should fail validation if an essential secret is missing or invalid URL", () => {
    const invalidConfig = {
      NEXT_PUBLIC_APP_URL: "not-a-valid-url",
      NEXT_PUBLIC_SUPABASE_URL: "invalid-url",
      ENCRYPTION_KEY: "short", // less than 32 chars
    };

    const parsed = envTestSchema.safeParse(invalidConfig);
    expect(parsed.success).toBe(false);
  });
});
