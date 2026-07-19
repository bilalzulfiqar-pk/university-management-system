import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, disabled, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      className={cn(
        "min-h-28 w-full rounded-input border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-900",
        "outline-none transition-smooth placeholder:text-slate-400",
        "hover:border-slate-400",
        "focus:border-ink-600 focus:ring-2 focus:ring-ink-600/15",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        "aria-[invalid=true]:border-danger-400 aria-[invalid=true]:focus:border-danger-500 aria-[invalid=true]:focus:ring-danger-500/15",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});
