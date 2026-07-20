import type { ReactNode } from "react";
import { FileSearch, Inbox, SearchX } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type EmptyIllustration = "no-results" | "empty" | "generic";

const ILLUSTRATIONS: Record<EmptyIllustration, ReactNode> = {
  "no-results": (
    <>
      <SearchX className="h-5 w-5" />
      <FileSearch className="-ml-1 h-3.5 w-3.5 opacity-70" />
    </>
  ),
  empty: <Inbox className="h-5 w-5" />,
  generic: <Inbox className="h-5 w-5" />,
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  illustration = "empty",
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  /** Composed mini-illustration shown when no custom `icon` is passed. */
  illustration?: EmptyIllustration;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/40 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-ink-500 shadow-sm ring-1 ring-slate-200">
        {icon ?? ILLUSTRATIONS[illustration]}
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
