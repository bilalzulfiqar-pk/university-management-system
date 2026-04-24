import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ErrorState({
  title = "Something went wrong",
  description = "The page could not be loaded right now.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="space-y-3 border-rose-100 bg-rose-50/70">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white p-2 text-danger-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
          <p className="text-sm text-slate-700">{description}</p>
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
