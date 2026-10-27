"use client";

import * as React from "react";
import Lenis from "lenis";
import { shouldEnableRichAnimations } from "@/lib/animations/device";

interface LenisProviderProps {
  children: React.ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  React.useEffect(() => {
    // Only initialize smooth scroll if device is capable and motion is not reduced
    if (!shouldEnableRichAnimations()) {
      return;
    }

    let lenis: Lenis | null = null;
    let tickerCallback: ((time: number) => void) | null = null;
    let fallbackRafId: number | null = null;

    try {
      lenis = new Lenis({
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1.0,
      });

      // Synchronize Lenis with GSAP ScrollTrigger
      Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([{ gsap }, { ScrollTrigger }]) => {
          if (!lenis) return;
          gsap.registerPlugin(ScrollTrigger);

          lenis.on("scroll", ScrollTrigger.update);

          tickerCallback = (time: number) => {
            lenis?.raf(time * 1000);
          };

          gsap.ticker.add(tickerCallback);
          gsap.ticker.lagSmoothing(0);
        })
        .catch(() => {
          // Fallback to native requestAnimationFrame loop if GSAP fails to load
          function raf(time: number) {
            lenis?.raf(time);
            fallbackRafId = requestAnimationFrame(raf);
          }
          fallbackRafId = requestAnimationFrame(raf);
        });
    } catch (e) {
      console.warn("Lenis initialization skipped:", e);
    }

    return () => {
      if (fallbackRafId) cancelAnimationFrame(fallbackRafId);
      if (tickerCallback) {
        import("gsap").then(({ gsap }) => {
          if (tickerCallback) gsap.ticker.remove(tickerCallback);
        }).catch(() => {});
      }
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
