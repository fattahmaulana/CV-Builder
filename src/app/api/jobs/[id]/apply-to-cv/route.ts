import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_JOB_LISTINGS } from "@/lib/jobs/job-service";
import { cvDataSchema, CvData } from "@/types/cv";
import { Json } from "@/lib/supabase/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: RouteParams) {
  try {
    const { id: jobId } = await props.params;
    const supabase = await createClient();

    // 1. Verify User Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    const body = await request.json();
    const cvId = body?.cvId;

    if (!cvId) {
      return NextResponse.json({ error: "cvId wajib disertakan" }, { status: 400 });
    }

    // 2. Find Job Listing
    const job = SEED_JOB_LISTINGS.find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json({ error: "Lowongan kerja tidak ditemukan" }, { status: 404 });
    }

    // 3. Fetch User's CV with IDOR validation
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", cvId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cvError || !cv) {
      return NextResponse.json({ error: "Dokumen CV tidak ditemukan" }, { status: 404 });
    }

    // 4. Update CV with job description and target position
    let updatedCvData: CvData;
    try {
      const parsed = cvDataSchema.parse(cv.data);
      updatedCvData = {
        ...parsed,
        metadata: {
          ...parsed.metadata,
          targetPosition: job.title,
          targetCompany: job.company,
          jobDescription: job.description,
        },
      };
    } catch {
      updatedCvData = cv.data as unknown as CvData;
    }

    const { error: updateError } = await supabase
      .from("cvs")
      .update({
        target_position: job.title,
        target_company: job.company,
        job_description: job.description,
        data: updatedCvData as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cvId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating CV with job details:", updateError);
      return NextResponse.json({ error: "Gagal menyesuaikan data lowongan ke CV" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cvId,
      jobTitle: job.title,
      company: job.company,
    });
  } catch (error) {
    console.error("POST /api/jobs/[id]/apply-to-cv error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
