import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

describe("Security Headers Configuration", () => {
  it("should have all required security headers configured", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("nextConfig.headers should be a function");
    }

    const headerConfigs = await nextConfig.headers();
    expect(headerConfigs.length).toBeGreaterThan(0);

    const rootConfig = headerConfigs.find((h) => h.source === "/:path*");
    expect(rootConfig).toBeDefined();

    const headerMap = new Map(
      rootConfig!.headers.map((h) => [h.key, h.value])
    );

    // 1. Strict-Transport-Security
    expect(headerMap.get("Strict-Transport-Security")).toContain(
      "max-age=63072000"
    );

    // 2. X-Frame-Options
    expect(headerMap.get("X-Frame-Options")).toBe("DENY");

    // 3. X-Content-Type-Options
    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");

    // 4. Referrer-Policy
    expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");

    // 5. Content-Security-Policy
    const csp = headerMap.get("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("https://generativelanguage.googleapis.com");
  });
});
