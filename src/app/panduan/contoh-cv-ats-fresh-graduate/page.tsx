import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contoh CV ATS Fresh Graduate yang Tepat & Efektif",
  description:
    "Lihat struktur dan contoh nyata penulisan CV ATS untuk fresh graduate tanpa pengalaman kerja tetap: magang, proyek kuliah, dan organisasi.",
  keywords: ["contoh cv ats fresh graduate", "cv fresh graduate harvard", "struktur cv ats", "template cv ats"],
};

export default function ContohCvFreshGraduatePage() {
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
            Panduan Fresh Graduate
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] mt-4 leading-tight">
            Contoh CV ATS Fresh Graduate: Susunan &amp; Rumus Poin Efektif
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Diperbarui Oktober 2026 • 6 menit baca
          </p>
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--color-text-main)]">
          <p>
            Tantangan terbesar lulusan baru (fresh graduate) adalah merasa tidak memiliki
            pengalaman kerja formal yang cukup. Padahal, rekruter mencari potensi,
            kemampuan menyelesaikan masalah, dan inisiatif nyata Anda selama masa studi.
          </p>

          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            Urutan Struktur CV Standar Harvard untuk Fresh Graduate
          </h2>

          <div className="space-y-4">
            <div className="p-4 border-l-4 border-[var(--color-accent)] bg-[var(--color-bg-subtle)] rounded-r-[var(--radius-md)]">
              <h3 className="font-bold text-sm">1. Informasi Kontak Singkat</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Nama Lengkap, Kota Domisili, Nomor WhatsApp Aktif, Email Profesional,
                dan Link LinkedIn (atau Portofolio/GitHub). Tidak perlu tanggal lahir, agama, atau foto.
              </p>
            </div>

            <div className="p-4 border-l-4 border-[var(--color-accent)] bg-[var(--color-bg-subtle)] rounded-r-[var(--radius-md)]">
              <h3 className="font-bold text-sm">2. Pendidikan (Letakkan di Atas untuk Fresh Graduate)</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Nama Universitas, Gelar &amp; Jurusan, Tahun Kelulusan, serta IPK (jika di atas 3.00 atau setara).
                Sertakan 2–3 mata kuliah relevan dengan posisi yang dilamar.
              </p>
            </div>

            <div className="p-4 border-l-4 border-[var(--color-accent)] bg-[var(--color-bg-subtle)] rounded-r-[var(--radius-md)]">
              <h3 className="font-bold text-sm">3. Pengalaman (Magang, Organisasi, Kepanitiaan)</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Fokuskan pada tanggung jawab dan hasil kerja nyata menggunakan rumus XYZ:
                <em> "Mencapai [X], diukur dengan [Y], dengan melakukan [Z]."</em>
              </p>
            </div>

            <div className="p-4 border-l-4 border-[var(--color-accent)] bg-[var(--color-bg-subtle)] rounded-r-[var(--radius-md)]">
              <h3 className="font-bold text-sm">4. Proyek Akademik / Portofolio Mandiri</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Sangat krusial untuk jurusan teknik, desain, riset, atau manajemen bisnis. Tunjukkan alat dan metode yang Anda pakai.
              </p>
            </div>

            <div className="p-4 border-l-4 border-[var(--color-accent)] bg-[var(--color-bg-subtle)] rounded-r-[var(--radius-md)]">
              <h3 className="font-bold text-sm">5. Keahlian &amp; Sertifikasi</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Kelompokkan keahlian teknis (Software, Bahasa Pemrograman, Tools) dan sertifikasi resmi dengan nomor lisensi.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
            <span>Perbandingan Penulisan Poin: Lemah vs Kuat</span>
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-error-light)] text-[var(--color-error)]">
              <span className="font-bold">❌ Lemah:</span> "Bertanggung jawab mengurus media sosial himpunan mahasiswa."
            </div>
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-success-light)] text-[var(--color-success)]">
              <span className="font-bold">✓ Kuat:</span> "Mengelola kalender konten Instagram Himpunan dengan menerbitkan 14 unggahan edukatif, meningkatkan interaksi audiens sebesar 35% dalam 3 bulan."
            </div>
          </div>

          <div className="mt-8 p-6 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Bingung merapikan kalimat pengalaman Anda?</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Ketik pengalaman apa adanya, biarkan asisten AI CVBuilder merumuskannya ke poin tindakan berbobot.
              </p>
            </div>
            <Link href="/auth/login">
              <Button variant="primary" size="md">
                Coba CVBuilder Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
