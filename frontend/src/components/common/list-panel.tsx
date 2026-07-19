import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/**
 * Standard list page surface: a sticky-ish card holding the filter bar and
 * the records table. Keeps every list page visually consistent.
 */
export function ListPanel({
  filters,
  toolbar,
  children,
  className,
}: {
  filters: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("space-y-4", className)}>
      <div className="space-y-4 border-b border-slate-200/80 pb-4">
        {filters}
        {toolbar}
      </div>
      {children}
    </Card>
  );
}
