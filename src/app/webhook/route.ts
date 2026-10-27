import { NextResponse } from "next/server";
import { handleSociaBuzzWebhookPayload } from "@/lib/sociabuzz/sociabuzz-service";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "webhook received successfully",
  });
}

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    let body: Record<string, any> = {};

    try {
      body = JSON.parse(rawText);
    } catch {
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
    console.log("[Root /webhook] incoming SociaBuzz notification:", mergedPayload);

    await handleSociaBuzzWebhookPayload(mergedPayload);

    return NextResponse.json({
      status: "ok",
      message: "webhook received successfully",
    });
  } catch (error: unknown) {
    console.error("[Root /webhook error]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
