"use client";

import * as React from "react";
import { shouldEnableRichAnimations } from "@/lib/animations/device";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2 } from "lucide-react";

interface KeywordItem {
  name: string;
  category: string;
}

const TARGET_KEYWORDS: KeywordItem[] = [
  { name: "PostgreSQL Database", category: "Technical Skill" },
  { name: "RESTful API Development", category: "Technical Skill" },
  { name: "Golang / Microservices", category: "Technical Skill" },
  { name: "Docker Containerization", category: "Tools" },
  { name: "Git Version Control", category: "Tools" },
];

export function MatchScoreSection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const [score, setScore] = React.useState(0);
  const [revealedKeywords, setRevealedKeywords] = React.useState<number>(0);
  const [hasTriggered, setHasTriggered] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered) {
          setHasTriggered(true);

          // Animate score from 0 to 82
          let currentScore = 0;
          const scoreInterval = setInterval(() => {
            currentScore += 2;
            if (currentScore >= 82) {
              setScore(82);
              clearInterval(scoreInterval);
            } else {
              setScore(currentScore);
            }
          }, 25);

          // Reveal keywords one by one into yellow accent
          TARGET_KEYWORDS.forEach((_, idx) => {
            setTimeout(() => {
              setRevealedKeywords((prev) => Math.max(prev, idx + 1));
            }, 300 + idx * 250);
          });
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasTriggered]);

  return (
    <section
      id="skor-kecocokan"
      ref={sectionRef}
      className="py-16 sm:py-24 px-4 sm:px-6 bg-[var(--surface)] border-b-[3px] border-black"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="accent2" isSticker className="mb-3">
            LIVE MATCHING ENGINE
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-[family-name:var(--font-display)] tracking-tight text-black">
            Penyelarasan Kata Kunci Sesuai Deskripsi Lowongan
          </h2>
          <p className="mt-4 text-base text-neutral-800 font-[family-name:var(--font-body)]">
            Algoritma CVBuilder membandingkan keterampilan di CV Anda dengan kualifikasi lowongan target secara transparan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left: Giant Match Score Metric Card (5 cols) */}
          <div className="lg:col-span-5 bg-[var(--accent)] border-[3px] border-black rounded-[3px] shadow-[8px_8px_0_0_#000000] p-8 text-center space-y-4">
            <span className="font-[family-name:var(--font-mono)] font-extrabold text-xs uppercase bg-black text-white px-3 py-1 border border-black inline-block">
              SKOR KECOCOKAN KATA KUNCI
            </span>

            {/* Counter 0 -> 82 */}
            <div className="flex items-baseline justify-center gap-1 font-[family-name:var(--font-display)] font-extrabold text-black">
              <span className="text-7xl sm:text-8xl tracking-tighter leading-none">{score}</span>
              <span className="text-3xl font-bold font-[family-name:var(--font-mono)]">/100</span>
            </div>

            <p className="text-xs sm:text-sm font-bold font-[family-name:var(--font-body)] text-black">
              Tingkat kecocokan tinggi dengan lowongan Junior Backend Engineer.
            </p>

            <div className="pt-3 border-t-2 border-black text-[11px] font-[family-name:var(--font-mono)] font-semibold text-neutral-900">
              *Bukan jaminan lolos, melainkan indikator kelengkapan kata kunci yang dicari rekruter.
            </div>
          </div>

          {/* Right: Matched Keywords List with Sequential Yellow Turns (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
              <span className="font-extrabold uppercase text-xs font-[family-name:var(--font-mono)]">
                KATA KUNCI KRUSIAL LOWONGAN
              </span>
              <span className="text-xs font-bold font-[family-name:var(--font-mono)]">
                {revealedKeywords} DARI {TARGET_KEYWORDS.length} TERPENUHI
              </span>
            </div>

            {TARGET_KEYWORDS.map((item, idx) => {
              const isMatched = idx < revealedKeywords;

              return (
                <div
                  key={item.name}
                  className={`p-3.5 rounded-[3px] border-[2.5px] border-black flex items-center justify-between transition-all duration-300 ${
                    isMatched
                      ? "bg-[var(--accent)] text-black shadow-[3px_3px_0_0_#000000] translate-x-1"
                      : "bg-[var(--bg)] text-neutral-500 shadow-[1px_1px_0_0_#000000] opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-[2px] border-2 border-black flex items-center justify-center font-bold text-xs ${
                        isMatched ? "bg-black text-white" : "bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                    <span className="font-bold text-sm font-[family-name:var(--font-body)] text-black">
                      {item.name}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold font-[family-name:var(--font-mono)] uppercase bg-white text-black px-2 py-0.5 border border-black">
                    {item.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
