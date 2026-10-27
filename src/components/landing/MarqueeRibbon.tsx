"use client";

import * as React from "react";
import { shouldEnableRichAnimations } from "@/lib/animations/device";

const MARQUEE_ITEMS = [
  "CV ATS",
  "FORMAT HARVARD",
  "KATA KUNCI COCOK",
  "RP5.000",
  "TERBACA SISTEM",
  "PDF ASLI & DOCX",
  "UU PDP COMPLIANT",
  "KHUSUS FRESH GRADUATE",
];

export function MarqueeRibbon() {
  const ribbonRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!shouldEnableRichAnimations()) return;

    let ctx: gsap.Context | null = null;

    // Dynamically import GSAP and ScrollTrigger only on landing page
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          // ScrollTrigger integration for marquee visibility and smooth interaction
          ScrollTrigger.create({
            trigger: ribbonRef.current,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              if (trackRef.current) {
                const isScrollingFast = Math.abs(self.getVelocity()) > 800;
                trackRef.current.style.opacity = isScrollingFast ? "0.9" : "1";
              }
            },
          });
        }, ribbonRef);
      }
    );

    return () => {
      ctx?.revert();
    };
  }, []);

  // Concatenate multiple times for seamless infinite loop
  const repeatedText = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div
      ref={ribbonRef}
      className="relative w-full bg-[var(--accent)] border-y-[3px] border-black py-3.5 overflow-hidden select-none z-10 shadow-[0_4px_0_0_#000000]"
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap gap-8 animate-[marquee_28s_linear_infinite]"
        style={{ width: "max-content" }}
      >
        {repeatedText.map((text, idx) => (
          <div key={idx} className="flex items-center gap-6">
            <span className="text-sm sm:text-base font-extrabold uppercase font-[family-name:var(--font-mono)] tracking-wider text-black">
              {text}
            </span>
            <span className="text-black font-extrabold text-xs">★</span>
          </div>
        ))}
      </div>
    </div>
  );
}
