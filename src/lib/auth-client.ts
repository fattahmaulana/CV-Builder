"use client";

import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

/**
 * Initiates Google OAuth via Supabase Auth from the browser
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createBrowserSupabase();
  const origin = window.location.origin;
  const redirectUrl = new URL("/auth/callback", origin);
  if (redirectTo) {
    redirectUrl.searchParams.set("next", redirectTo);
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }
}

/**
 * Sign out current user from the browser
 */
export async function signOut() {
  const supabase = createBrowserSupabase();
  await supabase.auth.signOut();
  window.location.href = "/";
}
