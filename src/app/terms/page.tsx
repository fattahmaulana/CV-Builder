import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan | CVBuilder",
  description: "Ketentuan penggunaan platform CVBuilder, batas garansi, dan ketentuan pembayaran.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-main)] py-12 px-6">
      <article className="max-w-3xl mx-auto bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-8 sm:p-12 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] mb-8 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] leading-tight">
            Syarat &amp; Ketentuan Layanan
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Berlaku efektif sejak: 26 Oktober 2026
          </p>
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--color-text-main)]">
          <h2 className="text-lg font-bold font-[family-name:var(--font-display)]">
            1. Ruang Lingkup Layanan
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            CVBuilder menyediakan perangkat lunak berbasis web untuk membantu pengguna menyusun dokumen kurikulum vitae (CV) berformat ATS standar Harvard, memoles penulisan poin pengalaman, dan mencocokkan kata kunci lowongan kerja.
          </p>

          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            2. Batasan Garansi (Disclaimer Lolos Seleksi)
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            CVBuilder <strong>TIDAK MENJAMIN</strong> bahwa pengguna pasti akan lolos seleksi berkas, menerima panggilan wawancara, atau diterima bekerja di perusahaan mana pun. Hasil seleksi kerja sepenuhnya merupakan hak prerogatif rekruter dan pihak perusahaan perekrut. Klaim layanan kami terbatas pada "format dokumen terbaca oleh sistem ATS" dan "analisis kesesuaian kata kunci lowongan".
          </p>

          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            3. Biaya, Unduhan, dan Hak Revisi
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Layanan preview dokumen adalah gratis dengan watermark. Pembayaran sebesar Rp5.000 (lima ribu rupiah) berlaku untuk satu CV final dan memberikan hak unduh berkas PDF tanpa watermark dan berkas Word (DOCX), serta hak revisi sebanyak 3 (tiga) kali dalam rentang waktu 7 (tujuh) hari kalender tanpa dipungut biaya tambahan.
          </p>

          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            4. Tanggung Jawab Keaslian Data
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Pengguna bertanggung jawab penuh atas kebenaran fakta, gelar, riwayat pekerjaan, dan kualifikasi yang dicantumkan. AI CVBuilder diprogram untuk tidak mengarang fakta baru di luar data mentah yang dimasukkan pengguna.
          </p>
        </div>
      </article>
    </div>
  );
}
