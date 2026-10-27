import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { hashIpAddress, isIpAllowed } from "@/lib/admin/admin-guard";
import nextConfig from "../../next.config";

describe("Tahap 1: Admin, API Keys & Feature Flags Schema and Security", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261026000001_admin_and_api_keys.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  describe("1. Database Schema Integrity", () => {
    it("adds role column to profiles with user and admin constraints", () => {
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'");
      expect(sql).toContain("CHECK (role IN ('user', 'admin'))");
    });

    it("prevents regular users from modifying their own role column", () => {
      expect(sql).toContain("Users can update their own profile except role");
      expect(sql).toContain("role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())");
    });

    it("creates api_keys table with all required operational columns", () => {
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.api_keys");
      expect(sql).toContain("provider TEXT NOT NULL CHECK (provider IN ('gemini', 'doku', 'job_api', 'turnstile', 'smtp', 'other'))");
      expect(sql).toContain("encrypted_key TEXT NOT NULL");
      expect(sql).toContain("last_four_chars TEXT NOT NULL");
      expect(sql).toContain("status TEXT NOT NULL DEFAULT 'aktif'");
      expect(sql).toContain("cooldown_until TIMESTAMPTZ");
    });

    it("creates admin_audit_log, app_settings, and feature_flags tables", () => {
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.admin_audit_log");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.app_settings");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.feature_flags");
    });
  });

  describe("2. Strict RLS Access Control on api_keys", () => {
    it("enables RLS on api_keys and limits access strictly to service_role", () => {
      expect(sql).toContain("ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;");
      expect(sql).toContain("CREATE POLICY \"Service role full access on api_keys\"");
      expect(sql).toContain("auth.role() = 'service_role'");

      // Verify ZERO client policies exist for api_keys
      expect(sql).not.toMatch(/CREATE\s+POLICY\s+.*ON\s+public\.api_keys.*FOR\s+SELECT.*USING\s*\(\s*true\s*\)/i);
      expect(sql).not.toMatch(/CREATE\s+POLICY\s+.*ON\s+public\.api_keys.*FOR\s+SELECT.*auth\.uid\(\)/i);
    });
  });

  describe("3. Admin Guard & IP Utilities", () => {
    it("hashes IP addresses into an anonymized 16-character hex string", () => {
      const hash1 = hashIpAddress("192.168.1.1");
      const hash2 = hashIpAddress("192.168.1.1");
      const hashOther = hashIpAddress("10.0.0.1");

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
      expect(hash1).not.toBe(hashOther);
      expect(hashIpAddress("")).toBe("unknown");
    });

    it("correctly evaluates IP allowlist", () => {
      // With no env variable, allows all
      delete process.env.ADMIN_IP_ALLOWLIST;
      expect(isIpAllowed("1.2.3.4")).toBe(true);

      // With specific IPs
      process.env.ADMIN_IP_ALLOWLIST = "127.0.0.1, 10.0.0.1";
      expect(isIpAllowed("127.0.0.1")).toBe(true);
      expect(isIpAllowed("10.0.0.1")).toBe(true);
      expect(isIpAllowed("192.168.1.1")).toBe(false);

      delete process.env.ADMIN_IP_ALLOWLIST;
    });
  });

  describe("4. Security Headers for /admin", () => {
    it("sets X-Robots-Tag: noindex, nofollow on /admin routes", async () => {
      const headersConfig = await nextConfig.headers!();
      const adminRule = headersConfig.find((h) => h.source === "/admin/:path*");

      expect(adminRule).toBeDefined();
      const robotsHeader = adminRule?.headers.find((header) => header.key === "X-Robots-Tag");
      expect(robotsHeader?.value).toContain("noindex");
      expect(robotsHeader?.value).toContain("nofollow");
    });
  });
});
