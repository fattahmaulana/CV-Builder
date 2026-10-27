"use client";

import * as React from "react";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Hero3DCardStack() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = React.useState({ x: 6, y: -8 });

  // Mouse move handler for desktop cursor tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Map to subtle tilt (-12deg to +12deg)
    const rotateY = (mouseX / (rect.width / 2)) * 12;
    const rotateX = -(mouseY / (rect.height / 2)) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    // Reset to pleasant resting isometric angle
    setRotation({ x: 6, y: -8 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-lg mx-auto h-[480px] sm:h-[510px] flex items-center justify-center perspective-[1200px] select-none py-4 sm:py-6"
      style={{ perspective: "1200px" }}
    >
      {/* 3D Transform Anchor Container */}
      <div
        className="relative w-full h-full transition-transform duration-150 ease-out transform-style-3d flex items-center justify-center"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Layer 3: Back Card (Blue Accent & Guidelines) */}
        <div
          className="absolute w-[88%] sm:w-[90%] h-[400px] sm:h-[420px] bg-[var(--accent-3)] text-white border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000000] p-4 sm:p-6 transition-all"
          style={{
            transform: "translateZ(-50px) rotate(4deg) translateX(18px)",
          }}
        >
          <div className="flex justify-between items-center border-b-2 border-white/40 pb-2 sm:pb-3">
            <span className="font-extrabold uppercase text-[11px] sm:text-xs font-[family-name:var(--font-mono)]">
              STANDAR RESMI HARVARD
            </span>
            <span className="text-[9.5px] sm:text-[10px] bg-black text-white px-2 py-0.5 border border-white font-bold">
              1 KOLOM LINIER
            </span>
          </div>
          <div className="mt-6 sm:mt-8 space-y-1.5 sm:space-y-2 opacity-80 text-[11px] sm:text-xs font-[family-name:var(--font-body)]">
            <p>✓ Margin seimbang 0.75 inchi</p>
            <p>✓ Tidak ada tabel atau text box bersarang</p>
            <p>✓ 100% teks dapat di-parse mesin ATS</p>
          </div>
        </div>

        {/* Layer 2: Middle Card (Pink Accent & Verification) */}
        <div
          className="absolute w-[90%] sm:w-[92%] h-[420px] sm:h-[440px] bg-[var(--accent-2)] text-black border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000000] p-4 sm:p-6 transition-all"
          style={{
            transform: "translateZ(-25px) rotate(-3deg) translateX(-14px)",
          }}
        >
          <div className="flex justify-between items-center border-b-2 border-black pb-2 sm:pb-3">
            <Badge variant="black" isSticker>
              TERVERIFIKASI ATS
            </Badge>
            <span className="font-[family-name:var(--font-mono)] text-[11px] sm:text-xs font-bold bg-white px-2 py-0.5 border-2 border-black">
              SKOR 85/100
            </span>
          </div>
          <div className="mt-4 sm:mt-6 space-y-2 text-[10px] sm:text-xs font-bold font-[family-name:var(--font-mono)]">
            <p className="bg-white/80 p-1.5 border border-black rounded-[2px]">
              KATA KUNCI: GO • POSTGRESQL • DOCKER
            </p>
            <p className="bg-white/80 p-1.5 border border-black rounded-[2px]">
              TINDAKAN AKTIF: MERANCANG • MENGEMBANGKAN
            </p>
          </div>
        </div>

        {/* Layer 1: Front Primary Card (Clean Harvard ATS CV Mockup) */}
        <div
          className="absolute w-[94%] sm:w-[96%] h-[440px] sm:h-[460px] bg-[var(--surface)] text-[var(--text)] border-[3px] border-black rounded-[3px] shadow-[6px_6px_0_0_#000000] sm:shadow-[8px_8px_0_0_#000000] p-3.5 sm:p-6 transition-all flex flex-col justify-between overflow-hidden"
          style={{
            transform: "translateZ(0px)",
          }}
        >
          <div className="space-y-2 sm:space-y-2.5">
            {/* Header / Identity */}
            <div className="text-center border-b border-black sm:border-b-2 pb-2 mb-2 sm:pb-3 sm:mb-2.5">
              <h3 className="text-lg sm:text-2xl font-extrabold font-[family-name:var(--font-display)] tracking-tight">
                AHMAD FAUZI
              </h3>
              <p className="text-[10px] sm:text-[11px] font-[family-name:var(--font-mono)] text-neutral-800 font-semibold mt-0.5 leading-snug">
                Bandung, ID • ahmad.fauzi@alumni.itb.ac.id • 0812-9876-5432
              </p>
            </div>

            {/* Section: Education */}
            <div>
              <div className="flex justify-between items-center border-b border-black pb-0.5 mb-1">
                <span className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider font-[family-name:var(--font-mono)]">
                  PENDIDIKAN
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold font-[family-name:var(--font-mono)]">2020 – 2024</span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold leading-tight">ITB — S1 Teknik Informatika</p>
              <p className="text-[10px] sm:text-[11px] text-neutral-700 leading-tight">IPK: 3.82 / 4.00 • Tugas Akhir: Optimalisasi Query PostgreSQL</p>
            </div>

            {/* Section: Experience */}
            <div>
              <div className="flex justify-between items-center border-b border-black pb-0.5 mb-1">
                <span className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider font-[family-name:var(--font-mono)]">
                  PENGALAMAN KERJA / MAGANG
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold font-[family-name:var(--font-mono)]">Jan – Jul 2024</span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold leading-tight">PT Bank Mandiri (Persero) Tbk — Backend Intern</p>
              <ul className="text-[10px] sm:text-[11px] text-neutral-800 list-disc pl-3.5 space-y-0.5 mt-0.5 leading-snug">
                <li>Mengembangkan microservices REST API menggunakan Go &amp; PostgreSQL.</li>
                <li>Memangkas latensi query sebesar 28% melalui indexing terstruktur.</li>
              </ul>
            </div>

            {/* Section: Skills */}
            <div>
              <div className="border-b border-black pb-0.5 mb-1">
                <span className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider font-[family-name:var(--font-mono)]">
                  KEAHLIAN &amp; BAHASA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-900 leading-tight">
                <strong className="font-bold">Teknis:</strong> Go, Node.js, PostgreSQL, Docker, Git, RESTful API
              </p>
            </div>
          </div>

          {/* Floating Live Badge Stamp */}
          <div className="flex items-center justify-between pt-2 border-t-2 border-black/20 mt-auto shrink-0 gap-1.5">
            <div className="flex items-center gap-1.5 text-[9.5px] sm:text-xs font-bold font-[family-name:var(--font-mono)] text-black">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[var(--status-success)] border border-black inline-block animate-ping shrink-0" />
              <span className="truncate">FORMAT ATS HARVARD ASLI</span>
            </div>
            <span className="text-[9px] sm:text-[11px] font-bold bg-[var(--accent)] text-black px-1.5 sm:px-2 py-0.5 border border-black whitespace-nowrap shrink-0">
              Siap Kirim (PDF &amp; DOCX)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
