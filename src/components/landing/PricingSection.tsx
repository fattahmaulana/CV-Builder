"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PricingSection() {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateY = (x / (rect.width / 2)) * 7;
    const rotateX = -(y / (rect.height / 2)) * 7;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      id="harga"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-[var(--bg)] border-b-[3px] border-black"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="accent" isSticker className="mb-3">
            HARGA TERJANGKAU &amp; TRANSPARAN
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-[family-name:var(--font-display)] tracking-tight text-black">
            Investasi Terjangkau untuk Masa Depan Karir Anda
          </h2>
          <p className="mt-4 text-base text-neutral-800 font-[family-name:var(--font-body)]">
            Tanpa biaya tersembunyi, tanpa langganan kartu kredit berulang. Sekali bayar, CV format Harvard langsung jadi.
          </p>
        </div>

        <div className="max-w-md mx-auto perspective-[1000px]">
          {/* Neobrutalist Pricing Card with 3D Tilt Effect */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[8px_8px_0_0_#000000] p-6 sm:p-8 transition-transform duration-100 ease-out transform-style-3d select-none"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
              <span className="font-extrabold uppercase text-xs font-[family-name:var(--font-mono)] bg-black text-white px-2.5 py-0.5">
                PAKET LENGKAP FRESH GRADUATE
              </span>
              <span className="sticker sticker-right bg-[var(--accent-2)] text-black px-2 py-0.5 text-[10px] font-bold border border-black">
                SEKALI BAYAR
              </span>
            </div>

            {/* Price Tag */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1.5 font-[family-name:var(--font-display)] font-extrabold text-black">
                <span className="text-2xl font-bold font-[family-name:var(--font-mono)]">Rp</span>
                <span className="text-6xl sm:text-7xl tracking-tighter leading-none">5.000</span>
                <span className="text-xs font-bold text-neutral-600 font-[family-name:var(--font-mono)]">/ dokumen</span>
              </div>
              <p className="text-xs text-neutral-600 font-[family-name:var(--font-mono)] mt-2 font-semibold">
                Setara dengan selembar fotokopi berkas fisik.
              </p>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-3 mb-8 border-t-2 border-black/20 pt-6 font-[family-name:var(--font-body)] text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-[2px] bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-black" />
                </div>
                <span className="font-bold text-black">
                  Ekspor PDF Format Harvard Asli (Teks 100% Dapat Dipilih)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-[2px] bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-black" />
                </div>
                <span className="font-bold text-black">
                  Ekspor Berkas Word (DOCX) yang Dapat Diedit
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-[2px] bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-black" />
                </div>
                <span className="font-bold text-black">
                  3x Revisi Optimasi AI Gratis dalam 7 Hari
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-[2px] bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-black" />
                </div>
                <span className="font-bold text-black">
                  Pelacak Lamaran Kerja &amp; Riwayat Lamaran Terintegrasi
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-[2px] bg-[var(--accent)] border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-black" />
                </div>
                <span className="font-bold text-black">
                  Pembayaran Instan via QRIS (Semua E-Wallet &amp; M-Banking)
                </span>
              </li>
            </ul>

            {/* CTA Button */}
            <Link href="/auth/login" className="block">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-base py-4 hard-drop flex items-center justify-center gap-2 group"
              >
                <span>Mulai Buat CV Sekarang</span>
                <ArrowRight className="h-5 w-5 stroke-[2.5] transition-transform duration-150 group-hover:translate-x-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
