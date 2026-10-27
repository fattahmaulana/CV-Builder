import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Format CV Harvard: Standar Internasional Paling Terbaca ATS",
  description:
    "Mengapa template resume Harvard University menjadi standar emas global bagi rekruter dan sistem ATS. Pelajari aturan margin, font, dan penataannya.",
  keywords: ["format cv harvard", "template resume harvard", "cv satu kolom ats", "cv profesional"],
};

export default function FormatCvHarvardPage() {
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
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] px-3 py-1 rounded-full">
            Standar Dokumen
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] mt-4 leading-tight">
            Format CV Harvard: Rahasia Standar Emas Lolos Pemindaian ATS
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Diperbarui Oktober 2026 • 5 menit baca
          </p>
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--color-text-main)]">
          <p>
            Harvard Office of Career Services telah merilis pedoman resmi penulisan
            resume yang selama puluhan tahun diakui secara global oleh perusahaan
            multinasional, perbankan, konsultan, hingga startup teknologi.
          </p>

          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            Aturan Baku Format Harvard Resume
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)]">
              <CheckCircle className="h-4 w-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <div>
                <strong>Satu Kolom Penuh:</strong> Tidak menggunakan partisi vertikal.
                Teks mengalir horizontal dari kiri ke kanan sehingga parser ATS tidak pernah
                tertukar urutan bacanya.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)]">
              <CheckCircle className="h-4 w-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <div>
                <strong>Tipografi Bersih &amp; Terbaca:</strong> Menggunakan font baku
                seperti Times New Roman, Arial, atau Calibri. Ukuran teks isi 10–12 pt,
                nama pelamar 14–16 pt bold.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)]">
              <CheckCircle className="h-4 w-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <div>
                <strong>Margin 1 Inci (2.54 cm):</strong> Memberikan ruang putih yang seimbang,
                tampak rapi saat dicetak di kertas A4 atau dibaca di layar rekruter.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)]">
              <CheckCircle className="h-4 w-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <div>
                <strong>Bebas Elemen Grafis:</strong> Tanpa foto, bar skill persentase,
                tabel garis tebal, atau ikon warna-warni yang membingungkan OCR sistem ATS.
              </div>
            </div>
          </div>

          <p>
            CVBuilder mengadopsi format ini secara ketat pada hasil unduhan dokumen PDF asli
            (teks dapat diseleksi) dan dokumen Word DOCX resmi.
          </p>

          <div className="mt-8 p-6 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Siap menyusun CV format Harvard Anda?</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Cukup isi data Anda sekali, ekspor ke PDF dan DOCX dengan satu klik.
              </p>
            </div>
            <Link href="/auth/login">
              <Button variant="primary" size="md">
                Buat CV Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
