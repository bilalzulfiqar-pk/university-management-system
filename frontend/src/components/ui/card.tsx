import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[18px] border border-white/70 bg-white/85 p-5 shadow-[0_10px_30px_rgba(20,46,80,0.06)] backdrop-blur", className)}
      {...props}
    />
  );
}
