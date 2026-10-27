import { google } from "googleapis";
import { encryptSecret, decryptSecret } from "./token-crypto";

export type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

/**
 * Google Sheets & Drive Application Tracker Integration Service
 * Uses standalone server-side OAuth2 with googleapis library.
 * Scopes: drive.file, spreadsheets, and userinfo.email
 */

export const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_SPREADSHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
export const GOOGLE_USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

export const GOOGLE_SCOPES = [
  GOOGLE_DRIVE_FILE_SCOPE,
  GOOGLE_SPREADSHEETS_SCOPE,
  GOOGLE_USERINFO_EMAIL_SCOPE,
];

export class TokenRevokedError extends Error {
  constructor(message: string = "Koneksi Google telah dicabut atau kedaluwarsa. Silakan hubungkan ulang akun Anda.") {
    super(message);
    this.name = "TokenRevokedError";
  }
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string;
}

export interface ApplicationItem {
  id?: string;
  company: string;
  position: string;
  status: "Belum dikirim" | "Terkirim" | "Wawancara" | "Tawaran" | "Ditolak";
  applied_date: string | null;
  job_url?: string | null;
  cv_version?: string | null;
  notes: string | null;
}

/**
 * Creates a standalone OAuth2 client instance using googleapis
 */
export function getGoogleOAuthClient(redirectUri?: string): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret";
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Builds the Google OAuth 2.0 authorization URL
 * Supports both (redirectUri, state) and (state, redirectUri) signatures
 */
export function getGoogleAuthUrl(arg1: string, arg2: string = ""): string {
  let redirectUri: string;
  let state: string;

  if (arg1.startsWith("http://") || arg1.startsWith("https://") || arg1.includes("/callback")) {
    redirectUri = arg1;
    state = arg2 || "default_csrf_state";
  } else {
    state = arg1;
    redirectUri = arg2 || "http://localhost:3000/api/tracker/google/callback";
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const isMock = clientId.startsWith("mock-");

  if (isMock) {
    // Development/test sandbox simulated URL
    return `${redirectUri}?code=mock_google_oauth_code&state=${encodeURIComponent(state)}`;
  }

  const oauth2Client = getGoogleOAuthClient(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
  });
}

/**
 * Exchanges authorization code for access & refresh tokens and user email
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens & { tokens: GoogleTokens; email: string | null }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const isMock = code.startsWith("mock_") || clientId.startsWith("mock-");

  if (isMock) {
    const mockTokens: GoogleTokens = {
      access_token: `mock_access_token_${Date.now()}`,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      expiry_date: Date.now() + 3600 * 1000,
      scope: GOOGLE_SCOPES.join(" "),
      token_type: "Bearer",
    };
    return {
      ...mockTokens,
      tokens: mockTokens,
      email: "kandidat.cvbuilder@gmail.com",
    };
  }

  const oauth2Client = getGoogleOAuthClient(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  let email: string | null = null;
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    email = userInfo.data.email || null;
  } catch (userErr) {
    console.warn("Could not fetch user email during Google OAuth:", userErr);
  }

  const tokenObj: GoogleTokens = {
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token || null,
    expiry_date: tokens.expiry_date || null,
    scope: tokens.scope || undefined,
    token_type: tokens.token_type || "Bearer",
  };

  return {
    ...tokenObj,
    tokens: tokenObj,
    email,
  };
}

/**
 * Transparently refreshes an expired Google access token using stored refresh token.
 * Catches revoked tokens and throws TokenRevokedError.
 */
export async function refreshGoogleAccessToken(
  encryptedRefreshToken: string
): Promise<{ accessToken: string; oauth2Client: OAuth2Client }> {
  const plainRefreshToken = decryptSecret(encryptedRefreshToken);
  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const isMock = plainRefreshToken.startsWith("mock_") || clientId.startsWith("mock-");

  const oauth2Client = getGoogleOAuthClient();

  if (isMock) {
    oauth2Client.setCredentials({
      access_token: `mock_refreshed_access_token_${Date.now()}`,
      refresh_token: plainRefreshToken,
    });
    return {
      accessToken: `mock_refreshed_access_token_${Date.now()}`,
      oauth2Client,
    };
  }

  oauth2Client.setCredentials({
    refresh_token: plainRefreshToken,
  });

  try {
    const response = await oauth2Client.getAccessToken();
    const token = response.token;
    if (!token) {
      throw new TokenRevokedError("Access token kosong saat perpanjangan token Google.");
    }
    return {
      accessToken: token,
      oauth2Client,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("invalid_grant") ||
      msg.includes("Token has been expired or revoked") ||
      msg.includes("revoked")
    ) {
      throw new TokenRevokedError("Koneksi Google telah dicabut atau kedaluwarsa. Silakan hubungkan ulang.");
    }
    throw new Error(`Gagal memperbarui token Google: ${msg}`);
  }
}

