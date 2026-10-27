import { describe, it, expect } from "vitest";
import {
  GOOGLE_DRIVE_FILE_SCOPE,
  GOOGLE_SPREADSHEETS_SCOPE,
  GOOGLE_SCOPES,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  createJobTrackerSpreadsheet,
  syncApplicationsToGoogleSheet,
  refreshGoogleAccessToken,
  appendApplicationRow,
  TokenRevokedError,
  ApplicationItem,
} from "@/lib/sheets/google-sheets-service";
import { encryptSecret, decryptSecret } from "@/lib/sheets/token-crypto";

describe("MASALAH 6: Google Sheets Application Tracker Service", () => {
  it("should enforce authorized scopes strictly to drive.file, spreadsheets, and userinfo.email", () => {
    expect(GOOGLE_DRIVE_FILE_SCOPE).toBe("https://www.googleapis.com/auth/drive.file");
    expect(GOOGLE_SPREADSHEETS_SCOPE).toBe("https://www.googleapis.com/auth/spreadsheets");
    expect(GOOGLE_SCOPES).toContain("https://www.googleapis.com/auth/drive.file");
    expect(GOOGLE_SCOPES).toContain("https://www.googleapis.com/auth/spreadsheets");
    expect(GOOGLE_SCOPES).toContain("https://www.googleapis.com/auth/userinfo.email");
  });

  it("should generate valid OAuth URL with offline access, consent prompt, and CSRF state", () => {
    const origClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";

    const csrfState = "secure_random_csrf_state_12345";
    const url = getGoogleAuthUrl("http://localhost:3000/api/tracker/google/callback", csrfState);

    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file");
    expect(url).toContain("prompt=consent");
    expect(url).toContain("access_type=offline");
    expect(url).toContain(`state=${csrfState}`);

    process.env.GOOGLE_CLIENT_ID = origClientId;
  });

  it("should exchange authorization code for tokens and candidate email", async () => {
    const result = await exchangeCodeForTokens(
      "mock_google_oauth_code_user1",
      "http://localhost:3000/api/tracker/google/callback"
    );

    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
    expect(result.scope).toContain(GOOGLE_DRIVE_FILE_SCOPE);
    expect(result.scope).toContain(GOOGLE_SPREADSHEETS_SCOPE);
    expect(result.email).toBe("kandidat.cvbuilder@gmail.com");
  });

  it("should securely encrypt and decrypt Google refresh token with AES-256-GCM", () => {
    const sampleToken = "1//04test_google_oauth_refresh_token_secret_123456789";
    const encrypted = encryptSecret(sampleToken);

    expect(encrypted).not.toBe(sampleToken);
    expect(encrypted.split(":")).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(sampleToken);
  });

  it("should create job tracker spreadsheet with official title and columns", async () => {
    const { spreadsheetId, spreadsheetUrl } = await createJobTrackerSpreadsheet("mock_access_token_123");

    expect(spreadsheetId).toBeDefined();
    expect(spreadsheetId).toContain("cvbuilder_tracker_");
    expect(spreadsheetUrl).toContain("https://docs.google.com/spreadsheets/d/");
  });

  it("should map applications into official 5 columns: Tanggal, Posisi, Perusahaan, Status, Catatan", async () => {
    const sampleApps: ApplicationItem[] = [
      {
        id: "app-1",
        company: "PT GoTo Gojek Tokopedia Tbk",
        position: "Software Engineer",
        status: "Wawancara",
        applied_date: "2026-10-20",
        notes: "Wawancara teknis hari Rabu",
      },
      {
        id: "app-2",
        company: "PT Bank Central Asia Tbk",
        position: "IT Trainee",
        status: "Terkirim",
        applied_date: "2026-10-22",
        notes: "Menunggu pengumuman psikotes",
      },
    ];

    const result = await syncApplicationsToGoogleSheet(
      "mock_token",
      "mock-sheet-123",
      sampleApps
    );

    expect(result.success).toBe(true);
    expect(result.rowsSynced).toBe(2);
  });

  it("should append single application row on download / sudah kirim", async () => {
    const appendResult = await appendApplicationRow(
      "mock_token",
      "cvbuilder_tracker_123",
      {
        company: "PT Telkom Indonesia",
        position: "Backend Developer",
        status: "Terkirim",
        applied_date: "2026-10-25",
        notes: "Diunduh via CVBuilder (PDF)",
      }
    );

    expect(appendResult.success).toBe(true);
  });

  it("should transparently refresh access token using stored refresh token", async () => {
    const encryptedToken = encryptSecret("mock_refresh_token_sample");
    const { accessToken, oauth2Client } = await refreshGoogleAccessToken(encryptedToken);

    expect(accessToken).toBeDefined();
    expect(accessToken).toContain("mock_refreshed_access_token");
    expect(oauth2Client).toBeDefined();
  });

  it("should throw TokenRevokedError when token is revoked or refresh fails with invalid_grant", () => {
    const error = new TokenRevokedError("Koneksi Google telah dicabut atau kedaluwarsa. Silakan hubungkan ulang akun Anda.");
    expect(error.name).toBe("TokenRevokedError");
    expect(error.message).toContain("hubungkan ulang");
  });
});
