import { NextResponse } from "next/server";
import { checkSociaBuzzPaymentStatus } from "@/lib/sociabuzz/sociabuzz-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token || body?.invoiceNumber || body?.inv_id;

    if (!token) {
      return NextResponse.json({ error: "token atau invoiceNumber wajib disertakan" }, { status: 400 });
    }

    const status = await checkSociaBuzzPaymentStatus(token);

    return NextResponse.json({
      success: true,
      token,
      status, // 'paid' | 'pending' | 'failed'
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/payments/status:", error);
    const message = error instanceof Error ? error.message : "Gagal mengecek status pembayaran";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
