import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://mock-supabase-project.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("mock-anon-key-for-development-and-testing"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("mock-service-role-key-for-server-actions"),

  // Google Gemini API
  GEMINI_API_KEY: z.string().default("mock-gemini-key"),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash"),
  GEMINI_FALLBACK_MODEL: z.string().default("gemini-3.5-flash-lite"),

  // DOKU Payment
  DOKU_CLIENT_ID: z.string().default("MOCK-DOKU-CLIENT-ID"),
  DOKU_SECRET_KEY: z.string().default("mock-doku-secret-key-32charslong!!"),
  DOKU_BASE_URL: z.string().url().default("https://api-sandbox.doku.com"),
  DOKU_NOTIFICATION_URL: z.string().url().default("http://localhost:3000/api/payments/webhook"),

  // Google OAuth & Sheets API
  GOOGLE_CLIENT_ID: z.string().default("mock-google-client-id.apps.googleusercontent.com"),
  GOOGLE_CLIENT_SECRET: z.string().default("mock-google-client-secret"),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:3000/api/auth/google/callback"),

  // Data Encryption (AES-256-GCM requires 32-byte key = 64 hex characters)
  ENCRYPTION_KEY: z
    .string()
    .min(32)
    .default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  KEY_ENCRYPTION_SECRET: z
    .string()
    .min(32)
    .optional(),

  // Upstash Redis (Rate limiting and AI queue)
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),

  // Price (in IDR)
  NEXT_PUBLIC_PRICE_IDR: z.coerce.number().default(5000),

  // Monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // If running in Node.js CLI/scripts without Next.js preloading .env.local
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && typeof process !== "undefined" && process.cwd) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("node:fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("node:path");
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const idx = trimmed.indexOf("=");
            if (idx !== -1) {
              const k = trimmed.slice(0, idx).trim();
              const v = trimmed.slice(idx + 1).trim();
              if (!process.env[k]) {
                process.env[k] = v;
              }
            }
          }
        }
      }
    } catch {}
  }

  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL,
    DOKU_CLIENT_ID: process.env.DOKU_CLIENT_ID,
    DOKU_SECRET_KEY: process.env.DOKU_SECRET_KEY,
    DOKU_BASE_URL: process.env.DOKU_BASE_URL,
    DOKU_NOTIFICATION_URL: process.env.DOKU_NOTIFICATION_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    KEY_ENCRYPTION_SECRET: process.env.KEY_ENCRYPTION_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_PRICE_IDR: process.env.NEXT_PUBLIC_PRICE_IDR,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Application startup aborted due to invalid environment variables.");
  }

  return result.data;
}

export const env = validateEnv();
