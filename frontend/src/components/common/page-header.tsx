import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <div className="flex items-center gap-2.5">
            <span className="h-1 w-6 rounded-full bg-ink-600" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600">{eyebrow}</p>
          </div>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 md:text-[28px]">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
