import { NextResponse } from "next/server";
import { handleSociaBuzzWebhookPayload } from "@/lib/sociabuzz/sociabuzz-service";
import { verifyDokuSignature, isTimestampFresh } from "@/lib/doku/doku-security";
import { processPaymentSuccess } from "@/lib/doku/doku-service";

// Support SociaBuzz Webhook GET Ping / Verification Test
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SociaBuzz webhook endpoint ready for CVBuilder",
  });
}

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    let body: Record<string, any> = {};

    try {
      body = JSON.parse(rawText);
    } catch {
      // In case form-urlencoded is sent
      const params = new URLSearchParams(rawText);
      for (const [k, v] of params.entries()) {
        body[k] = v;
      }
    }

    const url = new URL(request.url);
    const queryObj: Record<string, any> = {};
    for (const [k, v] of url.searchParams.entries()) {
      queryObj[k] = v;
    }

    const mergedPayload = { ...queryObj, ...body };

    // 1. Check if this is a SociaBuzz webhook payload
    const isSociaBuzz =
      mergedPayload.inv_id ||
      mergedPayload.order_id ||
      mergedPayload.session_token ||
      mergedPayload.type === "TRIBE" ||
      mergedPayload.feature === "TRIBE" ||
      request.headers.get("x-sociabuzz-event") !== null ||
      !request.headers.get("Signature");

    if (isSociaBuzz) {
      console.log("[SociaBuzz Webhook] incoming payload:", mergedPayload);
      const sbResult = await handleSociaBuzzWebhookPayload(mergedPayload);

      return NextResponse.json({
        status: "ok",
        message: "SociaBuzz webhook processed successfully",
        invoiceNumber: sbResult.invoiceNumber,
        processed: sbResult.success,
      });
    }

    // 2. Legacy DOKU Webhook handler fallback
    const signatureHeader = request.headers.get("Signature") || "";
    const clientIdHeader = request.headers.get("Client-Id") || "";
    const requestIdHeader = request.headers.get("Request-Id") || "";
    const requestTimestampHeader = request.headers.get("Request-Timestamp") || "";

    const secretKey = process.env.DOKU_SECRET_KEY || "mock-doku-secret-key-32charslong!!";
    const expectedClientId = process.env.DOKU_CLIENT_ID || "MOCK-DOKU-CLIENT-ID";

    if (isTimestampFresh(requestTimestampHeader, 300)) {
      const isMock = expectedClientId.startsWith("MOCK-") || process.env.NODE_ENV === "development";
      const isValid = verifyDokuSignature({
        clientId: clientIdHeader,
        requestId: requestIdHeader,
        requestTimestamp: requestTimestampHeader,
        requestTarget: "/api/payments/webhook",
        rawBody: rawText,
        signatureHeader,
        secretKey,
      });

      if (isValid || isMock) {
        const orderObj = body.order as Record<string, unknown> | undefined;
        const invoiceNumber = (orderObj?.invoice_number || body.invoice_number) as string;
        if (invoiceNumber) {
          await processPaymentSuccess(
            invoiceNumber,
            requestIdHeader || `DOKU-REF-${Date.now()}`,
            "QRIS",
            body,
            requestIdHeader || `EVT-${Date.now()}`
          );
          return NextResponse.json({ status: "SUCCESS", invoiceNumber });
        }
      }
    }

    return NextResponse.json({ status: "RECEIVED" });
  } catch (error: unknown) {
    console.error("Error processing payment webhook:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
