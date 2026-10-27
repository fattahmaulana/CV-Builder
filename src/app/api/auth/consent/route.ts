import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const consentSchema = z.object({
  consent_type: z.enum(["ai_gemini_processing", "terms_and_privacy"]),
  consent_version: z.string().min(1),
  granted: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = consentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid consent payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    const { error: insertError } = await supabase.from("consents").upsert(
      {
        user_id: user.id,
        consent_type: parsed.data.consent_type,
        consent_version: parsed.data.consent_version,
        granted: parsed.data.granted,
        ip_address: ipAddress,
        user_agent: userAgent,
        consented_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,consent_type,consent_version",
      }
    );

    if (insertError) {
      console.error("Failed to store user consent:", insertError);
      return NextResponse.json(
        { error: "Failed to persist consent record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Consent recorded successfully",
    });
  } catch (error) {
    console.error("Consent API unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
