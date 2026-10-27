"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { XCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export function AtsAuditSection() {
  return (
    <section
      id="kenapa-ats"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-[var(--bg)] border-b-[3px] border-black"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="accent3" isSticker className="mb-3">
            KOMPARASI REALISTIS ATS
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-[family-name:var(--font-display)] tracking-tight text-black">
            Kenapa Desain CV Cantik Sering Gagal Terbaca ATS?
          </h2>
          <p className="mt-4 text-base text-neutral-800 font-[family-name:var(--font-body)]">
            Algoritma sistem rekruter membaca berkas dari atas ke bawah. Tata letak kolom ganda dan diagram grafis membuat teks terbaca melintang secara acak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Card 1: Format Grafis / 2 Kolom (Gagal Ekstraksi) */}
          <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000000] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <span className="font-extrabold uppercase text-xs font-[family-name:var(--font-mono)] text-[var(--status-error)] flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 stroke-[2.5]" />
                  <span>FORMAT GRAFIS DUA KOLOM</span>
                </span>
                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 border border-black font-bold">
                  EKSTRAKSI RUSAK
                </span>
              </div>

              <div className="space-y-3 text-xs font-[family-name:var(--font-body)]">
                <p className="text-neutral-700">
                  Desain template grafis dengan dua kolom, bar persentase skill (e.g. Photoshop 80%), dan text box floating.
                </p>

                {/* Simulated Raw Parser Scramble */}
                <div className="bg-red-50 border-2 border-black p-3.5 rounded-[2px] font-[family-name:var(--font-mono)] text-[11px] text-red-950 space-y-1">
                  <p className="font-bold uppercase text-[10px] text-red-700 pb-1 border-b border-red-200">
                    Hasil Ekstraksi Parser ATS (Zigzag):
                  </p>
                  <p className="leading-tight">
                    "Rizky Pratama Keahlian Universitas Indonesia 08129999 Magang S1 Ilmu Komputer Figma 85% Backend Engineer 2024..."
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black/20 mt-6 text-xs text-red-700 font-bold font-[family-name:var(--font-mono)]">
              ⚠️ Tanggal kerja bercampur dengan nama kampus, skill tidak terindeks.
            </div>
          </div>

          {/* Card 2: Format Harvard 1 Kolom (Ekstraksi Sempurna) */}
          <div className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000000] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <span className="font-extrabold uppercase text-xs font-[family-name:var(--font-mono)] text-[var(--status-success)] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  <span>FORMAT HARVARD 1 KOLOM LINIER</span>
                </span>
                <span className="text-[10px] bg-[var(--accent)] text-black px-2 py-0.5 border border-black font-bold">
                  100% TERBACA ATS
                </span>
              </div>

              <div className="space-y-3 text-xs font-[family-name:var(--font-body)]">
                <p className="text-neutral-700">
                  Format satu kolom dari atas ke bawah. Hirarki heading standar: Pendidikan, Pengalaman, dan Keterampilan.
                </p>

                {/* Simulated Clean Parser Parsing */}
                <div className="bg-emerald-50 border-2 border-black p-3.5 rounded-[2px] font-[family-name:var(--font-mono)] text-[11px] text-emerald-950 space-y-1.5">
                  <p className="font-bold uppercase text-[10px] text-emerald-800 pb-1 border-b border-emerald-200">
                    Hasil Ekstraksi Parser ATS (Terstruktur):
                  </p>
                  <p className="leading-tight">
                    <strong>Nama:</strong> Ahmad Fauzi<br />
                    <strong>Kampus:</strong> Institut Teknologi Bandung (S1 Informatika, IPK 3.82)<br />
                    <strong>Pengalaman:</strong> Backend Engineer Intern, PT Bank Mandiri<br />
                    <strong>Keahlian Terindeks:</strong> Go, PostgreSQL, Docker, REST API
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black/20 mt-6 text-xs text-emerald-800 font-bold font-[family-name:var(--font-mono)]">
              ✓ Setiap kolom database rekruter terisi akurat dalam 6 detik evaluasi.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
