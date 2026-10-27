"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hero3DCardStack } from "./Hero3DCardStack";

const HEADLINE_WORDS_LINE_1 = ["Tulis", "Pengalaman", "Apa", "Adanya,"];
const HEADLINE_WORDS_LINE_2 = ["Format", "Terbaca", "ATS."];

export function HeroSection() {
  return (
    <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 overflow-hidden bg-[var(--bg)] border-b-[3px] border-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typography, Badges & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Stiker Berputar Masuk dengan Bounce Keras */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <span className="sticker sticker-left bg-[var(--accent)] text-black px-3 py-1 text-xs font-[family-name:var(--font-mono)] border-2 border-black">
                KHUSUS FRESH GRADUATE
              </span>
              <span className="sticker sticker-right bg-[var(--accent-2)] text-black px-3 py-1 text-xs font-[family-name:var(--font-mono)] border-2 border-black">
                STANDAR HARVARD 1 KOLOM
              </span>
            </div>

            {/* Giant Title: Mask-Reveal Effect per Word with 50ms Stagger */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-[family-name:var(--font-display)] tracking-tight text-black leading-[1.04]">
              {/* Line 1 */}
              <span className="block overflow-hidden py-1">
                {HEADLINE_WORDS_LINE_1.map((word, idx) => (
                  <span
                    key={word}
                    className="inline-block mr-2.5 sm:mr-3.5 transform transition-transform duration-500 ease-out will-change-transform animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {word}
                  </span>
                ))}
              </span>

              {/* Line 2 with Accent Highlight */}
              <span className="block overflow-hidden py-1">
                {HEADLINE_WORDS_LINE_2.map((word, idx) => (
                  <span
                    key={word}
                    className="inline-block mr-2.5 sm:mr-3.5 bg-[var(--accent)] text-black px-2 border-2 border-black shadow-[3px_3px_0_0_#000000] sticker-subtle-left transform transition-transform duration-500 ease-out will-change-transform animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{ animationDelay: `${(HEADLINE_WORDS_LINE_1.length + idx) * 50}ms` }}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-neutral-800 font-[family-name:var(--font-body)] leading-relaxed">
              Fresh graduate tidak perlu pusing menyusun bahasa formal. AI merapikan tulisan dan menghasilkan format terbaca ATS dengan kata kunci disesuaikan dengan lowongan tanpa mengarang data palsu. Unduh berkas format ATS gaya Harvard dalam PDF dan DOCX.
            </p>

            {/* CTA Buttons with Hard-Drop and Shifting Icon */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 py-4 hard-drop flex items-center justify-center gap-3 group"
                >
                  <span>Mulai Buat CV — Rp5.000</span>
                  <ArrowRight className="h-5 w-5 stroke-[2.5] transition-transform duration-150 group-hover:translate-x-1.5" />
                </Button>
              </Link>

              <a
                href="#cara-kerja"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.querySelector("#cara-kerja");
                  if (target) {
                    const top = target.getBoundingClientRect().top + window.scrollY - 75;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base px-6 py-4 hard-drop"
                >
                  Lihat Cara Kerja
                </Button>
              </a>
            </div>

            {/* Value Guarantees (Flat Neobrutalist Badges) */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold font-[family-name:var(--font-mono)] text-black">
              <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 border-2 border-black rounded-[2px] shadow-[2px_2px_0_0_#000000]">
                <Check className="h-4 w-4 stroke-[2.5] text-black" />
                <span>Tanpa Langganan Bulanan</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 border-2 border-black rounded-[2px] shadow-[2px_2px_0_0_#000000]">
                <Check className="h-4 w-4 stroke-[2.5] text-black" />
                <span>PDF Asli Dapat Dicari &amp; DOCX</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 border-2 border-black rounded-[2px] shadow-[2px_2px_0_0_#000000]">
                <Check className="h-4 w-4 stroke-[2.5] text-black" />
                <span>UU PDP: Sensor PII Otomatis</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Stack of Floating CV Cards (5 cols) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            <Hero3DCardStack />
          </div>
        </div>
      </div>
    </section>
  );
}
