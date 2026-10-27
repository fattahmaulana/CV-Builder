import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  ApiKeyRecord,
} from "@/lib/admin/api-key-manager";
import { hashIpAddress, isIpAllowed } from "@/lib/admin/admin-guard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

describe("Phase 4: Admin Panel & API Key Manager", () => {
  const sampleKey = "AIzaSyD-AbCdEf1234567890_xYz9xQ2";

  describe("Cryptographic API Key Management (AES-256-GCM)", () => {
    it("should encrypt and decrypt Gemini API keys using AES-256-GCM", () => {
      const encrypted = encryptApiKey(sampleKey);

      expect(encrypted).not.toBe(sampleKey);
      // Must be formatted as ivHex:authTagHex:ciphertextHex
      const parts = encrypted.split(":");
      expect(parts.length).toBe(3);
      expect(parts[0].length).toBe(24); // 12 bytes IV = 24 hex chars
      expect(parts[1].length).toBe(32); // 16 bytes GCM auth tag = 32 hex chars

      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(sampleKey);
    });

    it("should reject tampered ciphertext with cryptographic tag verification error", () => {
      const encrypted = encryptApiKey(sampleKey);
      const [ivHex, authTagHex, cipherHex] = encrypted.split(":");

      // Tamper ciphertext
      const tamperedCipher = cipherHex.slice(0, -2) + "00";
      const tamperedPayload = `${ivHex}:${authTagHex}:${tamperedCipher}`;

      expect(() => decryptApiKey(tamperedPayload)).toThrow();
    });

    it("should mask key display in UI showing only 4 trailing characters", () => {
      const masked = maskApiKey(sampleKey);
      expect(masked).toBe("AIza...9xQ2");
      expect(masked).not.toContain("AbCdEf1234567890");
    });
  });

  describe("Admin IP Hashing & Allowlist Guard", () => {
    it("should generate consistent 16-char SHA-256 IP hash for privacy in audit logs", () => {
      const ip = "192.168.1.100";
      const hash1 = hashIpAddress(ip);
      const hash2 = hashIpAddress(ip);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(16);
      expect(hash1).not.toContain(ip);
    });

    it("should evaluate IP allowlist accurately", () => {
      // Default empty allowlist allows all
      delete process.env.ADMIN_IP_ALLOWLIST;
      expect(isIpAllowed("10.0.0.1")).toBe(true);

      process.env.ADMIN_IP_ALLOWLIST = "203.0.113.5, 198.51.100.2";
      expect(isIpAllowed("203.0.113.5")).toBe(true);
      expect(isIpAllowed("192.168.1.1")).toBe(false);

      delete process.env.ADMIN_IP_ALLOWLIST;
    });
  });

  describe("Neobrutalist Admin Dashboard UI", () => {
    const mockKeys: ApiKeyRecord[] = [
      {
        id: "key-1",
        provider: "gemini",
        label: "Gemini Primary",
        last_four_chars: "9xQ2",
        masked_key: "AIza...9xQ2",
        status: "aktif",
        priority: 2,
        weight: 1,
        requests_today: 14,
        errors_today: 0,
        cooldown_until: null,
        last_used_at: new Date().toISOString(),
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "key-2",
        provider: "gemini",
        label: "Gemini Backup",
        last_four_chars: "kL88",
        masked_key: "AIza...kL88",
        status: "cooldown",
        priority: 1,
        weight: 1,
        requests_today: 85,
        errors_today: 2,
        cooldown_until: new Date(Date.now() + 45000).toISOString(),
        last_used_at: new Date().toISOString(),
        last_error: "HTTP 429 Rate Limit",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockFlags = [
      { key: "job_directory", enabled: true, description: "Direktori lowongan" },
      { key: "scene_3d", enabled: false, description: "3D scene" },
    ];

    const mockSettings = [
      { key: "price_idr", value: 5000, description: "Harga CV" },
      { key: "gemini_primary_model", value: "gemini-2.0-flash", description: "Model Gemini" },
    ];

    const mockLogs = [
      {
        id: "log-1",
        user_id: "admin-uid-1",
        action: "create_api_key",
        target_type: "api_keys",
        target_id: "key-1",
        ip_hash: "a1b2c3d4e5f67890",
        details: { provider: "gemini" },
        created_at: new Date().toISOString(),
      },
    ];

    it("should render Neobrutalist styling, token colors, and masked keys", () => {
      const html = renderToStaticMarkup(
        React.createElement(AdminDashboard, {
          adminEmail: "admin@cvbuilder.id",
          initialKeys: mockKeys,
          initialFlags: mockFlags,
          initialSettings: mockSettings,
          initialLogs: mockLogs,
        })
      );

      // Check admin identity & title
      expect(html).toContain("Panel Pusat Kendali CVBuilder");
      expect(html).toContain("admin@cvbuilder.id");

      // Check Neobrutalist design tokens
      expect(html).toContain("border-[3px] border-black");
      expect(html).toContain("bg-[var(--accent)]");
      expect(html).toContain("hard-drop");

      // Check masked keys and statuses
      expect(html).toContain("AIza...9xQ2");
      expect(html).toContain("Aktif");
      expect(html).toContain("AIza...kL88");
      expect(html).toContain("Cooldown 60s");

      // Check tabs
      expect(html).toContain("01 API Key Manager");
      expect(html).toContain("02 Feature Flags");
      expect(html).toContain("03 Pengaturan Sistem");
      expect(html).toContain("04 Audit Log");
    });
  });
});
