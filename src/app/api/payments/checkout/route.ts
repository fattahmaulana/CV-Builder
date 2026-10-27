import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSociaBuzzCheckout } from "@/lib/sociabuzz/sociabuzz-service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
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

    // 2. Verify CV ownership (IDOR prevention)
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id, title")
      .eq("id", cvId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cvError || !cv) {
      return NextResponse.json({ error: "Dokumen CV tidak ditemukan" }, { status: 404 });
    }

    // 3. Candidate metadata for SociaBuzz invoice
    const candidateName = user.user_metadata?.full_name || "Kandidat CVBuilder";
    const candidateEmail = user.email || "kandidat@cvbuilder.id";

    // 4. Create SociaBuzz QRIS Checkout Session
    const session = await createSociaBuzzCheckout(user.id, cvId, {
      name: candidateName,
      email: candidateEmail,
    });

    return NextResponse.json({
      success: true,
      ...session,
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/payments/checkout:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat sesi pembayaran";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
