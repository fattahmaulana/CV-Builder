import * as React from "react";
import { cn } from "@/lib/utils";
import { getAccentTextColor } from "@/lib/theme/yiq";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "accent" | "accent2" | "accent3" | "surface" | "black" | "success" | "warning" | "error";
  tilt?: "none" | "left" | "right" | "subtle-left" | "subtle-right";
  isSticker?: boolean;
}

export const Badge = ({
  className,
  variant = "accent",
  tilt = "none",
  isSticker = false,
  children,
  ...props
}: BadgeProps) => {
  const variantStyles = {
    accent: "bg-[var(--accent)] text-black",
    accent2: "bg-[var(--accent-2)] text-black",
    accent3: "bg-[var(--accent-3)] text-white",
    surface: "bg-[var(--surface)] text-black",
    black: "bg-black text-white",
    success: "bg-[var(--status-success)] text-white",
    warning: "bg-[var(--status-warning)] text-black",
    error: "bg-[var(--status-error)] text-white",
  };

  const tiltStyles = {
    none: "",
    left: "-rotate-3",
    right: "rotate-3",
    "subtle-left": "-rotate-1.5",
    "subtle-right": "rotate-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold font-[family-name:var(--font-mono)] uppercase tracking-wider rounded-[3px] border-2 border-black transition-transform",
        isSticker && "shadow-[2px_2px_0_0_#000000] select-none",
        variantStyles[variant],
        tiltStyles[tilt],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
