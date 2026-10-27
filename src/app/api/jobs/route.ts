import { NextResponse } from "next/server";
import { searchJobListings } from "@/lib/jobs/job-service";
import { jobSearchQuerySchema } from "@/types/job";
import { createClient } from "@/lib/supabase/server";
import { cvDataSchema, CvData } from "@/types/cv";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const queryParse = jobSearchQuerySchema.safeParse({
      q: searchParams.get("q") || "",
      location: searchParams.get("location") || "ALL",
      level: searchParams.get("level") || "ALL",
      workplace: searchParams.get("workplace") || "ALL",
      cvId: searchParams.get("cvId") || undefined,
    });

    const query = queryParse.success
      ? queryParse.data
      : { q: "", location: "ALL", level: "ALL", workplace: "ALL" };

    // Fetch user CV if cvId provided for live relevancy scoring
    let userCvData: CvData | null = null;
    if (query.cvId) {
      try {
        const supabase = await createClient();
        const { data: cv } = await supabase
          .from("cvs")
          .select("data")
          .eq("id", query.cvId)
          .maybeSingle();

        if (cv?.data) {
          userCvData = cvDataSchema.parse(cv.data);
        }
      } catch {
        // Fallback without matching
      }
    }

    const { jobs, total, fromCache } = await searchJobListings(query, userCvData);

    return NextResponse.json({
      jobs,
      total,
      fromCache,
    });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
