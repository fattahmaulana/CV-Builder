import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full min-h-[90px] p-3.5 bg-[var(--surface)] text-[var(--text)] font-[family-name:var(--font-body)] text-sm rounded-[3px] border-[3px] border-black transition-all resize-y",
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

Textarea.displayName = "Textarea";
