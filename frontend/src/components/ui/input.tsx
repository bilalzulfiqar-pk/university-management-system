import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[14px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-950 outline-none transition placeholder:text-slate-500 focus:border-ink-700 focus:ring-2 focus:ring-ink-700/10",
        className,
      )}
      {...props}
    />
  );
}
