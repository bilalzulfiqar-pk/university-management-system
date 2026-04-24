import { apiFetch } from "@/lib/api/client";
import type {
  ChangePasswordPayload,
  MessageResponse,
  TotpCodePayload,
  TotpSetupResponse,
  TotpStatusResponse,
} from "@/lib/api/types";

export function changePassword(payload: ChangePasswordPayload) {
  return apiFetch<MessageResponse>("/api/v1/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTotpStatus() {
  return apiFetch<TotpStatusResponse>("/api/v1/auth/totp");
}

export function startTotpSetup() {
  return apiFetch<TotpSetupResponse>("/api/v1/auth/totp/setup", {
    method: "POST",
  });
}

export function enableTotp(payload: TotpCodePayload) {
  return apiFetch<MessageResponse>("/api/v1/auth/totp/enable", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function disableTotp(payload: TotpCodePayload) {
  return apiFetch<MessageResponse>("/api/v1/auth/totp/disable", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
