"use client";

import * as React from "react";
import { shouldEnableRichAnimations } from "@/lib/animations/device";
import { Badge } from "@/components/ui/badge";

const STATEMENT_WORDS = [
  "CV",
  "YANG",
  "BAGUS",
  "BUKANLAH",
  "TENTANG",
  "DESAIN",
  "GRAFIS",
  "WARNA-WARNI,",
  "MELAINKAN",
  "KEJELASAN",
  "PENCAPAIAN,",
  "KATA",
  "KUNCI",
  "YANG",
  "TEPAT,",
  "DAN",
  "FORMAT",
  "YANG",
  "TERBACA",
  "SEMPURNA",
  "OLEH",
  "SISTEM",
  "ATS.",
];

export function TextFillScrollSection() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    if (!shouldEnableRichAnimations()) return;

    let ctx: gsap.Context | null = null;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          const words = textRef.current?.querySelectorAll(".fill-word");
          if (!words) return;

          gsap.fromTo(
            words,
            { color: "#D1D5DB", opacity: 0.3 },
            {
              color: "#000000",
              opacity: 1,
              stagger: 0.1,
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top 75%",
                end: "bottom 45%",
                scrub: 0.5,
              },
            }
          );
        }, containerRef);
      }
    );

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-20 sm:py-32 px-4 sm:px-6 bg-[var(--surface)] border-b-[3px] border-black select-none"
    >
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <Badge variant="accent" isSticker>
          PRINSIP REKRUTMEN MODERN
        </Badge>

        <h2
          ref={textRef}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-[family-name:var(--font-display)] tracking-tight leading-[1.2] text-left sm:text-center"
        >
          {STATEMENT_WORDS.map((word, idx) => (
            <span
              key={idx}
              className="fill-word inline-block mr-2.5 sm:mr-3.5 mb-2 transition-colors duration-100"
            >
              {word === "TERBACA" || word === "ATS." ? (
                <span className="bg-[var(--accent)] text-black px-2 border-2 border-black rounded-[2px] shadow-[2px_2px_0_0_#000000]">
                  {word}
                </span>
              ) : (
                word
              )}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
