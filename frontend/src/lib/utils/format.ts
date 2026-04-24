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
