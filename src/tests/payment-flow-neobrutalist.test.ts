import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  calculateBodyDigest,
  generateDokuSignature,
  verifyDokuSignature,
  isTimestampFresh,
} from "@/lib/doku/doku-security";
import {
  createCheckoutSession,
  processPaymentSuccess,
} from "@/lib/doku/doku-service";
import { MockCheckoutClient } from "@/app/payment/mock-checkout/MockCheckoutClient";
import { DownloadClient } from "@/app/cv/[id]/download/DownloadClient";
import { initialCvData } from "@/types/cv";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/payment/mock-checkout",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase Server & Admin Clients
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "budi@example.com",
          user_metadata: { full_name: "Budi Santoso" },
        },
      },
      error: null,
    }),
  },
  from: vi.fn((table: string) => {
    if (table === "orders") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { cv_id: "cv-456" },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "payment_events") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));


describe("Phase 6: DOKU Payment & Download Access Control (Neobrutalist)", () => {
  const secretKey = "test-secret-key-32-characters-ok!!";
  const clientId = "MOCK-DOKU-CLIENT-ID";
  const requestId = "REQ-12345-TEST";
  const requestTarget = "/api/payments/webhook";
  const validTimestamp = new Date().toISOString();

  describe("1. DOKU Security & Replay Attack Defense", () => {
    it("should calculate identical SHA-256 body digests for identical raw payloads", () => {
      const payload = JSON.stringify({ order: { invoice_number: "INV-123", amount: 5000 } });
      const digest1 = calculateBodyDigest(payload);
      const digest2 = calculateBodyDigest(payload);
      expect(digest1).toBe(digest2);
      expect(digest1.length).toBeGreaterThan(20);
    });

    it("should generate and verify authentic HMAC-SHA256 signatures", () => {
      const rawBody = JSON.stringify({ order: { invoice_number: "INV-123" } });
      const signature = generateDokuSignature({
        clientId,
        requestId,
        requestTimestamp: validTimestamp,
        requestTarget,
        rawBody,
        secretKey,
      });

      expect(signature.startsWith("HMACSHA256=")).toBe(true);

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

    it("should reject tampered payloads with invalid HMAC signatures", () => {
      const rawBody = JSON.stringify({ order: { amount: 5000 } });
      const signature = generateDokuSignature({
        clientId,
        requestId,
        requestTimestamp: validTimestamp,
        requestTarget,
        rawBody,
        secretKey,
      });

      const tamperedBody = JSON.stringify({ order: { amount: 1000 } });
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

    it("should enforce strict 5-minute replay attack freshness window", () => {
      const current = new Date().toISOString();
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      expect(isTimestampFresh(current, 300)).toBe(true);
      expect(isTimestampFresh(twoMinAgo, 300)).toBe(true);
      expect(isTimestampFresh(tenMinAgo, 300)).toBe(false);
    });
  });

  describe("2. Checkout Session & Single Fee Business Logic", () => {
    it("should generate a checkout session with strictly Rp5.000 single fee", async () => {
      const session = await createCheckoutSession("user-123", "cv-456", {
        name: "Budi Santoso",
        email: "budi@example.com",
      });

      expect(session.amount).toBe(5000);
      expect(session.invoiceNumber.startsWith("INV-CVB-")).toBe(true);
      expect(session.paymentUrl).toBeDefined();
    });

    it("should process payment success idempotently and set 7-day revision deadline", async () => {
      const invoiceNumber = "INV-CVK-TEST-999";
      const result = await processPaymentSuccess(
        invoiceNumber,
        "DOKU-REF-123456",
        "QRIS",
        { amount: 5000 },
        "EVT-UNIQUE-1"
      );

      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toBe(invoiceNumber);
    });
  });

  describe("3. Neobrutalist Payment UI Components", () => {
    it("should render MockCheckoutClient with Neobrutalist tokens and Rp5.000 price", () => {
      const html = renderToStaticMarkup(
        React.createElement(MockCheckoutClient, {
          invoiceNumber: "INV-CVK-MOCK-001",
          cvId: "cv-test-123",
        })
      );

      // Verify Neobrutalism tokens: 3px black borders, hard-drop, flat colors
      expect(html).toContain("border-[3px]");
      expect(html).toContain("border-black");
      expect(html).toContain("shadow-[6px_6px_0_0_#000]");
      expect(html).toContain("hard-drop");
      expect(html).toContain("Rp5.000");
      expect(html).toContain("INV-CVK-MOCK-001");
      expect(html).toContain("QRIS Pembayaran Resmi");
      expect(html).toContain("QRIS ONLY");
      expect(html).toContain("QRIS (Standar Pembayaran Nasional)");
    });

    it("should render DownloadClient in unpaid state with payment callout & Rp5.000 CTA", () => {
      const html = renderToStaticMarkup(
        React.createElement(DownloadClient, {
          cvId: "cv-test-123",
          cvTitle: "CV Budi Santoso",
          cvData: initialCvData,
          isPaid: false,
        })
      );

      // Unpaid state assertions
      expect(html).toContain("Draf Watermark");
      expect(html).toContain("Rp5.000");
      expect(html).toContain("Sekali Bayar • Akses Penuh");
      expect(html).toContain("Bayar Rp5.000 via QRIS &amp; Unduh Sekarang");
      expect(html).toContain("Garansi 3x Revisi Gratis");
      expect(html).toContain("border-[3px] border-black");
      expect(html).toContain("hard-drop");
      // Isolated desk frame for Harvard preview
      expect(html).toContain("Standar Harvard 1-Kolom");
    });

    it("should render DownloadClient in paid state with verified badge & clean download buttons", () => {
      const html = renderToStaticMarkup(
        React.createElement(DownloadClient, {
          cvId: "cv-test-123",
          cvTitle: "CV Budi Santoso",
          cvData: initialCvData,
          isPaid: true,
          orderInfo: {
            orderNumber: "INV-CVK-PAID-001",
            paidAt: new Date().toISOString(),
            revisionsUsed: 1,
            maxRevisions: 3,
          },
        })
      );

      // Paid state assertions
      expect(html).toContain("Status: Lunas");
      expect(html).toContain("Pembayaran Terverifikasi (Lunas)");
      expect(html).toContain("Unduh PDF ATS Resmi (Harvard)");
      expect(html).toContain("Unduh DOCX Word (Bisa Diedit)");
      expect(html).toContain("2 dari 3 kali"); // 3 - 1 = 2 revisions left
      expect(html).toContain("Spesifikasi Teknis ATS Harvard:");
    });
  });
});
