import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/sheets/google-sheets-service";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/auth/login?redirect=/tracker", request.url));
    }

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/tracker/google/callback`;

    // Generate random CSRF state token
    const csrfState = randomBytes(32).toString("hex");

    const authUrl = getGoogleAuthUrl(redirectUri, csrfState);

    const response = NextResponse.redirect(authUrl);

    // Store CSRF state in secure HttpOnly cookie for 10 minutes
    response.cookies.set("cvbuilder_oauth_csrf_state", csrfState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error("Error initiating Google Auth:", error);
    return NextResponse.redirect(new URL("/tracker?error=auth_failed", request.url));
  }
}
