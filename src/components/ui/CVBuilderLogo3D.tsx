"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CVBuilderLogo3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "dark" | "light";
}

export function CVBuilderLogo3D({
  className,
  size = "md",
  tone = "dark",
}: CVBuilderLogo3DProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const dimension =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";

  return (
    <div
      className={cn("flex items-center gap-2.5 group cursor-pointer select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Animated Isometric Cube / Document Icon */}
      <div
        className={cn("relative shrink-0 perspective-[600px]", dimension)}
        style={{ perspective: "600px" }}
      >
        <div
          className="w-full h-full relative transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isHovered
              ? "rotateX(18deg) rotateY(-22deg) scale(1.08)"
              : "rotateX(10deg) rotateY(-12deg)",
          }}
        >
          {/* Base Shadow Layer (Deepest Z) */}
          <div
            className="absolute inset-0 bg-black rounded-[3px] transition-transform duration-300"
            style={{
              transform: "translateZ(-8px) translate(4px, 4px)",
            }}
          />

          {/* Bottom Accent Plane (Pink Layer) */}
          <div
            className="absolute inset-0 bg-[#FF6B9D] border-2 border-black rounded-[3px] transition-transform duration-300"
            style={{
              transform: isHovered
                ? "translateZ(0px) translate(2px, 2px)"
                : "translateZ(-2px) translate(1px, 1px)",
            }}
          />

          {/* Main Top Document Plane (Vibrant Yellow) */}
          <div
            className="absolute inset-0 bg-[#FFE500] border-2 border-black rounded-[3px] flex flex-col justify-between p-1.5 transition-transform duration-300 shadow-sm"
            style={{
              transform: isHovered ? "translateZ(14px)" : "translateZ(8px)",
            }}
          >
            {/* Top decorative lines representing a clean ATS CV */}
            <div className="flex items-center justify-between">
              <div className="w-2.5 h-1 bg-black rounded-[1px]" />
              <div className="w-1.5 h-1.5 bg-[#4D7CFF] border border-black rounded-full" />
            </div>

            <div className="space-y-0.5">
              <div className="w-full h-0.5 bg-black/80 rounded-[0.5px]" />
              <div className="w-3/4 h-0.5 bg-black/80 rounded-[0.5px]" />
              <div className="w-1/2 h-0.5 bg-black/80 rounded-[0.5px]" />
            </div>
          </div>

          {/* Floating 3D Sparkle / Pen Accent */}
          <div
            className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-white border border-black rounded-[2px] shadow-[1px_1px_0_0_#000] flex items-center justify-center transition-transform duration-300"
            style={{
              transform: isHovered
                ? "translateZ(24px) scale(1.15)"
                : "translateZ(14px) scale(1)",
            }}
          >
            <span className="text-[8px] font-black leading-none text-black">✦</span>
          </div>
        </div>
      </div>

      {/* Brand Text: CVBuilder */}
      <span
        className={cn(
          "text-xl sm:text-2xl font-black font-[family-name:var(--font-display)] tracking-tight leading-none flex items-center",
          tone === "light" ? "text-white" : "text-black"
        )}
      >
        <span>CV</span>
        <span className="relative">
          Builder
          <span className="absolute -bottom-0.5 left-0 right-0 h-[3px] bg-[#FFE500] -z-10 group-hover:h-2 transition-all duration-150" />
        </span>
      </span>
    </div>
  );
}
