import { Fragment } from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index === 0 && item.to ? (
                <li className="flex items-center">
                  <Link
                    to={item.to}
                    className="inline-flex items-center rounded text-slate-400 transition-smooth hover:text-ink-700"
                  >
                    <Home className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ) : null}

              <li aria-current={isLast ? "page" : undefined}>
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="rounded px-1.5 py-0.5 text-slate-500 transition-smooth hover:bg-slate-100 hover:text-ink-800"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn("px-1.5 py-0.5", isLast ? "font-medium text-ink-900" : "text-slate-500")}>
                    {item.label}
                  </span>
                )}
              </li>

              {!isLast ? (
                <li className="flex items-center text-slate-300" aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
