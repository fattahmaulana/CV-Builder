import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  GOOGLE_DRIVE_FILE_SCOPE,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  createJobTrackerSpreadsheet,
  syncApplicationsToGoogleSheet,
  ApplicationItem,
} from "@/lib/sheets/google-sheets-service";
import { encryptSecret, decryptSecret } from "@/lib/sheets/token-crypto";
import {
  TrackerClient,
  ApplicationRecord,
} from "@/components/tracker/TrackerClient";

describe("Phase 7: Google Sheets Application Tracker (Neobrutalist)", () => {
  describe("1. Security & OAuth drive.file Scope", () => {
    it("should strictly enforce Google Drive scope to drive.file", () => {
      expect(GOOGLE_DRIVE_FILE_SCOPE).toBe("https://www.googleapis.com/auth/drive.file");
      expect(GOOGLE_DRIVE_FILE_SCOPE).not.toContain("drive.readonly");
      expect(GOOGLE_DRIVE_FILE_SCOPE).not.toBe("https://www.googleapis.com/auth/drive");
    });

    it("should construct valid Google OAuth authorization URL with prompt=consent", () => {
      const orig = process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_ID = "live-client-id-123.apps.googleusercontent.com";

      const authUrl = getGoogleAuthUrl(
        "user_uuid_999",
        "https://cvbuilder.id/api/tracker/google/callback"
      );

      expect(authUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(authUrl).toContain("scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file");
      expect(authUrl).toContain("prompt=consent");
      expect(authUrl).toContain("access_type=offline");
      expect(authUrl).toContain("state=user_uuid_999");

      process.env.GOOGLE_CLIENT_ID = orig;
    });

    it("should encrypt and decrypt refresh tokens with authenticated AES-256-GCM", () => {
      const sensitiveRefreshToken = "1//04_mock_secret_google_oauth_refresh_token_xyz";
      const encrypted = encryptSecret(sensitiveRefreshToken);

      expect(encrypted).not.toBe(sensitiveRefreshToken);
      expect(encrypted.split(":").length).toBe(3); // iv:authTag:ciphertext

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(sensitiveRefreshToken);
    });
  });

  describe("2. Google Sheets Integration & Row Mapping", () => {
    it("should create a formatted job tracker sheet ID in sandbox environment", async () => {
      const { spreadsheetId, spreadsheetUrl } = await createJobTrackerSpreadsheet("mock_access_token_123");

      expect(spreadsheetId).toBeDefined();
      expect(spreadsheetId).toContain("cvbuilder_tracker_");
      expect(spreadsheetUrl).toContain("https://docs.google.com/spreadsheets/d/");
    });

    it("should sync structured application items to Google Sheet correctly", async () => {
      const sampleApps: ApplicationItem[] = [
        {
          id: "app-101",
          company: "PT Telekomunikasi Indonesia Tbk",
          position: "Frontend Engineer",
          status: "Wawancara",
          applied_date: "2026-10-25",
          job_url: "https://careers.telkom.co.id/job/101",
          cv_version: "ATS Harvard",
          notes: "Interview HR pukul 14.00 WIB",
        },
      ];

      const syncResult = await syncApplicationsToGoogleSheet(
        "mock_access_token",
        "mock-sheet-id",
        sampleApps
      );

      expect(syncResult.success).toBe(true);
      expect(syncResult.rowsSynced).toBe(1);
    });
  });

  describe("3. Neobrutalist UI Rendering for TrackerClient", () => {
    const mockApplications: ApplicationRecord[] = [
      {
        id: "app-1",
        company: "PT GoTo Gojek Tokopedia",
        position: "Software Engineer",
        status: "Wawancara",
        applied_date: "2026-10-24",
        job_url: "https://goto.com/careers",
        cv_version: "ATS Harvard",
        notes: "Technical test selesai",
        created_at: new Date().toISOString(),
      },
      {
        id: "app-2",
        company: "PT Bank Central Asia Tbk",
        position: "IT Management Trainee",
        status: "Terkirim",
        applied_date: "2026-10-25",
        job_url: null,
        cv_version: "ATS Harvard",
        notes: null,
        created_at: new Date().toISOString(),
      },
    ];

    it("should render Neobrutalist tokens: 3px black borders, hard-drop, and flat color stats", () => {
      const html = renderToStaticMarkup(
        React.createElement(TrackerClient, {
          initialApplications: mockApplications,
        })
      );

      // Verify Neobrutalism tokens
      expect(html).toContain("border-[3px]");
      expect(html).toContain("border-black");
      expect(html).toContain("shadow-[6px_6px_0_0_#000]");
      expect(html).toContain("hard-drop");

      // Verify Header and Badges
      expect(html).toContain("Manajemen Karir");
      expect(html).toContain("Pelacak Lamaran Kerja");
      expect(html).toContain("Tambah Lamaran Baru");

      // Verify 5 Stat Cards
      expect(html).toContain("Total Dilamar");
      expect(html).toContain("Terkirim");
      expect(html).toContain("Wawancara");
      expect(html).toContain("Tawaran (Offer)");
      expect(html).toContain("Ditolak");

      // Verify Applications in table
      expect(html).toContain("PT GoTo Gojek Tokopedia");
      expect(html).toContain("PT Bank Central Asia Tbk");
      expect(html).toContain("Software Engineer");
      expect(html).toContain("IT Management Trainee");
    });

    it("should render empty state with Tambah Lamaran Pertama CTA without Google Sheets box", () => {
      const html = renderToStaticMarkup(
        React.createElement(TrackerClient, {
          initialApplications: [],
        })
      );

      expect(html).not.toContain("Belum Terhubung");
      expect(html).not.toContain("drive.file");
      expect(html).toContain("Belum ada lamaran yang tercatat");
      expect(html).toContain("Tambah Lamaran Pertama");
    });
  });
});
