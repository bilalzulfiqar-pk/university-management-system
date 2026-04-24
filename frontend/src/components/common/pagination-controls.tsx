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

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
      <p>
        Showing <span className="font-semibold text-ink-950">{Math.min(offset + 1, total || 1)}</span>-
        <span className="font-semibold text-ink-950">{Math.min(offset + limit, total)}</span> of{" "}
        <span className="font-semibold text-ink-950">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={offset === 0} onClick={() => onPageChange(Math.max(0, offset - limit))}>
          Previous
        </Button>
        <span className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Page {currentPage} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={offset + limit >= total}
          onClick={() => onPageChange(offset + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
