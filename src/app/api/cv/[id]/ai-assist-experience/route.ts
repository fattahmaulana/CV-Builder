import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUserAIConsent } from "@/lib/auth-server";
import { assistExperienceWithAi } from "@/lib/ai/ai-assist-service";

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
          message: "Anda perlu menyetujui pemrosesan AI (UU PDP No. 27/2022) untuk menggunakan asisten cerdas.",
        },
        { status: 403 }
      );
    }

    // Verify CV ownership
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id, language, target_position, job_description")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cvError || !cv) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Dokumen CV tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const rawText = typeof body.rawText === "string" ? body.rawText : "";
    const role = typeof body.role === "string" ? body.role : undefined;
    const organization = typeof body.organization === "string" ? body.organization : undefined;
    const category = typeof body.category === "string" ? body.category : undefined;
    const language = body.language === "en" || cv.language === "en" ? "en" : "id";

    const result = await assistExperienceWithAi({
      rawText,
      role,
      organization,
      category,
      targetPosition: cv.target_position || body.targetPosition,
      jobDescription: cv.job_description || body.jobDescription,
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
    console.error("Error in POST /api/cv/[id]/ai-assist-experience:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Terjadi kesalahan saat memproses bantuan AI." },
      { status: 500 }
    );
  }
}