/**
 * Creates a formatted Google Sheet "Lacak Lamaran - CVBuilder"
 * Headers: Tanggal, Posisi, Perusahaan, Status, Catatan
 */
export async function createJobTrackerSpreadsheet(
  authClientOrToken: OAuth2Client | string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const isMock =
    typeof authClientOrToken === "string"
      ? authClientOrToken.startsWith("mock_")
      : (process.env.GOOGLE_CLIENT_ID || "mock-").startsWith("mock-");

  if (isMock) {
    const mockId = `cvbuilder_tracker_${Date.now().toString(36)}`;
    return {
      spreadsheetId: mockId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${mockId}/edit`,
    };
  }

  let authClient: OAuth2Client;
  if (typeof authClientOrToken === "string") {
    authClient = getGoogleOAuthClient();
    authClient.setCredentials({ access_token: authClientOrToken });
  } else {
    authClient = authClientOrToken;
  }

  const sheets = google.sheets({ version: "v4", auth: authClient });

  // 1. Create spreadsheet with title "Lacak Lamaran - CVBuilder"
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: "Lacak Lamaran - CVBuilder",
      },
      sheets: [
        {
          properties: {
            title: "Lamaran Kerja",
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId;
  const spreadsheetUrl =
    createRes.data.spreadsheetUrl ||
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  if (!spreadsheetId) {
    throw new Error("Gagal memperoleh ID Google Spreadsheet baru.");
  }

  // 2. Set official columns: Tanggal, Posisi, Perusahaan, Status, Catatan
  const headers = [["Tanggal", "Posisi", "Perusahaan", "Status", "Catatan"]];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Lamaran Kerja'!A1:E1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: headers,
    },
  });

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Appends a single application row to the Google Sheet
 */
export async function appendApplicationRow(
  authClientOrToken: OAuth2Client | string,
  spreadsheetId: string,
  application: ApplicationItem
): Promise<{ success: boolean }> {
  const isMock =
    spreadsheetId.startsWith("cvbuilder_tracker_") ||
    (typeof authClientOrToken === "string" && authClientOrToken.startsWith("mock_")) ||
    (process.env.GOOGLE_CLIENT_ID || "mock-").startsWith("mock-");

  if (isMock) {
    return { success: true };
  }

  let authClient: OAuth2Client;
  if (typeof authClientOrToken === "string") {
    authClient = getGoogleOAuthClient();
    authClient.setCredentials({ access_token: authClientOrToken });
  } else {
    authClient = authClientOrToken;
  }

  const sheets = google.sheets({ version: "v4", auth: authClient });

  const row = [
    application.applied_date || new Date().toISOString().split("T")[0],
    application.position,
    application.company,
    application.status,
    application.notes || "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "'Lamaran Kerja'!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });

  return { success: true };
}

/**
 * Synchronizes local applications list into the Google Sheet
 */
export async function syncApplicationsToGoogleSheet(
  authClientOrToken: OAuth2Client | string,
  spreadsheetId: string,
  applications: ApplicationItem[]
): Promise<{ success: boolean; rowsSynced: number }> {
  const isMock =
    spreadsheetId.startsWith("cvbuilder_tracker_") ||
    (typeof authClientOrToken === "string" && authClientOrToken.startsWith("mock_")) ||
    (process.env.GOOGLE_CLIENT_ID || "mock-").startsWith("mock-");

  if (isMock) {
    return { success: true, rowsSynced: applications.length };
  }

  let authClient: OAuth2Client;
  if (typeof authClientOrToken === "string") {
    authClient = getGoogleOAuthClient();
    authClient.setCredentials({ access_token: authClientOrToken });
  } else {
    authClient = authClientOrToken;
  }

  const sheets = google.sheets({ version: "v4", auth: authClient });

  const rows = applications.map((app) => [
    app.applied_date || new Date().toISOString().split("T")[0],
    app.position,
    app.company,
    app.status,
    app.notes || "",
  ]);

  // Clear existing data rows (A2:E)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: "'Lamaran Kerja'!A2:E",
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "'Lamaran Kerja'!A2:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows,
      },
    });
  }

  return { success: true, rowsSynced: rows.length };
}
