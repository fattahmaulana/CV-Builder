import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  Calendar,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil | CVBuilder",
};

interface SuccessPageProps {
  searchParams: Promise<{ invoice?: string }>;
}

export default async function PaymentSuccessPage(props: SuccessPageProps) {
  const { invoice } = await props.searchParams;
  const supabase = await createClient();

  // Fetch order and related CV
  let orderData = null;
  let cvData = null;

  if (invoice) {
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("invoice_number", invoice)
      .maybeSingle();

    if (order) {
      orderData = order;
      const { data: cv } = await supabase
        .from("cvs")
        .select("id, title")
        .eq("id", order.cv_id)
        .maybeSingle();
      cvData = cv;
    }
  }

  const cvId = orderData?.cv_id || "";
  const cvTitle = cvData?.title || "CV Format ATS Harvard";
  const deadlineStr = orderData?.revision_deadline
    ? new Date(orderData.revision_deadline).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "7 hari kalender";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-black flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000] overflow-hidden">
        {/* Top Neobrutalist Success Banner */}
        <div className="bg-[#10B981] text-black p-6 sm:p-8 text-center border-b-[3px] border-black relative">
          <div className="h-16 w-16 rounded-[4px] bg-white text-black border-[3px] border-black mx-auto flex items-center justify-center shadow-[3px_3px_0_0_#000] mb-4">
            <CheckCircle2 className="h-10 w-10 text-black stroke-[2.5]" />
          </div>
          <div className="inline-block border-2 border-black bg-black text-white px-3 py-1 rounded-[2px] font-mono text-[11px] font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0_0_#FFE500]">
            Pembayaran Terverifikasi • Rp5.000
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-display)] tracking-tight mt-1">
            Terima Kasih! CV Siap Diunduh
          </h1>
          <p className="text-xs font-semibold text-black/90 mt-1.5 max-w-md mx-auto">
            Status pesanan lunas. Watermark preview telah dihapus permanen untuk berkas PDF dan DOCX Anda.
          </p>
        </div>

        {/* Order Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-[#FFFBEB] p-4 sm:p-5 rounded-[3px] border-2 border-black shadow-[3px_3px_0_0_#000] space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-700">Nomor Invoice:</span>
              <span className="font-mono font-black text-black bg-white border-2 border-black px-2 py-0.5 rounded-[2px] shadow-[1px_1px_0_0_#000]">
                {invoice || "INV-CVK-CONFIRMED"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-700">Dokumen CV:</span>
              <span className="font-bold text-black text-right max-w-[240px] truncate">{cvTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-700">Total Biaya:</span>
              <span className="font-black text-black bg-[#10B981] border-2 border-black px-2 py-0.5 rounded-[2px] text-xs">
                Rp5.000 (Lunas)
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t-2 border-black">
              <span className="flex items-center gap-1.5 text-black font-bold">
                <Calendar className="h-4 w-4 text-black" />
                Garansi 3x Revisi Gratis:
              </span>
              <span className="font-bold text-black bg-[#FFE500] border-2 border-black px-2 py-0.5 rounded-[2px]">
                Aktif s/d {deadlineStr}
              </span>
            </div>
          </div>

          {/* Direct Download Actions */}
          {cvId ? (
            <div className="space-y-3">
              <Link
                href={`/cv/${cvId}/download`}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 text-base font-black bg-[#FFE500] hover:bg-[#FDD835] text-black border-[3px] border-black rounded-[3px] hard-drop cursor-pointer transition-colors"
              >
                <Download className="h-5 w-5 stroke-[2.5]" />
                <span>Buka Halaman Unduhan Berkas</span>
                <ExternalLink className="h-4 w-4 ml-1" />
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={`/api/cv/${cvId}/download?format=pdf`}
                  download
                  className="flex items-center justify-center gap-2 p-3.5 rounded-[3px] border-2 border-black bg-white hover:bg-[#FFFBEB] text-xs font-black text-black hard-drop-sm transition-all"
                >
                  <Download className="h-4 w-4 stroke-[2.5] text-black" />
                  <span>Unduh PDF Asli (Harvard)</span>
                </a>

                <a
                  href={`/api/cv/${cvId}/download?format=docx`}
                  download
                  className="flex items-center justify-center gap-2 p-3.5 rounded-[3px] border-2 border-black bg-[#4D7CFF] hover:bg-[#3B6BE8] text-xs font-black text-white hard-drop-sm transition-all"
                >
                  <FileText className="h-4 w-4 stroke-[2.5] text-white" />
                  <span>Unduh DOCX Word</span>
                </a>
              </div>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black bg-[#FFE500] text-black border-2 border-black rounded-[3px] hard-drop"
            >
              Kembali ke Dashboard
            </Link>
          )}

          {/* Editorial ATS Guarantee */}
          <div className="p-4 rounded-[3px] bg-white border-2 border-black shadow-[2px_2px_0_0_#000] text-xs text-stone-800 space-y-1.5">
            <p className="font-black text-black flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-black stroke-[2.5]" />
              Format Terbaca ATS Terjamin
            </p>
            <p className="text-[11px] leading-relaxed text-stone-700">
              Berkas Anda telah dikompilasi dengan standar 1-kolom Harvard murni, font standar yang dapat diseleksi oleh parser ATS, dan tanpa tabel tersembunyi yang membingungkan sistem rekruter.
            </p>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-stone-700 hover:text-black inline-flex items-center gap-1.5 border-b border-black pb-0.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Dashboard Anda</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

