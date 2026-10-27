import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { CURRENT_AI_CONSENT_VERSION } from "./auth";

/**
 * Check if the user has accepted the AI processing consent on the server
 */
export async function checkUserAIConsent(userId: string): Promise<boolean> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("consents")
    .select("granted")
    .eq("user_id", userId)
    .eq("consent_type", "ai_gemini_processing")
    .eq("consent_version", CURRENT_AI_CONSENT_VERSION)
    .eq("granted", true)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.granted === true;
}
