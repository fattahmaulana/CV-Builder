import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  refreshGoogleAccessToken,
  syncApplicationsToGoogleSheet,
  ApplicationItem,
  TokenRevokedError,
} from "@/lib/sheets/google-sheets-service";
import { decryptSecret } from "@/lib/sheets/token-crypto";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    // 1. Fetch Google Connection
    const { data: connection, error: connError } = await supabase
      .from("google_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_connected", true)
      .maybeSingle();

    if (connError || !connection || !connection.spreadsheet_id_encrypted) {
      return NextResponse.json(
        { error: "Google Sheets belum terhubung dengan akun Anda" },
        { status: 400 }
      );
    }

    // 2. Decrypt credentials
    const spreadsheetId = decryptSecret(connection.spreadsheet_id_encrypted);
    const refreshTokenEncrypted = connection.refresh_token_encrypted || "";

    if (!refreshTokenEncrypted) {
      return NextResponse.json(
        { error: "Token refresh tidak ditemukan. Silakan hubungkan ulang." },
        { status: 400 }
      );
    }

    // 3. Obtain fresh access token transparently
    let authData;
    try {
      authData = await refreshGoogleAccessToken(refreshTokenEncrypted);
    } catch (refreshErr) {
      if (refreshErr instanceof TokenRevokedError) {
        await supabase
          .from("google_connections")
          .update({
            needs_reconnect: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        return NextResponse.json(
          {
            code: "TOKEN_REVOKED",
            error: "Koneksi Google telah dicabut atau kedaluwarsa. Perlu hubungkan ulang.",
          },
          { status: 401 }
        );
      }
      throw refreshErr;
    }

    // 4. Fetch all user applications
    const { data: apps, error: appsError } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("applied_date", { ascending: false });

    if (appsError) {
      return NextResponse.json({ error: "Gagal memuat data lamaran" }, { status: 500 });
    }

    const applicationItems: ApplicationItem[] = (apps || []).map((app) => ({
      id: app.id,
      company: app.company,
      position: app.position,
      status: app.status,
      applied_date: app.applied_date,
      job_url: app.job_url,
      cv_version: app.cv_version,
      notes: app.notes,
    }));

    // 5. Sync rows to Google Sheet (A2:E)
    const syncResult = await syncApplicationsToGoogleSheet(
      authData.oauth2Client,
      spreadsheetId,
      applicationItems
    );

    // 6. Update last_synced_at timestamp
    const now = new Date().toISOString();
    await supabase
      .from("google_connections")
      .update({
        last_synced_at: now,
        needs_reconnect: false,
        updated_at: now,
      })
      .eq("id", connection.id);

    return NextResponse.json({
      success: true,
      rowsSynced: syncResult.rowsSynced,
      lastSyncedAt: now,
    });
  } catch (error: unknown) {
    console.error("Error syncing to Google Sheet:", error);
    const message = error instanceof Error ? error.message : "Gagal menyinkronkan data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
