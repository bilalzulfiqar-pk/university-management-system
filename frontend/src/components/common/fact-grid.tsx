import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface Fact {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

/** Grid of labelled fact tiles used on detail pages. */
export function FactGrid({ facts, className }: { facts: Fact[]; className?: string }) {
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{fact.label}</dt>
          <dd
            className={cn(
              "mt-1 text-sm font-semibold text-ink-900",
              fact.mono && "tabular font-mono",
            )}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
