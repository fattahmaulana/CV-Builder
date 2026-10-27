import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDokuSignature } from "./doku-security";
import { randomUUID } from "crypto";
import { Json } from "@/lib/supabase/types";

export interface CheckoutResult {
  alreadyPaid?: boolean;
  invoiceNumber: string;
  paymentUrl: string;
  amount: number;
}

/**
 * Creates a DOKU Checkout session or development sandbox URL
 */
export async function createCheckoutSession(
  userId: string,
  cvId: string,
  candidateInfo: { name: string; email: string }
): Promise<CheckoutResult> {
  const supabase = await createClient();

  // 1. Check if an existing paid order already covers this CV
  const { data: existingPaidOrder } = await supabase
    .from("orders")
    .select("invoice_number, status")
    .eq("cv_id", cvId)
    .eq("status", "PAID")
    .maybeSingle();

  if (existingPaidOrder) {
    return {
      alreadyPaid: true,
      invoiceNumber: existingPaidOrder.invoice_number,
      paymentUrl: `/cv/${cvId}/download`,
      amount: 5000,
    };
  }

  // 2. Generate a unique invoice number
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-CVB-${timestampPart}-${randomPart}`;
  const amount = 5000;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const clientId = process.env.DOKU_CLIENT_ID || "MOCK-DOKU-CLIENT-ID";
  const secretKey = process.env.DOKU_SECRET_KEY || "mock-doku-secret-key-32charslong!!";
  const baseUrl = process.env.DOKU_BASE_URL || "https://api-sandbox.doku.com";

  const isMockDoku = !clientId || clientId.startsWith("MOCK-") || process.env.NODE_ENV === "development";

  let paymentUrl: string;

  if (isMockDoku) {
    // Generate sandbox mock payment simulator URL for seamless testing
    paymentUrl = `${appUrl}/payment/mock-checkout?invoice=${invoiceNumber}&cvId=${cvId}`;
  } else {
    // Production DOKU Checkout API request (QRIS ONLY)
    const requestId = randomUUID();
    const requestTimestamp = new Date().toISOString();
    const requestTarget = "/checkout/v1/payment";

    const payload = {
      order: {
        invoice_number: invoiceNumber,
        amount,
        currency: "IDR",
        callback_url: `${appUrl}/payment/success?invoice=${invoiceNumber}`,
        failed_callback_url: `${appUrl}/cv/${cvId}/download?error=payment_failed`,
        auto_redirect: true,
      },
      payment: {
        payment_due_date: 60, // 60 minutes expiry
        payment_method_types: ["QRIS"], // Strict QRIS Only enforcement
      },
      customer: {
        id: userId,
        name: candidateInfo.name || "Kandidat CVBuilder",
        email: candidateInfo.email || "kandidat@cvbuilder.id",
      },
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      rawBody,
      secretKey,
    });

    try {
      const res = await fetch(`${baseUrl}${requestTarget}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Id": clientId,
          "Request-Id": requestId,
          "Request-Timestamp": requestTimestamp,
          Signature: signature,
        },
        body: rawBody,
      });

      const dokuResponse = await res.json();
      if (!res.ok || !dokuResponse?.response?.payment?.url) {
        console.error("DOKU API Error:", dokuResponse);
        // Fallback to internal sandbox simulator
        paymentUrl = `${appUrl}/payment/mock-checkout?invoice=${invoiceNumber}&cvId=${cvId}`;
      } else {
        paymentUrl = dokuResponse.response.payment.url;
      }
    } catch (err) {
      console.warn("Failed calling DOKU live endpoint, falling back to mock sandbox:", err);
      paymentUrl = `${appUrl}/payment/mock-checkout?invoice=${invoiceNumber}&cvId=${cvId}`;
    }
  }

  // 3. Record pending order in database
  const { error: insertError } = await supabase.from("orders").insert({
    user_id: userId,
    cv_id: cvId,
    invoice_number: invoiceNumber,
    amount,
    currency: "IDR",
    status: "PENDING",
    payment_url: paymentUrl,
    max_revisions: 3,
    revisions_used: 0,
  });

  if (insertError) {
    console.error("Error inserting pending order:", insertError);
    throw new Error("Gagal menginisialisasi order pembayaran");
  }

  return {
    invoiceNumber,
    paymentUrl,
    amount,
  };
}

export interface PaymentSuccessResult {
  success: boolean;
  alreadyProcessed?: boolean;
  cvId?: string;
  invoiceNumber: string;
}

/**
 * Idempotently processes payment success webhook notification
 */
export async function processPaymentSuccess(
  invoiceNumber: string,
  dokuReference: string,
  paymentMethod: string,
  rawPayload: unknown,
  eventId: string
): Promise<PaymentSuccessResult> {
  // Payment completion is a trusted server-side system operation that must bypass user RLS
  const supabase = createAdminClient();

  const isMockSupabase =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("mock-supabase");

  // 1. Idempotency Check in payment_events table
  try {
    const { data: existingEvent } = await supabase
      .from("payment_events")
      .select("id, processed")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent && existingEvent.processed) {
      return {
        success: true,
        alreadyProcessed: true,
        invoiceNumber,
      };
    }

    // Record payment event
    if (!existingEvent) {
      await supabase.from("payment_events").insert({
        event_id: eventId,
        invoice_number: invoiceNumber,
        event_type: "PAYMENT_SUCCESS",
        payload: (rawPayload || {}) as Json,
        processed: true,
      });
    } else {
      await supabase
        .from("payment_events")
        .update({ processed: true })
        .eq("id", existingEvent.id);
    }
  } catch (eventErr) {
    if (!isMockSupabase) throw eventErr;
  }

  // 2. Update Order status to PAID with 7-day revision deadline
  const now = new Date();
  const revisionDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "PAID",
        doku_reference: dokuReference || `REF-${Date.now()}`,
        payment_method: paymentMethod || "QRIS",
        paid_at: now.toISOString(),
        revision_deadline: revisionDeadline,
        updated_at: now.toISOString(),
      })
      .eq("invoice_number", invoiceNumber)
      .select("cv_id")
      .maybeSingle();

    if (updateError || !updatedOrder) {
      if (isMockSupabase) {
        return {
          success: true,
          cvId: "demo-cv-id",
          invoiceNumber,
        };
      }
      console.error("Error updating order to PAID:", updateError);
      throw new Error("Gagal memperbarui status pesanan menjadi PAID");
    }

    return {
      success: true,
      cvId: updatedOrder.cv_id,
      invoiceNumber,
    };
  } catch (dbErr) {
    if (isMockSupabase) {
      return {
        success: true,
        cvId: "demo-cv-id",
        invoiceNumber,
      };
    }
    throw dbErr;
  }
}
