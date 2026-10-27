import { NextResponse } from "next/server";
import { processPaymentSuccess } from "@/lib/doku/doku-service";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const { invoiceNumber, paymentMethod } = await request.json();

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Invoice number is required" }, { status: 400 });
    }

    const eventId = `MOCK-EVT-${Date.now()}`;
    const dokuRef = `SBZ-SIM-${Math.floor(100000 + Math.random() * 900000)}`;

    // Process via SociaBuzz and DOKU idempotently
    const { processSociaBuzzPaymentSuccess } = await import("@/lib/sociabuzz/sociabuzz-service");
    await processSociaBuzzPaymentSuccess(
      invoiceNumber,
      dokuRef,
      paymentMethod || "QRIS",
      { simulation: true, timestamp: new Date().toISOString() },
      eventId
    );

    const result = await processPaymentSuccess(
      invoiceNumber,
      dokuRef,
      paymentMethod || "QRIS",
      {
        simulation: true,
        timestamp: new Date().toISOString(),
      },
      eventId
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in mock complete payment:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses pembayaran sandbox";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
