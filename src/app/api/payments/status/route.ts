import { NextResponse } from "next/server";
import { checkSociaBuzzPaymentStatus } from "@/lib/sociabuzz/sociabuzz-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token || body?.invoiceNumber || body?.inv_id;
    const cvId = body?.cvId;

    if (!token && !cvId) {
      return NextResponse.json(
        { error: "token, invoiceNumber, atau cvId wajib disertakan" },
        { status: 400 }
      );
    }

    const { status, invoiceNumber } = await checkSociaBuzzPaymentStatus(token || cvId, cvId);

    return NextResponse.json({
      success: true,
      token,
      invoiceNumber,
      status, // 'paid' | 'pending' | 'failed'
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/payments/status:", error);
    const message = error instanceof Error ? error.message : "Gagal mengecek status pembayaran";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
