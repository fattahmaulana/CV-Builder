import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-supabase-project.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key-for-development-and-testing";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
