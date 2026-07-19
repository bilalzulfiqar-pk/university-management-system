import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  requestId,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  requestId?: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-danger-200 bg-danger-50/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-danger-500 shadow-sm ring-1 ring-danger-200">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      ) : null}
      {requestId ? (
        <p className="mt-4 font-mono text-[11px] text-slate-400">request: {requestId}</p>
      ) : null}
    </div>
  );
}
