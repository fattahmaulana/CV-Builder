import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkUserAIConsent } from "@/lib/auth-server";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const hasConsent = await checkUserAIConsent(user.id);

  // Fetch user's profile and CVs
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: cvList } = await supabase
    .from("cvs")
    .select("id, title, language, match_score, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email || "",
        name: profile?.full_name || user.user_metadata?.full_name || "Pengguna",
      }}
      initialHasConsent={hasConsent}
      initialCvList={cvList || []}
    />
  );
}
