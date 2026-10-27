import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Apa Itu CV ATS? Penjelasan Lengkap & Cara Kerjanya",
  description:
    "Pelajari apa itu Applicant Tracking System (ATS), cara mesin menyaring ribuan CV pelamar, dan mengapa format satu kolom gaya Harvard paling aman digunakan.",
  keywords: ["apa itu cv ats", "sistem ats", "format terbaca ats", "cv kerja fresh graduate"],
};

export default function ApaItuCvAtsPage() {
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
            Panduan Edukasi
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] mt-4 leading-tight">
            Apa Itu CV ATS? Mengapa Format Sederhana Lebih Terbaca
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Diperbarui Oktober 2026 • 5 menit baca
          </p>
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--color-text-main)]">
          <p>
            <strong>Applicant Tracking System (ATS)</strong> adalah perangkat lunak
            yang digunakan oleh tim rekruter dan HRD perusahaan untuk mengumpulkan,
            memindai, dan menyortir ratusan hingga ribuan berkas lamaran kerja secara
            otomatis.
          </p>

          <p>
            Saat Anda mengirimkan berkas CV ke portal lowongan kerja, sistem ATS
            akan mengekstrak teks di dalam berkas (proses *parsing*) dan
            mengelompokkannya ke dalam kolom-kolom database, seperti: Pendidikan,
            Pengalaman Kerja, Keahlian, dan Kontak.
          </p>

          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            Mengapa CV Desain Cantik Sering Gagal di ATS?
          </h2>
          <p>
            Banyak pencari kerja, terutama fresh graduate, membuat CV menggunakan
            alat grafis yang memiliki tata letak dua kolom, diagram lingkaran keahlian,
            ikon, serta tabel. Bagi mata manusia, tampilan tersebut terlihat menarik.
            Namun, bagi algoritma ATS:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)]/20 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[var(--color-error)] text-xs">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>Format yang Merusak Ekstraksi</span>
              </div>
              <ul className="text-xs text-[var(--color-text-muted)] space-y-1.5 list-disc pl-4">
                <li>Kolom ganda (teks terbaca zigzag melintang).</li>
                <li>Ikon dan rating bar (persentase skill tidak terbaca).</li>
                <li>Kotak teks (text box) yang dilewati parser.</li>
                <li>Tabel dengan garis kompleks.</li>
              </ul>
            </div>

            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-success-light)] border border-[var(--color-success)]/20 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[var(--color-success)] text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Format Standar ATS (Gaya Harvard)</span>
              </div>
              <ul className="text-xs text-[var(--color-text-muted)] space-y-1.5 list-disc pl-4">
                <li>Satu kolom dari atas ke bawah.</li>
                <li>Heading standar: Pendidikan, Pengalaman, Keahlian.</li>
                <li>Poin berawalan kata kerja tindakan aktif.</li>
                <li>Font standar (Times New Roman, Arial, atau Calibri).</li>
              </ul>
            </div>
          </div>

          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            Apakah Format ATS Menjamin Kelolosan Otomatis?
          </h2>
          <p>
            <strong>Jawabannya tegas: Tidak ada sistem yang bisa menjamin kelolosan.</strong>{" "}
            Sistem ATS hanyalah alat bantu baca. Keputusan akhir memanggil Anda untuk
            wawancara tetap berada di tangan rekruter manusia.
          </p>
          <p>
            Tugas format ATS adalah memastikan berkas Anda <em>terbaca sempurna</em>,
            kata kunci relevan Anda terindeks dengan benar, dan rekruter tidak pusing
            mencari data penting Anda dalam 6 detik pertama evaluasi.
          </p>

          <div className="mt-8 p-6 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Ingin membuat CV yang formatnya terbaca ATS?</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Gunakan editor CVBuilder untuk merapikan teks dan mencocokkan kata kunci lowongan.
              </p>
            </div>
            <Link href="/auth/login">
              <Button variant="primary" size="md">
                Mulai Buat CV
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
