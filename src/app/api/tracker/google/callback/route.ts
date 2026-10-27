import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  createJobTrackerSpreadsheet,
  GOOGLE_SCOPES,
} from "@/lib/sheets/google-sheets-service";
import { encryptSecret, decryptSecret } from "@/lib/sheets/token-crypto";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/tracker?error=missing_code`);
  }

  // 1. Verify CSRF state parameter
  const cookieStore = await cookies();
  const storedCsrf = cookieStore.get("cvbuilder_oauth_csrf_state")?.value;
  const isMock = (process.env.GOOGLE_CLIENT_ID || "mock-").startsWith("mock-");

  if (!isMock && (!state || !storedCsrf || state !== storedCsrf)) {
    console.error("CSRF State mismatch in Google OAuth callback");
    return NextResponse.redirect(`${origin}/tracker?error=invalid_csrf_state`);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(`${origin}/auth/login?redirect=/tracker`);
    }

    const redirectUri = `${origin}/api/tracker/google/callback`;

    // 2. Exchange authorization code for tokens and Google user email
    const { tokens, email } = await exchangeCodeForTokens(code, redirectUri);

    // 3. Check if user already has a spreadsheet or create new "Lacak Lamaran - CVBuilder"
    const { data: existingConnection } = await supabase
      .from("google_connections")
      .select("spreadsheet_id_encrypted")
      .eq("user_id", user.id)
      .maybeSingle();

    let spreadsheetId: string;
    if (existingConnection?.spreadsheet_id_encrypted) {
      try {
        spreadsheetId = decryptSecret(existingConnection.spreadsheet_id_encrypted);
      } catch {
        const created = await createJobTrackerSpreadsheet(tokens.access_token);
        spreadsheetId = created.spreadsheetId;
      }
    } else {
      const created = await createJobTrackerSpreadsheet(tokens.access_token);
      spreadsheetId = created.spreadsheetId;
    }

    // 4. Encrypt sensitive credentials with AES-256-GCM
    const encryptedSpreadsheetId = encryptSecret(spreadsheetId);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptSecret(tokens.refresh_token)
      : null;

    // 5. Save connection record in database
    const { error: upsertError } = await supabase
      .from("google_connections")
      .upsert(
        {
          user_id: user.id,
          spreadsheet_id_encrypted: encryptedSpreadsheetId,
          ...(encryptedRefreshToken ? { refresh_token_encrypted: encryptedRefreshToken } : {}),
          google_email: email || null,
          scope: tokens.scope || GOOGLE_SCOPES.join(" "),
          is_connected: true,
          needs_reconnect: false,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Error upserting google_connections:", upsertError);
    }

    const response = NextResponse.redirect(`${origin}/tracker?connected=true`);
    // Delete CSRF cookie after successful callback
    response.cookies.delete("cvbuilder_oauth_csrf_state");
    return response;
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(`${origin}/tracker?error=callback_failed`);
  }
}
