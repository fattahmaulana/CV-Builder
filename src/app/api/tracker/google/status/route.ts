import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshGoogleAccessToken, TokenRevokedError } from "@/lib/sheets/google-sheets-service";
import { decryptSecret } from "@/lib/sheets/token-crypto";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const { data: connection, error: connError } = await supabase
      .from("google_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError || !connection || !connection.is_connected) {
      return NextResponse.json({
        connected: false,
        email: connection?.google_email || null,
        spreadsheetUrl: null,
        needsReconnect: Boolean(connection?.needs_reconnect),
        lastSyncedAt: connection?.last_synced_at || null,
      });
    }

    // If already marked as needing reconnect
    if (connection.needs_reconnect) {
      return NextResponse.json({
        connected: false,
        email: connection.google_email || null,
        spreadsheetUrl: null,
        needsReconnect: true,
        lastSyncedAt: connection.last_synced_at || null,
      });
    }

    let spreadsheetUrl: string | null = null;
    if (connection.spreadsheet_id_encrypted) {
      try {
        const spreadsheetId = decryptSecret(connection.spreadsheet_id_encrypted);
        spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      } catch (err) {
        console.warn("Could not decrypt spreadsheetId:", err);
      }
    }

    // Verify token validity transparently
    if (connection.refresh_token_encrypted) {
      try {
        await refreshGoogleAccessToken(connection.refresh_token_encrypted);
      } catch (tokenErr) {
        if (tokenErr instanceof TokenRevokedError) {
          // Mark connection as needing reconnect
          await supabase
            .from("google_connections")
            .update({
              needs_reconnect: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", connection.id);

          return NextResponse.json({
            connected: false,
            email: connection.google_email || null,
            spreadsheetUrl: null,
            needsReconnect: true,
            lastSyncedAt: connection.last_synced_at || null,
          });
        }
        // Non-fatal network error, keep connected
      }
    }

    return NextResponse.json({
      connected: true,
      email: connection.google_email || null,
      spreadsheetUrl,
      needsReconnect: false,
      lastSyncedAt: connection.last_synced_at || null,
    });
  } catch (error: unknown) {
    console.error("Error checking Google connection status:", error);
    const message = error instanceof Error ? error.message : "Gagal memeriksa status koneksi Google";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from("google_connections")
      .update({
        is_connected: false,
        needs_reconnect: false,
        refresh_token_encrypted: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Gagal memutuskan koneksi Google" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Koneksi Google Sheets berhasil diputuskan.",
    });
  } catch (error: unknown) {
    console.error("Error disconnecting Google connection:", error);
    const message = error instanceof Error ? error.message : "Gagal memutuskan koneksi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
