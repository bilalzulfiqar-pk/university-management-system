import type { AcademicTerm } from "@/lib/api/types";

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PK", {
    dateStyle: "medium",
  });
}

export function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || "—";
}

export function formatTerm(term: AcademicTerm) {
  return term.charAt(0) + term.slice(1).toLowerCase();
}

const UNITS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.34524, "week"],
  [12, "month"],
  [Number.POSITIVE_INFINITY, "year"],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Human-friendly relative time, e.g. "3 hours ago" or "in 2 days". */
export function relativeTime(value: string | null | undefined) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  let diff = (then - Date.now()) / 1000; // seconds, signed
  const isPast = diff < 0;
  diff = Math.abs(diff);

  for (const [factor, unit] of UNITS) {
    if (Math.abs(diff) < factor) {
      const value = Math.round(isPast ? -diff : diff);
      return rtf.format(value, unit);
    }
    diff /= factor;
  }
  return rtf.format(Math.round(isPast ? -diff : diff), "year");
}
