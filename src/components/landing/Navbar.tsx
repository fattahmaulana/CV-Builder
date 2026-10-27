import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  let user = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      // Fetch role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();

      user = {
        id: authUser.id,
        email: authUser.email || "",
        fullName: profile?.full_name || authUser.user_metadata?.full_name,
        avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        role: profile?.role || "user",
      };
    }
  } catch {
    // Non-blocking fallback if auth service or cookies unavailable
    user = null;
  }

  return <NavbarClient initialUser={user} />;
}
