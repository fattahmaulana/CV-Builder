import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUserAIConsent } from "@/lib/auth-server";
import { assistSummaryWithAi } from "@/lib/ai/ai-assist-service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Sesi telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }

    // Check email verification & consent according to UU PDP and rule 4e
    const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
    if (!isEmailVerified && process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          code: "EMAIL_NOT_VERIFIED",
          message: "Email Anda belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.",
        },
        { status: 403 }
      );
    }

    const hasConsent = await checkUserAIConsent(user.id);
    if (!hasConsent && process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          code: "CONSENT_REQUIRED",
          message: "Anda perlu menyetujui pemrosesan AI (UU PDP No. 27/2022) untuk menggunakan asisten ringkasan.",
        },
        { status: 403 }
      );
    }

    // Verify CV ownership
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id, language, target_position, target_company, data")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cvError || !cv) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Dokumen CV tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const cvData = (typeof cv.data === "object" && cv.data !== null ? cv.data : {}) as any;

    const educations = body.educations || cvData.educations || [];
    const skills = body.skills || cvData.skills || {};
    const experiences = body.experiences || cvData.experiences || [];
    const targetPosition = body.targetPosition || cv.target_position || "";
    const targetCompany = body.targetCompany || cv.target_company || "";
    const language = body.language === "en" || cv.language === "en" ? "en" : "id";

    const result = await assistSummaryWithAi({
      targetPosition,
      targetCompany,
      educations,
      skills,
      experiences,
      language,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "AiQueueFullError") {
      const retryAfter = (error as { retryAfterSeconds?: number }).retryAfterSeconds || 30;
      return NextResponse.json(
        {
          code: "AI_QUEUE_FULL",
          message: `Antrean AI penuh, coba lagi sekitar ${retryAfter} detik.`,
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
          message: (error as Error).message || "AI tidak tersedia saat ini. Silakan coba lagi nanti.",
        },
        { status: 503 }
      );
    }
    console.error("Error in POST /api/cv/[id]/ai-assist-summary:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Terjadi kesalahan saat menyusun ringkasan profesional." },
      { status: 500 }
    );
  }
}
