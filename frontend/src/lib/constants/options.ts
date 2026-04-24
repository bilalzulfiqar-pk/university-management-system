import type { AcademicTerm } from "@/lib/api/types";

export const academicTerms: AcademicTerm[] = ["SPRING", "SUMMER", "FALL"];
export const semesters = Array.from({ length: 12 }, (_, index) => index + 1);
