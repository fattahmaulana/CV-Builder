"use client";

import * as React from "react";
import Link from "next/link";
import { CvData } from "@/types/cv";
import { HarvardCvPreview } from "@/components/cv/HarvardCvPreview";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Clock,
  Sparkles,
} from "lucide-react";

interface DownloadClientProps {
  cvId: string;
  cvTitle: string;
  cvData: CvData;
  isPaid: boolean;
  orderInfo?: {
    orderNumber?: string;
    paidAt?: string;
    revisionsUsed: number;
    maxRevisions: number;
  };
}

export function DownloadClient({
  cvId,
  cvTitle,
  cvData,
  isPaid: initialIsPaid,
  orderInfo,
}: DownloadClientProps) {
  const [isPaid, setIsPaid] = React.useState(initialIsPaid);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [downloadingFormat, setDownloadingFormat] = React.useState<"pdf" | "docx" | null>(null);

  const handleDownload = async (format: "pdf" | "docx", isDevTest: boolean = false) => {
    try {
      setDownloadingFormat(format);
      const url = `/api/cv/${cvId}/download?format=${format}${isDevTest ? "&test=true" : ""}`;

      const link = document.createElement("a");
      link.href = url;
      link.download = `CV_${cvData.personalInfo.fullName || "Harvard"}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal mengunduh file:", err);
      alert("Gagal mengunduh berkas. Silakan coba kembali.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleInitiatePayment = async () => {
    try {
      setIsProcessingPayment(true);
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal membuat sesi pembayaran");
      }

      if (json.alreadyPaid) {
        setIsPaid(true);
        alert("Dokumen ini telah lunas! Anda dapat langsung mengunduh berkas resmi.");
        return;
      }

      if (json.paymentUrl) {
        window.location.href = json.paymentUrl;
      } else {
        throw new Error("Tautan pembayaran tidak diterima dari server");
      }
    } catch (err: unknown) {
      console.error("Payment initiation error:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memulai pembayaran";
      alert(msg);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-black flex flex-col">
      {/* Top Navigation */}
      <header className="border-b-[3px] border-black bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href={`/cv/${cvId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border-2 border-black bg-[#FFFBEB] hover:bg-[#FFE500] text-xs font-black hard-drop-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            <span>Kembali ke Editor</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-[2px] bg-[#FFE500] text-black border-2 border-black shadow-[1.5px_1.5px_0_0_#000]">
              Format ATS Harvard
            </span>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-[2px] border-2 border-black shadow-[1.5px_1.5px_0_0_#000] ${
                isPaid
                  ? "bg-[#10B981] text-black"
                  : "bg-[#FF6B9D] text-black"
              }`}
            >
              {isPaid ? "Status: Lunas" : "Draf Watermark"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Actions / Checkout / Downloads */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-block border-2 border-black bg-[#FFE500] text-black px-2.5 py-0.5 rounded-[2px] font-mono text-[11px] font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0_0_#000]">
                {isPaid ? "Akses Unduhan Berkas" : "Tahap Akhir"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] tracking-tight">
                {isPaid ? "Unduh Berkas Resmi" : "Selesaikan & Unduh CV"}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-stone-700 mt-1.5 leading-relaxed">
                {isPaid
                  ? "Dokumen CV Anda siap digunakan untuk melamar kerja. Unduh dalam format PDF asli atau DOCX Word tanpa watermark."
                  : "Dapatkan berkas bersih tanpa watermark format standar Harvard yang terbaca optimal oleh sistem ATS rekruter."}
              </p>
            </div>

            {/* Paid State Cards */}
            {isPaid ? (
              <div className="space-y-4">
                <div className="p-5 rounded-[3px] bg-[#10B981]/20 border-[3px] border-black shadow-[4px_4px_0_0_#000] text-black">
                  <div className="flex items-center gap-2 font-black text-sm text-black mb-1">
                    <CheckCircle2 className="h-5 w-5 text-black stroke-[2.5]" />
                    <span>Pembayaran Terverifikasi (Lunas)</span>
                  </div>
                  <p className="text-xs font-semibold text-stone-800 leading-relaxed">
                    Akses unduhan aktif tanpa batas waktu. Anda juga mendapatkan garansi 3x revisi gratis dalam 7 hari kalender.
                  </p>
                  {orderInfo && (
                    <div className="mt-3 pt-3 border-t-2 border-black flex items-center justify-between text-xs text-black font-mono font-bold">
                      <span>Sisa Revisi:</span>
                      <span className="bg-[#FFE500] border-2 border-black px-2 py-0.5 rounded-[2px]">
                        {orderInfo.maxRevisions - orderInfo.revisionsUsed} dari {orderInfo.maxRevisions} kali
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Download Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2.5 py-4 px-6 text-base font-black bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[3px] hard-drop cursor-pointer transition-colors disabled:opacity-50"
                    onClick={() => handleDownload("pdf")}
                    disabled={downloadingFormat !== null}
                  >
                    <Download className="h-5 w-5 stroke-[2.5]" />
                    <span>
                      {downloadingFormat === "pdf" ? "Menyiapkan PDF..." : "Unduh PDF ATS Resmi (Harvard)"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2.5 py-4 px-6 text-base font-black bg-[#4D7CFF] hover:bg-[#3B6BE8] text-white border-[3px] border-black rounded-[3px] hard-drop cursor-pointer transition-colors disabled:opacity-50"
                    onClick={() => handleDownload("docx")}
                    disabled={downloadingFormat !== null}
                  >
                    <FileText className="h-5 w-5 stroke-[2.5] text-white" />
                    <span>
                      {downloadingFormat === "docx" ? "Menyiapkan DOCX..." : "Unduh DOCX Word (Bisa Diedit)"}
                    </span>
                  </button>
                </div>

                {/* ATS Specifications Card */}
                <div className="p-4 rounded-[3px] bg-white border-2 border-black shadow-[2px_2px_0_0_#000] space-y-2 text-xs text-stone-800">
                  <p className="font-black text-black flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-black stroke-[2.5]" />
                    Spesifikasi Teknis ATS Harvard:
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside font-semibold text-stone-700">
                    <li>1 Kolom linier murni (tanpa multi-kolom yang membingungkan parser)</li>
                    <li>Teks dapat diseleksi &amp; dicari (bukan gambar raster)</li>
                    <li>Heading standar (Pendidikan, Pengalaman, Keahlian)</li>
                    <li>Margin 1 inci standar akademik Harvard</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Unpaid / Checkout State Card */
              <div className="space-y-6">
                <div className="p-6 rounded-[3px] bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black bg-[#FFE500] border-2 border-black px-2.5 py-0.5 rounded-[2px] shadow-[1.5px_1.5px_0_0_#000]">
                      Sekali Bayar • Akses Penuh
                    </span>
                    <span className="text-xs font-bold text-stone-600">Tanpa Langganan</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl sm:text-5xl font-black font-[family-name:var(--font-display)] text-black">
                      Rp5.000
                    </span>
                    <span className="text-xs font-bold text-stone-600">/ dokumen CV</span>
                  </div>

                  <p className="text-xs font-semibold text-stone-700 mb-5 leading-relaxed">
                    Satu kali bayar terjangkau untuk pencari kerja Indonesia. Dapatkan dokumen siap kirim ke portal HRD / ATS.
                  </p>

                  <div className="space-y-2.5 mb-6 text-xs text-black font-semibold">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] stroke-[2.5] shrink-0 mt-0.5" />
                      <span><strong>Format Terbaca ATS</strong> gaya Harvard (1 kolom, font standar, hierarki heading)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] stroke-[2.5] shrink-0 mt-0.5" />
                      <span><strong>Dua Format Sekaligus:</strong> PDF asli (selectable text) &amp; DOCX Word</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] stroke-[2.5] shrink-0 mt-0.5" />
                      <span><strong>Garansi 3x Revisi Gratis</strong> dalam 7 hari kalender</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] stroke-[2.5] shrink-0 mt-0.5" />
                      <span>Watermark preview dihapus permanen di semua berkas</span>
                    </div>
                  </div>

                  {/* Payment Methods Banner (QRIS Only) */}
                  <div className="bg-[#FFFBEB] p-3.5 rounded-[3px] border-2 border-black shadow-[2px_2px_0_0_#000] mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-black text-black uppercase tracking-wider">
                        Metode Pembayaran:
                      </p>
                      <span className="text-[10px] font-black bg-[#10B981] text-black border border-black px-1.5 py-0.5 rounded-[2px]">
                        QRIS ONLY
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-black flex-wrap">
                      <span className="inline-flex items-center gap-1 bg-[#FFE500] border border-black px-1.5 py-0.5 rounded-[2px]">
                        <QrCode className="h-3.5 w-3.5" /> QRIS Nasional
                      </span>
                      <span>•</span>
                      <span>GoPay</span>
                      <span>•</span>
                      <span>OVO</span>
                      <span>•</span>
                      <span>ShopeePay</span>
                      <span>•</span>
                      <span>DANA</span>
                      <span>•</span>
                      <span>BCA, Mandiri, BRI &amp; M-Banking</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 text-base font-black bg-[#10B981] hover:bg-[#059669] text-black border-[3px] border-black rounded-[3px] hard-drop cursor-pointer transition-colors disabled:opacity-50"
                    onClick={handleInitiatePayment}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Clock className="h-5 w-5 animate-spin mr-1" />
                        <span>Menyiapkan QRIS...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="h-5 w-5 stroke-[2.5]" />
                        <span>Bayar Rp5.000 via QRIS &amp; Unduh Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Document Preview */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Pratinjau Hasil Cetak
              </span>
              <span className="text-xs font-mono font-bold text-stone-700 bg-white border border-black px-2 py-0.5 rounded-[2px]">
                Ukuran A4 • Margin 1 Inci
              </span>
            </div>

            {/* Neobrutalist Desk Frame Container */}
            <div className="border-[3px] border-black rounded-[3px] overflow-hidden shadow-[6px_6px_0_0_#000] bg-stone-100">
              <div className="bg-black text-white px-4 py-2 border-b-2 border-black flex items-center justify-between text-xs font-mono font-bold">
                <span className="truncate max-w-[280px]">
                  {cvTitle || "CV Format ATS Harvard"}
                </span>
                <span className="text-[#FFE500]">Standar Harvard 1-Kolom</span>
              </div>
              <div className="p-4 sm:p-6 overflow-x-auto">
                <div className="bg-white border-2 border-stone-300 shadow-md p-6 sm:p-8 min-w-[320px]">
                  <HarvardCvPreview data={cvData} isPaid={isPaid} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

