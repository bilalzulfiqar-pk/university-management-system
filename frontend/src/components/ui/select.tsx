import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[14px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 outline-none transition focus:border-ink-700 focus:ring-2 focus:ring-ink-700/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
