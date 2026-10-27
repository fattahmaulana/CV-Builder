"use client";

import * as React from "react";
import { IconSparkles } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  {
    category: "Organisasi & Kepanitiaan",
    title: "Ketua Divisi Logistik Acara Dies Natalis",
    before:
      "Tugas saya ngurusin barang-barang acara, sewa tenda dan sound system, terus pas hari H jaga stand konsumsi buat panitia.",
    after:
      "Memimpin pengadaan sarana & prasarana untuk 800+ peserta Dies Natalis; menegosiasikan kontrak 5 vendor eksternal yang menghemat anggaran sebesar 14% dari pagu awal.",
    metrics: ["800+ Peserta", "5 Vendor", "Hemat 14% Anggaran"],
  },
  {
    category: "Magang (Fresh Graduate)",
    title: "Magang Administrasi & Keuangan",
    before:
      "Sering input data nota belanja harian kantor ke excel, terus scan kuitansi pembayaran kantor tiap sore.",
    after:
      "Menginput dan merekonsiliasi 350+ bukti transaksi bulanan ke dalam Microsoft Excel dengan tingkat akurasi 99,8%; mempercepat proses pelaporan pajak mingguan divisi.",
    metrics: ["350+ Transaksi/Bulan", "99,8% Akurasi", "Laporan Pajak"],
  },
  {
    category: "Proyek Akademik",
    title: "Proyek Riset Tugas Akhir / Capstone",
    before:
      "Bikin penelitian tentang kepuasan pelanggan di kafe lokal pake kuesioner google form yang disebar ke mahasiswa.",
    after:
      "Merancang instrumen riset dan menganalisis data kepuasan 210 konsumen kafe menggunakan regresi SPSS, merumuskan 4 rekomendasi strategi retensi pelanggan.",
    metrics: ["210 Responden", "Metode SPSS", "4 Rekomendasi"],
  },
];

export function BeforeAfterSection() {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <section className="py-24 px-6 bg-[var(--color-bg-canvas)] border-t border-[var(--color-border-subtle)]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] px-3 py-1 rounded-full">
            Studi Kasus Nyata
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)] mt-3">
            Transformasi Sebelum &amp; Sesudah
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Lihat bagaimana pengalaman mahasiswa biasa diubah menjadi poin profesional berbobot standar rekruter global.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {EXAMPLES.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer",
                activeTab === idx
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              )}
            >
              {item.category}
            </button>
          ))}
        </div>

        {/* Selected Example Card */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--color-text-main)]">
              Peran: {EXAMPLES[activeTab].title}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Before */}
            <div className="space-y-2 p-5 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]/60 border border-[var(--color-border-subtle)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Sebelum (Bahasa Mentah Pengguna):
              </span>
              <p className="text-xs sm:text-sm font-mono text-[var(--color-text-muted)] leading-relaxed pt-2">
                &quot;{EXAMPLES[activeTab].before}&quot;
              </p>
            </div>

            {/* After */}
            <div className="space-y-2 p-5 rounded-[var(--radius-md)] bg-[#FAF7F2] border border-[var(--color-accent-border)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                <IconSparkles className="h-3.5 w-3.5" />
                <span>Sesudah (Format Harvard ATS):</span>
              </span>
              <p className="text-xs sm:text-sm font-sans text-[var(--color-text-main)] leading-relaxed pt-2 font-medium">
                • {EXAMPLES[activeTab].after}
              </p>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Metrik Kunci yang Ditonjolkan:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES[activeTab].metrics.map((metric, i) => (
                <span
                  key={i}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent-border)]"
                >
                  ✓ {metric}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
