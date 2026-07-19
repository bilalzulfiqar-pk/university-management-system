import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface TableProps {
  children: ReactNode;
  className?: string;
  /** Enable zebra striping on body rows. */
  zebra?: boolean;
}

export function Table({ children, className, zebra }: TableProps) {
  return (
    <table
      className={cn(
        "min-w-full border-collapse text-left text-sm",
        zebra && "[&_tbody_tr:nth-child(odd)]:bg-slate-50/50",
        className,
      )}
    >
      {children}
    </table>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead
      className={cn(
        "border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500",
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Th({
  children,
  className,
  align,
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function SortableTh({
  children,
  direction,
  active,
  onToggle,
  align,
  className,
}: {
  children: ReactNode;
  direction: "asc" | "desc" | null;
  active: boolean;
  onToggle: () => void;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex items-center gap-1.5 transition-smooth",
          align === "right" && "flex-row-reverse",
          active ? "text-ink-700" : "text-slate-500 hover:text-slate-700",
        )}
      >
        <span>{children}</span>
        {direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : direction === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </th>
  );
}

export function Td({
  children,
  className,
  align,
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-ink-800",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn("transition-colors hover:bg-ink-50/60", className)}>{children}</tr>
  );
}
