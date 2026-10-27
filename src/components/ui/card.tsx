import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "accent" | "accent2" | "accent3" | "canvas";
  elevation?: "sm" | "md" | "lg" | "none";
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "surface",
      elevation = "md",
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      surface: "bg-[var(--surface)] text-[var(--text)]",
      accent: "bg-[var(--accent)] text-black",
      accent2: "bg-[var(--accent-2)] text-black",
      accent3: "bg-[var(--accent-3)] text-white",
      canvas: "bg-[var(--bg)] text-[var(--text)]",
    };

    const elevationStyles = {
      none: "shadow-none",
      sm: "shadow-[2px_2px_0_0_#000000]",
      md: "shadow-[4px_4px_0_0_#000000]",
      lg: "shadow-[6px_6px_0_0_#000000]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[3px] border-[3px] border-black p-6 transition-all",
          variantStyles[variant],
          elevationStyles[elevation],
          interactive && "hard-drop cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
