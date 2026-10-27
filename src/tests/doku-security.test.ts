import { describe, it, expect } from "vitest";
import {
  calculateBodyDigest,
  generateDokuSignature,
  verifyDokuSignature,
  isTimestampFresh,
} from "@/lib/doku/doku-security";

describe("DOKU Checkout HMAC Security & Replay Attack Defense", () => {
  const secretKey = "test-secret-key-32-characters-ok!!";
  const clientId = "MOCK-DOKU-CLIENT-ID";
  const requestId = "REQ-12345-TEST";
  const requestTarget = "/api/payments/webhook";
  const validTimestamp = new Date().toISOString();
  const rawBody = JSON.stringify({
    order: {
      invoice_number: "INV-CVK-TEST-123",
      amount: 5000,
    },
    transaction: {
      status: "SUCCESS",
    },
  });

  it("should calculate correct base64 SHA-256 digest of request body", () => {
    const digest1 = calculateBodyDigest(rawBody);
    const digest2 = calculateBodyDigest(rawBody);

    expect(digest1).toBe(digest2);
    expect(digest1.length).toBeGreaterThan(20);
  });

  it("should generate a valid HMACSHA256 signature string", () => {
    const signature = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp: validTimestamp,
      requestTarget,
      rawBody,
      secretKey,
    });

    expect(signature.startsWith("HMACSHA256=")).toBe(true);
    expect(signature.length).toBeGreaterThan(30);
  });

  it("should verify authentic webhook signature successfully", () => {
    const signature = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp: validTimestamp,
      requestTarget,
      rawBody,
      secretKey,
    });

    const isValid = verifyDokuSignature({
      clientId,
      requestId,
      requestTimestamp: validTimestamp,
      requestTarget,
      rawBody,
      signatureHeader: signature,
      secretKey,
    });

    expect(isValid).toBe(true);
  });

  it("should reject webhook when payload has been tampered with", () => {
    const signature = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp: validTimestamp,
      requestTarget,
      rawBody,
      secretKey,
    });

    const tamperedBody = JSON.stringify({
      order: {
        invoice_number: "INV-CVK-TEST-123",
        amount: 1000, // Tampered amount!
      },
    });

    const isValid = verifyDokuSignature({
      clientId,
      requestId,
      requestTimestamp: validTimestamp,
      requestTarget,
      rawBody: tamperedBody,
      signatureHeader: signature,
      secretKey,
    });

    expect(isValid).toBe(false);
  });

  it("should reject webhook when signed with a different secret key", () => {
    const signature = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp: validTimestamp,
      requestTarget,
      rawBody,
      secretKey: "wrong-secret-key",
    });

    const isValid = verifyDokuSignature({
      clientId,
      requestId,
      requestTimestamp: validTimestamp,
      requestTarget,
      rawBody,
      signatureHeader: signature,
      secretKey,
    });

    expect(isValid).toBe(false);
  });

  describe("Replay Attack Timestamp Freshness", () => {
    it("should accept current timestamp", () => {
      const now = new Date().toISOString();
      expect(isTimestampFresh(now, 300)).toBe(true);
    });

    it("should accept timestamp from 2 minutes ago", () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      expect(isTimestampFresh(twoMinutesAgo, 300)).toBe(true);
    });

    it("should REJECT stale timestamp from 10 minutes ago (replay attack attempt)", () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(isTimestampFresh(tenMinutesAgo, 300)).toBe(false);
    });

    it("should REJECT clock skew in the future exceeding 5 minutes", () => {
      const sixMinutesFuture = new Date(Date.now() + 6 * 60 * 1000).toISOString();
      expect(isTimestampFresh(sixMinutesFuture, 300)).toBe(false);
    });

    it("should REJECT invalid non-ISO date string", () => {
      expect(isTimestampFresh("invalid-date-format", 300)).toBe(false);
    });
  });
});
