import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * DOKU Checkout HMAC SHA-256 Security Helper
 * Follows DOKU's official API signature specification:
 * Component = "Client-Id:" + clientId + "\n" +
 *             "Request-Id:" + requestId + "\n" +
 *             "Request-Timestamp:" + requestTimestamp + "\n" +
 *             "Request-Target:" + requestTarget + "\n" +
 *             "Digest:" + digest;
 * Signature = "HMACSHA256=" + Base64(HMAC-SHA256(secretKey, Component));
 */

export interface DokuSignatureParams {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string; // e.g. "/api/payments/webhook" or "/checkout/v1/payment"
  rawBody: string;
  secretKey: string;
}

/**
 * Calculates SHA-256 Digest of the raw JSON body
 */
export function calculateBodyDigest(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("base64");
}

/**
 * Generates the expected DOKU HMAC-SHA256 signature string
 */
export function generateDokuSignature({
  clientId,
  requestId,
  requestTimestamp,
  requestTarget,
  rawBody,
  secretKey,
}: DokuSignatureParams): string {
  const digest = calculateBodyDigest(rawBody);

  const component = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");

  const hmac = createHmac("sha256", secretKey).update(component, "utf8").digest("base64");
  return `HMACSHA256=${hmac}`;
}

/**
 * Verifies incoming DOKU webhook signature using constant-time comparison
 */
export function verifyDokuSignature({
  clientId,
  requestId,
  requestTimestamp,
  requestTarget,
  rawBody,
  signatureHeader,
  secretKey,
}: DokuSignatureParams & { signatureHeader: string }): boolean {
  if (!signatureHeader || !secretKey) {
    return false;
  }

  const expectedSignature = generateDokuSignature({
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    rawBody,
    secretKey,
  });

  try {
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(signatureHeader, "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Verifies that the request timestamp is within tolerance (default 5 minutes)
 * to prevent replay attacks.
 */
export function isTimestampFresh(
  requestTimestampIso: string,
  maxSkewSeconds: number = 300
): boolean {
  try {
    const requestTime = new Date(requestTimestampIso).getTime();
    if (isNaN(requestTime)) {
      return false;
    }

    const now = Date.now();
    const diffMs = Math.abs(now - requestTime);
    const maxSkewMs = maxSkewSeconds * 1000;

    return diffMs <= maxSkewMs;
  } catch {
    return false;
  }
}
