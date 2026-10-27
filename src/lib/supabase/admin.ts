import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "./types";
import { env } from "@/lib/env";

/**
 * Supabase Admin Client
 * WARNING: Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security.
 * Strictly forbidden in client bundles or user-facing endpoints without server authorization.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
