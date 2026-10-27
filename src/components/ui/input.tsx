import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full h-11 px-3.5 bg-[var(--surface)] text-[var(--text)] font-[family-name:var(--font-body)] text-sm rounded-[3px] border-[3px] border-black transition-all",
          "placeholder:text-neutral-500",
          "focus:outline-none focus:ring-0 focus:border-black focus:shadow-[3px_3px_0_0_#FFE500]",
          "disabled:opacity-50 disabled:bg-neutral-100 disabled:cursor-not-allowed",
          error && "border-[var(--status-error)] focus:shadow-[3px_3px_0_0_var(--status-error)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
