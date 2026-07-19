import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface FormCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional back link target shown in the header. */
  backTo?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Standard form surface: a header (title + description) inside a card, with
 * the form fields and a sticky-ish action row below.
 */
export function FormCard({ title, description, children, backTo, backLabel = "Back", className }: FormCardProps) {
  return (
    <Card className={cn("max-w-4xl", className)}>
      <div className="mb-6 border-b border-slate-200/80 pb-5">
        {backTo ? (
          <Link
            to={backTo}
            className="mb-2 inline-block text-xs font-medium text-ink-600 transition-smooth hover:text-ink-900"
          >
            ← {backLabel}
          </Link>
        ) : null}
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}

interface FormActionsProps {
  submitLabel: string;
  pending?: boolean;
  cancelTo: string;
  cancelLabel?: string;
}

export function FormActions({ submitLabel, pending, cancelTo, cancelLabel = "Cancel" }: FormActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-5">
      <Button type="submit" loading={pending}>
        {submitLabel}
      </Button>
      <Button variant="secondary" asChild>
        <Link to={cancelTo}>{cancelLabel}</Link>
      </Button>
    </div>
  );
}

interface FormErrorBannerProps {
  message?: string;
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
      {message}
    </div>
  );
}

/** Labelled toggle/checkbox used inside forms. */
export function FormToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 transition-smooth hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ink-700 focus:ring-ink-600/30"
      />
      <span>
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}
