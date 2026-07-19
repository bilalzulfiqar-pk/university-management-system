import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  icon,
  helper,
  accent = "ink",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  helper?: string;
  accent?: "ink" | "success" | "warning" | "info" | "danger" | "accent";
}) {
  const accentClasses: Record<string, string> = {
    ink: "bg-ink-50 text-ink-600 ring-ink-100",
    success: "bg-success-50 text-success-600 ring-success-100",
    warning: "bg-warning-50 text-warning-600 ring-warning-100",
    info: "bg-info-50 text-info-600 ring-info-100",
    danger: "bg-danger-50 text-danger-600 ring-danger-100",
    accent: "bg-accent-50 text-accent-600 ring-accent-100",
  };

  return (
    <Card interactive className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon ? (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset [&_svg]:h-4 [&_svg]:w-4",
              accentClasses[accent],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="tabular font-display text-3xl font-semibold tracking-tight text-ink-900">{value}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
    </Card>
  );
}
