import type { ReactNode } from "react";

import { Crest } from "@/components/common/brand-mark";
import { cn } from "@/lib/utils/cn";

interface DashboardHeroProps {
  /** Greeting line, e.g. "Welcome, Ayesha". */
  title: ReactNode;
  description?: ReactNode;
  /** Role / context pill shown in the header. */
  eyebrow: string;
  /** Right-aligned actions (buttons). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Branded hero band used at the top of each role dashboard. A subtle navy
 * gradient + faint crest motif gives the dashboards a distinctive, premium
 * first impression without being flashy. Respects reduced motion (no motion
 * by default).
 */
export function DashboardHero({ title, description, eyebrow, actions, className }: DashboardHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-ink-800/40 bg-ink-950 p-5 text-white shadow-md sm:p-7 md:p-8 min-w-0 max-w-full",
        className,
      )}
    >
      {/* Layered navy gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 600px 320px at 85% -20%, rgba(212, 163, 44, 0.14), transparent 60%), radial-gradient(ellipse 500px 280px at 10% 120%, rgba(51, 93, 125, 0.40), transparent 60%)",
        }}
      />
      {/* Faint crest motif in the corner */}
      <div className="pointer-events-none absolute -right-8 -top-8 overflow-hidden opacity-[0.06]" aria-hidden>
        <Crest size={180} />
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400 ring-1 ring-inset ring-white/10">
            {eyebrow}
          </span>
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-ink-300">{description}</p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </section>
  );
}
