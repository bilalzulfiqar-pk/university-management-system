import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Subtle interactive lift on hover. Use for clickable tiles / dashboard cards. */
  interactive?: boolean;
  /** Remove the default padding so the card holds its own layout. */
  flush?: boolean;
}

export function Card({ className, interactive, flush, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-slate-200/80 bg-white shadow-card min-w-0 max-w-full",
        flush ? "" : "p-4 sm:p-5 md:p-6",
        interactive &&
          "cursor-pointer transition-smooth hover:-translate-y-0.5 hover:shadow-card-hover hover:border-slate-300",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-lg font-semibold tracking-tight text-ink-900", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-5 flex items-center justify-end gap-3 border-t border-slate-200/80 pt-4", className)}
      {...props}
    />
  );
}
