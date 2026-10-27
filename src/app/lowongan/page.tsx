import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchJobListings } from "@/lib/jobs/job-service";
import { JobDirectoryClient } from "@/components/jobs/JobDirectoryClient";

export const metadata: Metadata = {
  title: "Lowongan Kerja Fresh Graduate & Penyelarasan CV ATS | CVBuilder",
  description:
    "Eksplorasi lowongan kerja fresh graduate dari BUMN, perbankan, dan startup teknologi. Sesuaikan kata kunci CV format ATS Harvard Anda dalam 1 klik.",
};

export default async function LowonganPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userCvs: Array<{ id: string; title: string }> = [];

  if (user) {
    const { data: cvs } = await supabase
      .from("cvs")
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (cvs) {
      userCvs = cvs;
    }
  }

  // Fetch initial job listings
  const { jobs } = await searchJobListings({
    q: "",
    location: "ALL",
    level: "ALL",
    workplace: "ALL",
  });

  return (
    <JobDirectoryClient
      initialJobs={jobs}
      userCvs={userCvs}
    />
  );
}
