import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SociaBuzzClient, SociaBuzzPaymentResult } from "./client";
import { Json } from "@/lib/supabase/types";

export interface SociaBuzzCheckoutResult {
  alreadyPaid?: boolean;
  invoiceNumber: string;
  token?: string;
  paymentUrl: string;
  qrString?: string;
  qrImageUrl?: string;
  amount: number;
}

export interface SociaBuzzPaymentSuccessResult {
  success: boolean;
  alreadyProcessed?: boolean;
  cvId?: string;
  invoiceNumber: string;
}

/**
 * Creates a SociaBuzz QRIS Checkout session
 */
export async function createSociaBuzzCheckout(
  userId: string,
  cvId: string,
  candidateInfo: { name: string; email: string }
): Promise<SociaBuzzCheckoutResult> {
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

  const amount = 5000;
  const username = process.env.SOCIABUZZ_USERNAME || "ftrz";
  const baseUrl = process.env.SOCIABUZZ_BASE_URL || "https://sociabuzz.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cv-builder-bay-omega.vercel.app";

  const isLiveConfigured = Boolean(process.env.SOCIABUZZ_USERNAME);

  let invoiceNumber: string;
  let paymentUrl: string;
  let qrString: string | undefined;
  let qrImageUrl: string | undefined;
  let token: string | undefined;

  if (isLiveConfigured) {
    try {
      const client = new SociaBuzzClient(baseUrl);

      // Auto-detect creator minimum donation to prevent "Minimal IDR10,000" error
      let targetAmount = amount;
      try {
        const creatorConfig = await client.getCreatorConfig(username, "IDR");
        const minVal = Number(creatorConfig?.MIN_DONATE || creatorConfig?.TRAKTIR_PRICE || 0);
        if (minVal > 0 && minVal > targetAmount) {
          targetAmount = minVal;
        }
      } catch {
        // use default amount
      }

      // Step 1: Submit donation form
      const donation = await client.submitDonation(
        username,
        "IDR",
        targetAmount,
        candidateInfo.name || "Kandidat CVBuilder",
        candidateInfo.email || "kandidat@cvbuilder.id",
        `CV ATS Harvard #${cvId.slice(0, 8)}`
      );

      token = donation.token;

      // Step 2: Create QRIS Payment
      const payment: SociaBuzzPaymentResult = await client.createPayment(
        token,
        "qris",
        {
          amount: targetAmount,
          currency: "IDR",
          country: "Indonesia",
        }
      );

      invoiceNumber = payment.inv_id || `TRIBE-IDR-${token}`;
      qrString = payment.qr_string || `00020101021226650013ID.CO.QRIS.WWW0118936008480000000000520458125303360540${amount}5802ID5912CVBUILDER6007JAKARTA6304`;
      paymentUrl = `/payment/mock-checkout?invoice=${invoiceNumber}&cvId=${cvId}&token=${token}&qr=${encodeURIComponent(qrString)}`;
      qrImageUrl = payment.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrString)}`;
    } catch (err) {
      console.warn("Live SociaBuzz session creation failed, using fallback:", err);
      const timestampPart = Date.now().toString(36).toUpperCase();
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      invoiceNumber = `INV-CVB-${timestampPart}-${randomPart}`;
      token = `SBZ-${timestampPart}`;
      qrString = `00020101021226650013ID.CO.QRIS.WWW0118936008480000000000520458125303360540${amount}5802ID5912CVBUILDER6007JAKARTA6304`;
      paymentUrl = `/payment/mock-checkout?invoice=${invoiceNumber}&cvId=${cvId}&token=${token}&qr=${encodeURIComponent(qrString)}`;
      qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrString)}`;
    }
  } else {
    // Standard local gateway flow
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    invoiceNumber = `INV-CVB-${timestampPart}-${randomPart}`;
    token = `SBZ-${timestampPart}`;
    qrString = `00020101021226650013ID.CO.QRIS.WWW0118936008480000000000520458125303360540${amount}5802ID5912CVBUILDER6007JAKARTA6304`;
    paymentUrl = `/payment/mock-checkout?invoice=${invoiceNumber}&cvId=${cvId}&token=${token}&qr=${encodeURIComponent(qrString)}`;
    qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrString)}`;
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
    doku_reference: token, // Store SociaBuzz session token
    payment_method: "QRIS",
    max_revisions: 3,
    revisions_used: 0,
  });

  if (insertError) {
    console.error("Error inserting pending order:", insertError);
    // If it already exists, return current
    const { data: existing } = await supabase
      .from("orders")
      .select("invoice_number, payment_url, status")
      .eq("cv_id", cvId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return {
        alreadyPaid: existing.status === "PAID",
        invoiceNumber: existing.invoice_number,
        paymentUrl: existing.payment_url || paymentUrl,
        amount,
      };
    }
  }

  return {
    invoiceNumber,
    token,
    paymentUrl,
    qrString,
    qrImageUrl,
    amount,
  };
}

/**
 * Idempotently processes payment success (from Webhook or Status check)
 */
export async function processSociaBuzzPaymentSuccess(
  invoiceNumberOrToken: string,
  reference?: string,
  paymentMethod = "QRIS",
  rawPayload: unknown = {},
  eventId?: string
): Promise<SociaBuzzPaymentSuccessResult> {
  const supabase = createAdminClient();

  const isMockSupabase =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("mock-supabase");

  const resolvedEventId = eventId || `SBZ-EVT-${Date.now()}`;

  // 1. Locate existing Order first to guarantee Foreign Key integrity
  const now = new Date();
  const revisionDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  let order: { id: string; cv_id: string; invoice_number: string } | null = null;

  try {
    // 1a. Try matching by invoice_number
    const { data: orderInv } = await supabase
      .from("orders")
      .select("id, cv_id, invoice_number")
      .eq("invoice_number", invoiceNumberOrToken)
      .maybeSingle();
    order = orderInv;

    // 1b. Try matching by doku_reference (which stores the session token)
    if (!order) {
      const { data: orderToken } = await supabase
        .from("orders")
        .select("id, cv_id, invoice_number")
        .eq("doku_reference", invoiceNumberOrToken)
        .maybeSingle();
      order = orderToken;
    }

    // 1c. Try matching by extracted cv_id from note or message if available
    if (!order && rawPayload && typeof rawPayload === "object") {
      const payloadObj = rawPayload as Record<string, any>;
      const candidateText = `${payloadObj.note || ""} ${payloadObj.message || ""} ${payloadObj.description || ""}`;
      const cvMatch = candidateText.match(/#?([a-f0-9-]{36})/i) || candidateText.match(/#([a-zA-Z0-9_-]{8,})/);
      if (cvMatch && cvMatch[1]) {
        const potentialCvId = cvMatch[1];
        const { data: orderCv } = await supabase
          .from("orders")
          .select("id, cv_id, invoice_number")
          .ilike("cv_id", `${potentialCvId}%`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        order = orderCv;
      }
    }

    // 1d. Fallback: match latest pending order
    if (!order) {
      const { data: latestPending } = await supabase
        .from("orders")
        .select("id, cv_id, invoice_number")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      order = latestPending;
    }
  } catch (searchErr) {
    if (!isMockSupabase) console.warn("Failed searching order for SociaBuzz success:", searchErr);
  }

  // Handle mock environment if still not found
  if (!order && isMockSupabase) {
    return {
      success: true,
      cvId: "demo-cv-id",
      invoiceNumber: invoiceNumberOrToken,
    };
  }

  if (!order) {
    console.warn("No matching order found for SociaBuzz success:", invoiceNumberOrToken);
    return {
      success: false,
      invoiceNumber: invoiceNumberOrToken,
    };
  }

  const validInvoiceNumber = order.invoice_number;

  // 2. Idempotency Check in payment_events table using valid Foreign Key (order.invoice_number)
  try {
    const { data: existingEvent } = await supabase
      .from("payment_events")
      .select("id, processed")
      .eq("event_id", resolvedEventId)
      .maybeSingle();

    if (existingEvent && existingEvent.processed) {
      return {
        success: true,
        alreadyProcessed: true,
        cvId: order.cv_id,
        invoiceNumber: validInvoiceNumber,
      };
    }

    if (!existingEvent) {
      await supabase.from("payment_events").insert({
        event_id: resolvedEventId,
        invoice_number: validInvoiceNumber,
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
    // Non-fatal: even if payment_events fails, order MUST still be marked PAID
    if (!isMockSupabase) console.warn("Failed recording payment event (non-fatal):", eventErr);
  }

  // 3. Update Order status to PAID
  try {
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "PAID",
        doku_reference: reference || invoiceNumberOrToken,
        payment_method: paymentMethod || "QRIS",
        paid_at: now.toISOString(),
        revision_deadline: revisionDeadline,
        updated_at: now.toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Error updating order to PAID:", updateError);
      throw updateError;
    }

    return {
      success: true,
      cvId: order.cv_id,
      invoiceNumber: validInvoiceNumber,
    };
  } catch (dbErr) {
    if (isMockSupabase) {
      return {
        success: true,
        cvId: "demo-cv-id",
        invoiceNumber: validInvoiceNumber,
      };
    }
    throw dbErr;
  }
}

/**
 * Checks payment status from DB or polls SociaBuzz live endpoint
 */
export async function checkSociaBuzzPaymentStatus(
  invoiceNumberOrToken: string,
  cvId?: string
): Promise<{ status: "paid" | "pending" | "failed"; invoiceNumber?: string }> {
  const supabase = createAdminClient();

  // 1. Check database first by invoice_number or doku_reference
  let { data: order } = await supabase
    .from("orders")
    .select("status, doku_reference, invoice_number")
    .or(`invoice_number.eq.${invoiceNumberOrToken},doku_reference.eq.${invoiceNumberOrToken}`)
    .maybeSingle();

  // If not found and cvId provided, check by cvId
  if (!order && cvId) {
    const { data: orderCv } = await supabase
      .from("orders")
      .select("status, doku_reference, invoice_number")
      .eq("cv_id", cvId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = orderCv;
  }

  if (order?.status === "PAID") {
    return { status: "paid", invoiceNumber: order.invoice_number };
  }

  // 2. If PENDING and live SociaBuzz configured, poll SociaBuzz
  const baseUrl = process.env.SOCIABUZZ_BASE_URL || "https://sociabuzz.com";
  const token = order?.doku_reference || invoiceNumberOrToken;
  const invId = order?.invoice_number || invoiceNumberOrToken;

  if (process.env.SOCIABUZZ_USERNAME) {
    try {
      const client = new SociaBuzzClient(baseUrl);
      const liveStatus = await client.checkPaymentStatus(token, "qris", invId);
      if (liveStatus === "paid") {
        const processed = await processSociaBuzzPaymentSuccess(invId, token, "QRIS");
        return { status: "paid", invoiceNumber: processed.invoiceNumber || invId };
      }
      return { status: liveStatus, invoiceNumber: invId };
    } catch {
      // ignore network errors
    }
  }

  return { status: "pending", invoiceNumber: invId };
}

/**
 * Parses and processes incoming SociaBuzz Webhook payload
 */
export async function handleSociaBuzzWebhookPayload(
  rawPayload: Record<string, any>
): Promise<{ success: boolean; invoiceNumber?: string }> {
  // 1. Flatten payload if wrapped in data or content object
  const inner =
    rawPayload?.data && typeof rawPayload.data === "object"
      ? rawPayload.data
      : rawPayload?.content && typeof rawPayload.content === "object"
      ? rawPayload.content
      : {};
  const payload = { ...rawPayload, ...inner };

  // 2. Extract possible invoice / transaction identifier
  let invId: string | null = null;
  const idKeys = [
    "inv_id",
    "invoice_id",
    "invoice_number",
    "order_id",
    "transaction_id",
    "transaction_number",
    "no_transaksi",
    "trx_id",
    "id",
  ];
  for (const key of idKeys) {
    if (payload[key] && typeof payload[key] === "string") {
      invId = payload[key];
      break;
    }
  }

  // 3. Extract possible session token
  let token: string | null = null;
  for (const key of ["token", "session_token"]) {
    if (payload[key] && typeof payload[key] === "string") {
      token = payload[key];
      break;
    }
  }

  // 4. Extract possible cv_id from note / message / description
  let extractedCvId: string | null = null;
  const noteText = `${payload.note || ""} ${payload.message || ""} ${payload.description || ""}`;
  const cvMatch = noteText.match(/#?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i) || noteText.match(/#([a-zA-Z0-9_-]{8,})/);
  if (cvMatch && cvMatch[1]) {
    extractedCvId = cvMatch[1];
  }

  const targetIdentifier = invId || token || extractedCvId;
  if (!targetIdentifier) {
    console.warn("[SociaBuzz Webhook] No identifier could be extracted from payload:", rawPayload);
    return { success: false };
  }

  const result = await processSociaBuzzPaymentSuccess(
    targetIdentifier,
    token || invId || undefined,
    "QRIS",
    rawPayload,
    `SBZ-HOOK-${targetIdentifier}-${Date.now()}`
  );

  return {
    success: result.success,
    invoiceNumber: result.invoiceNumber,
  };
}
