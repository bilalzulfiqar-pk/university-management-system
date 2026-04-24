import { clearAccessToken, getAccessToken } from "@/lib/auth/storage";
import type { ApiErrorEnvelope } from "@/lib/api/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  code: string;
  requestId?: string | null;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown, requestId?: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

type QueryValue = string | number | boolean | null | undefined;

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function dispatchAuthEvent(type: "ums:unauthorized" | "ums:password-change-required") {
  window.dispatchEvent(new CustomEvent(type));
}

function toApiError(status: number, payload: ApiErrorEnvelope | null, fallbackMessage: string) {
  return new ApiError(
    status,
    payload?.error.code ?? "REQUEST_FAILED",
    payload?.error.message ?? fallbackMessage,
    payload?.error.details,
    payload?.error.request_id,
  );
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, QueryValue>,
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const payload = isJson ? ((await response.json()) as T | ApiErrorEnvelope) : null;

  if (!response.ok) {
    const apiPayload = payload as ApiErrorEnvelope | null;
    const error = toApiError(response.status, apiPayload, "Request failed.");

    if (response.status === 401) {
      clearAccessToken();
      dispatchAuthEvent("ums:unauthorized");
    } else if (error.code === "PASSWORD_CHANGE_REQUIRED") {
      dispatchAuthEvent("ums:password-change-required");
    }

    throw error;
  }

  return payload as T;
}
