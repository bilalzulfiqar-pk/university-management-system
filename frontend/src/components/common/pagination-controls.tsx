import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  total,
  limit,
  offset,
  onPageChange,
}: {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (nextOffset: number) => void;
}) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p className="tabular text-xs sm:text-sm">
        Showing <span className="font-semibold text-ink-900">{from}</span>–
        <span className="font-semibold text-ink-900">{to}</span> of{" "}
        <span className="font-semibold text-ink-900">{total}</span>
      </p>
      <div className="flex items-center justify-between gap-1.5 sm:justify-end sm:w-auto">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="First page"
          disabled={offset === 0}
          onClick={() => onPageChange(0)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={offset === 0}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="tabular px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Page {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={offset + limit >= total}
          onClick={() => onPageChange(offset + limit)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Last page"
          disabled={offset + limit >= total}
          onClick={() => onPageChange((totalPages - 1) * limit)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
