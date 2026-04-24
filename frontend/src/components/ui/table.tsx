import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn("min-w-full text-left text-sm", className)}>{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-slate-200 bg-slate-100/80 text-xs uppercase tracking-[0.14em] text-slate-700">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200">{children}</tbody>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3.5 align-top text-ink-900", className)}>{children}</td>;
}
