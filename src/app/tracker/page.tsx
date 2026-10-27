import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrackerClient, ApplicationRecord } from "@/components/tracker/TrackerClient";

export const metadata: Metadata = {
  title: "Pelacak Lamaran Kerja | CVBuilder",
  description: "Pantau status setiap lowongan yang Anda lamar secara terorganisir di CVBuilder.",
};

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/tracker");
  }

  // Fetch user's applications
  const { data: apps } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_date", { ascending: false });

  const applications: ApplicationRecord[] = (apps || []).map((app) => ({
    id: app.id,
    company: app.company,
    position: app.position,
    status: app.status,
    applied_date: app.applied_date,
    job_url: app.job_url,
    cv_version: app.cv_version,
    notes: app.notes,
    created_at: app.created_at,
  }));

  return <TrackerClient initialApplications={applications} />;
}

