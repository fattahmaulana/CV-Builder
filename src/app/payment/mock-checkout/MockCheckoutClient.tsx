"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface MockCheckoutClientProps {
  invoiceNumber: string;
  cvId: string;
  token?: string;
  qrImageUrl?: string;
}

export function MockCheckoutClient({
  invoiceNumber,
  cvId,
  token,
  qrImageUrl: initialQrImage,
}: MockCheckoutClientProps) {
  const router = useRouter();
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);

  // Fallback to local default QRIS data if initialQrImage is somehow empty
  const qrImageUrl = initialQrImage || "";

  // Auto-polling payment status every 3 seconds (real-time SociaBuzz sync)
  React.useEffect(() => {
    if (paymentSuccess) return;

    const interval = setInterval(async () => {
      try {
        setIsCheckingStatus(true);
        const res = await fetch("/api/payments/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNumber,
            token,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid" || data.status === "PAID") {
            setPaymentSuccess(true);
            clearInterval(interval);
            setTimeout(() => {
              router.push(`/payment/success?invoice=${invoiceNumber}`);
            }, 1000);
          }
        }
      } catch {
        // ignore polling network errors
      } finally {
        setIsCheckingStatus(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [invoiceNumber, token, paymentSuccess, router]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-black flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000] hard-drop overflow-hidden">
        {/* Official Header */}
        <div className="bg-black text-white p-6 border-b-[3px] border-black">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-[#FFE500] text-black border-2 border-white px-2.5 py-0.5 rounded-[2px] shadow-[2px_2px_0_0_#000]">
                QRIS Pembayaran Resmi
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider bg-[#10B981] text-black border border-white px-2 py-0.5 rounded-[2px]">
                SociaBuzz Gateway
              </span>
            </div>
            <span className="text-xs text-stone-200 font-mono font-bold flex items-center gap-1.5 bg-stone-900 border border-stone-700 px-2.5 py-0.5 rounded-[2px]">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
              Menunggu Pembayaran
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-display)]">
            Pembayaran CV Format ATS Harvard
          </h1>
          <div className="mt-2 text-xs text-stone-300 flex items-center gap-1.5 flex-wrap">
            <span>Nomor Invoice:</span>
            <span className="font-mono text-black font-black bg-[#FFE500] border-2 border-black px-2 py-0.5 rounded-[2px]">
              {invoiceNumber}
            </span>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="p-6 border-b-[3px] border-black bg-[#FFFBEB]">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-bold text-stone-700">
              Total Tagihan:
            </span>
            <span className="text-3xl sm:text-4xl font-black font-[family-name:var(--font-display)] text-black">
              Rp5.000
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
            <CheckCircle2 className="h-4 w-4 text-[#10B981] stroke-[2.5]" />
            <span>Termasuk 2 berkas (PDF &amp; DOCX Word) + 3x revisi gratis 7 hari</span>
          </div>
        </div>

        {/* QRIS Display Section */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-black block">
              Metode Pembayaran:
            </span>
            <span className="text-[11px] font-black bg-[#10B981] text-black border-2 border-black px-2 py-0.5 rounded-[2px] shadow-[1.5px_1.5px_0_0_#000]">
              QRIS ONLY
            </span>
          </div>

          {/* QRIS Card with Live Barcode */}
          <div className="p-5 rounded-[3px] border-2 border-black bg-[#FFE500] shadow-[3px_3px_0_0_#000] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-[3px] bg-black text-white border-2 border-black flex items-center justify-center shadow-[1px_1px_0_0_#000]">
                  <QrCode className="h-6 w-6 text-[#FFE500]" />
                </div>
                <div>
                  <p className="text-sm font-black text-black">
                    QRIS (Standar Pembayaran Nasional)
                  </p>
                  <p className="text-[11px] font-bold text-stone-900">
                    BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black bg-white border border-black px-2 py-0.5 rounded-[2px]">
                AKTIF
              </span>
            </div>

            {/* Official QR Code Box */}
            <div className="bg-white border-2 border-black p-5 rounded-[3px] flex flex-col items-center justify-center text-center">
              <div className="w-56 h-56 bg-white border-[3px] border-black rounded-[2px] flex items-center justify-center p-2 shadow-[2px_2px_0_0_#000] overflow-hidden">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="QRIS Barcode CVBuilder"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 p-4">
                    <RefreshCw className="h-8 w-8 animate-spin mb-2 text-black" />
                    <span className="text-xs font-bold text-black">Memuat QRIS...</span>
                  </div>
                )}
              </div>

              {/* Status Listening Indicator */}
              <div className="mt-4 w-full">
                {paymentSuccess ? (
                  <div className="bg-[#10B981] border-2 border-black p-3 rounded-[3px] text-center shadow-[2px_2px_0_0_#000]">
                    <div className="flex items-center justify-center gap-2 font-black text-black text-sm">
                      <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                      <span>Pembayaran Terverifikasi Lunas!</span>
                    </div>
                    <p className="text-xs font-semibold text-black/90 mt-0.5">
                      Mengalihkan otomatis ke halaman unduh...
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#FFFBEB] border-2 border-black p-3 rounded-[3px] text-center shadow-[1px_1px_0_0_#000]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-ping" />
                      <span className="text-xs font-black text-black">
                        {isCheckingStatus
                          ? "Mengecek konfirmasi transfer SociaBuzz..."
                          : "Menunggu pembayaran dari HP..."}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-stone-800 mt-1.5">
                      Buka aplikasi mobile banking atau e-wallet Anda, lalu scan QR di atas.
                    </p>
                    <p className="text-[10px] font-semibold text-stone-600 mt-0.5">
                      Halaman ini akan otomatis selesai begitu SociaBuzz mengonfirmasi transfer Anda.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Navigation */}
          <div className="pt-2">
            <Link
              href={cvId ? `/cv/${cvId}/download` : "/dashboard"}
              className="block text-center text-xs font-bold text-stone-700 hover:text-black py-2 underline underline-offset-2"
            >
              Batalkan &amp; Kembali ke Halaman Draf
            </Link>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="px-6 py-3.5 bg-[#FFFBEB] border-t-2 border-black text-[11px] font-bold text-black text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#10B981] stroke-[2.5]" />
          <span>Verifikasi Otomatis Melalui Webhook SociaBuzz Real-Time</span>
        </div>
      </div>
    </div>
  );
}
