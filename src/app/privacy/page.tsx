import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi (UU PDP) | CVBuilder",
  description:
    "Transparansi pengelolaan data pribadi pengguna CVBuilder sesuai ketentuan Undang-Undang Pelindungan Data Pribadi (UU PDP).",
};

export default function PrivacyPage() {
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
          <div className="flex items-center gap-2 text-[var(--color-accent)] font-semibold text-xs mb-2">
            <Shield className="h-4 w-4" />
            <span>Kepatuhan UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022)</span>
          </div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] leading-tight">
            Kebijakan Privasi CVBuilder
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Berlaku efektif sejak: 26 Oktober 2026
          </p>
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--color-text-main)]">
          <p>
            Privasi Anda adalah prioritas mutlak kami. Kebijakan ini menjelaskan
            secara transparan data apa yang kami kumpulkan, bagaimana data tersebut
            diproses, dan bagaimana hak-hak Anda dilindungi di bawah hukum Indonesia.
          </p>

          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            1. Data yang Kami Kumpulkan &amp; Tidak Kami Kumpulkan
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--color-text-muted)]">
            <li>
              <strong>Data Akun:</strong> Alamat email dan nama publik dari akun Google OAuth Anda.
            </li>
            <li>
              <strong>Data Dokumen CV:</strong> Nama, riwayat pendidikan, pengalaman organisasi/kerja, dan keahlian yang Anda masukkan secara sukarela.
            </li>
            <li>
              <strong>Data yang TIDAK Pernah Kami Kumpulkan:</strong> Kami tidak pernah meminta atau menyimpan Nomor Induk Kependudukan (NIK/KTP), nomor kartu kredit, tanggal lahir lengkap, atau data biometrik.
            </li>
          </ul>

          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            2. Pemrosesan Kecerdasan Buatan (Google Gemini)
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Untuk menyempurnakan tata bahasa dan mencocokkan kata kunci lowongan, teks deskripsi pengalaman dikirimkan ke <strong>Google Gemini API</strong> resmi. Sebelum dikirim, sistem kami memfilter informasi kontak pribadi (nomor HP dan alamat). Sesuai ketentuan API Enterprise, Google tidak menggunakan data Anda untuk melatih model kecerdasan buatan publik.
          </p>

          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            3. Pemrosesan Pembayaran (DOKU Checkout)
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Transaksi pembayaran diproses melalui gateway pembayaran berizin Bank Indonesia, <strong>PT Nusa Satu Inti Artha (DOKU)</strong>. CVBuilder tidak pernah menyimpan data nomor rekening atau kartu Anda. Kami hanya mencatat nomor invoice, nominal, dan status transaksi untuk kepentingan verifikasi unduhan dan pembukuan resmi.
          </p>

          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] pt-4 border-t border-[var(--color-border-subtle)]">
            4. Hak Pengguna &amp; Penghapusan Data
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Anda berhak melihat, mengoreksi, atau menghapus seluruh draf CV dan riwayat akun Anda kapan saja melalui dashboard aplikasi. Fitur hapus akun akan menghapus seluruh catatan data pribadi Anda dari server utama kami secara permanen.
          </p>
        </div>
      </article>
    </div>
  );
}
