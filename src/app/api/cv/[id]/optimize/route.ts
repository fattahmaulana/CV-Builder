import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUserAIConsent } from "@/lib/auth-server";
import { z } from "zod";
import { cvDataSchema, CvData } from "@/types/cv";
import { buildCvModel } from "@/lib/cv/buildCvModel";
import { runCvAiOptimization } from "@/lib/ai/ai-service";
import { Json } from "@/lib/supabase/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();

    // 1. Verify User Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sesi login tidak sah" }, { status: 401 });
    }

    // 2. Check Email Verification & UU PDP AI Consent
    const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
    if (!isEmailVerified && process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          code: "EMAIL_NOT_VERIFIED",
          error: "Email Anda belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.",
        },
        { status: 403 }
      );
    }

    const hasConsent = await checkUserAIConsent(user.id);
    if (!hasConsent && process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          code: "CONSENT_REQUIRED",
          error: "Persetujuan pemrosesan data AI (UU PDP No. 27/2022) diperlukan sebelum menggunakan fitur ini.",
          consentRequired: true,
        },
        { status: 403 }
      );
    }

    // 3. Retrieve CV with IDOR validation
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cvError || !cv) {
      return NextResponse.json({ error: "Dokumen CV tidak ditemukan" }, { status: 404 });
    }

    // 4. Parse incoming body or fallback to stored CV metadata
    let bodyTargetPosition = cv.target_position || "";
    let bodyTargetCompany = cv.target_company || "";
    let bodyJobDescription = cv.job_description || "";
    let rawCvData = cv.data;

    try {
      const body = await request.json();
      if (typeof body.targetPosition === "string") bodyTargetPosition = body.targetPosition;
      if (typeof body.targetCompany === "string") bodyTargetCompany = body.targetCompany;
      if (typeof body.jobDescription === "string") bodyJobDescription = body.jobDescription;
      if (body.data && typeof body.data === "object") rawCvData = body.data;
    } catch {
      // Body is optional
    }

    // Safely normalize draft CV data using single source of truth buildCvModel
    const cvData = buildCvModel(rawCvData) as unknown as CvData;

    // 5. Run AI Optimization
    const optimization = await runCvAiOptimization(
      user.id,
      id,
      cvData,
      bodyTargetPosition,
      bodyTargetCompany,
      bodyJobDescription
    );

    // 6. Persist match score & analysis to database
    await supabase
      .from("cvs")
      .update({
        match_score: optimization.matchScore,
        match_analysis: optimization.result.matchAnalysis as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      optimized: optimization.result,
      matchScore: optimization.matchScore,
      isCached: optimization.isCached,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "AiQueueFullError") {
      const retryAfter = (error as { retryAfterSeconds?: number }).retryAfterSeconds || 30;
      return NextResponse.json(
        {
          code: "AI_QUEUE_FULL",
          error: `Antrean AI penuh, coba lagi sekitar ${retryAfter} detik.`,
          retryAfterSeconds: retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }
    if (error && typeof error === "object" && "name" in error && error.name === "AiUnavailableError") {
      return NextResponse.json(
        {
          code: "AI_UNAVAILABLE",
          error: (error as Error).message || "AI tidak tersedia saat ini. Silakan coba lagi nanti.",
        },
        { status: 503 }
      );
    }
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((i) => i.message).filter(Boolean);
      const friendlyMessage = messages.length > 0 ? messages.join(". ") : "Format data CV tidak valid";
      return NextResponse.json({ error: friendlyMessage }, { status: 400 });
    }
    console.error("Error in POST /api/cv/[id]/optimize:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses perapian AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
