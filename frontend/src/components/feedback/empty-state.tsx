import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="space-y-3 border-dashed bg-white/70 text-center">
      <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
      <p className="mx-auto max-w-lg text-sm text-slate-700">{description}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </Card>
  );
}
