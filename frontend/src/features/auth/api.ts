import { apiFetch } from "@/lib/api/client";
import type { ChangePasswordPayload, MessageResponse } from "@/lib/api/types";

export function changePassword(payload: ChangePasswordPayload) {
  return apiFetch<MessageResponse>("/api/v1/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
