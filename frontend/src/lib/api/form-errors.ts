import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/lib/api/client";
import type { ApiValidationIssue } from "@/lib/api/types";

export function applyApiFormErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
) {
  if (!(error instanceof ApiError)) return false;

  if (error.code === "VALIDATION_ERROR" && Array.isArray(error.details)) {
    for (const issue of error.details as ApiValidationIssue[]) {
      const field = issue.loc[issue.loc.length - 1];
      if (typeof field === "string") {
        setError(field as Path<TFieldValues>, { message: issue.msg });
      }
    }
    return true;
  }

  return false;
}
