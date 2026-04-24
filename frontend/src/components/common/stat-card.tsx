import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon,
  helper,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  helper?: string;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {icon ? <div className="rounded-full bg-blue-50 p-2 text-ink-800">{icon}</div> : null}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-semibold tracking-tight text-ink-950">{value}</p>
        {helper ? <p className="text-sm text-slate-600">{helper}</p> : null}
      </div>
    </Card>
  );
}
