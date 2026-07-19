import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  ink: "bg-ink-50 text-ink-700 ring-ink-200",
  success: "bg-success-50 text-success-700 ring-success-200",
  warning: "bg-warning-50 text-warning-700 ring-warning-200",
  danger: "bg-danger-50 text-danger-700 ring-danger-200",
  info: "bg-info-50 text-info-700 ring-info-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-200",
} as const;

const dotColors = {
  neutral: "bg-slate-400",
  ink: "bg-ink-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
  accent: "bg-accent-500",
} as const;

type Variant = keyof typeof variants;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  /** Leading status dot. */
  dot?: boolean;
}

export function Badge({ className, variant = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}
