import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "accent2" | "accent3" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const baseStyles =
      "inline-flex items-center justify-center font-bold font-[family-name:var(--font-body)] uppercase tracking-wide select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-0 rounded-[3px]";

    const variantStyles = {
      primary:
        "bg-[var(--accent)] text-black border-[3px] border-black hard-drop",
      secondary:
        "bg-[var(--surface)] text-black border-[3px] border-black hard-drop",
      accent2:
        "bg-[var(--accent-2)] text-black border-[3px] border-black hard-drop",
      accent3:
        "bg-[var(--accent-3)] text-white border-[3px] border-black hard-drop",
      outline:
        "bg-[var(--surface)] text-black border-[3px] border-black hard-drop",
      ghost:
        "text-black hover:bg-[var(--accent)] hover:border-2 hover:border-black border-2 border-transparent transition-colors",
      dark:
        "bg-black text-white border-[3px] border-black hard-drop",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs border-[2px] gap-1.5",
      md: "h-11 px-5 text-sm border-[3px] gap-2",
      lg: "h-13 px-7 text-base border-[3px] gap-2.5",
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";
