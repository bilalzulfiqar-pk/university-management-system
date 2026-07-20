import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface MobileRecordField {
  label: string;
  value: ReactNode;
}

/**
 * Compact stacked card used to render list rows on mobile (below `md`).
 * Paired with the desktop `<Table>` — both consume the same row data and the
 * same `RowActions` kebab so behavior stays consistent across breakpoints.
 */
export function MobileRecordCard({
  title,
  avatar,
  subtitle,
  badges,
  fields,
  actions,
}: {
  title: ReactNode;
  avatar?: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  fields: MobileRecordField[];
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink-900">{title}</div>
            {subtitle ? <div className="truncate text-xs text-slate-500">{subtitle}</div> : null}
          </div>
        </div>
        {actions}
      </div>

      {badges ? <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div> : null}

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{field.label}</dt>
            <dd className={cn("mt-0.5 truncate text-sm text-ink-800")}>{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
