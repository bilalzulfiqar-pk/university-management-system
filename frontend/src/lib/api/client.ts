import type { ApiErrorEnvelope } from "@/lib/api/types";
import { getCsrfToken } from "@/lib/auth/cookies";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
const REFRESH_PATH = "/api/v1/auth/refresh";
const LOGIN_PATH = "/api/v1/auth/login";

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

function shouldAttachCsrfToken(method: string) {
  return method !== "GET" && method !== "HEAD";
}

function shouldAttemptRefresh(path: string) {
  return path !== LOGIN_PATH && path !== REFRESH_PATH;
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

async function parseResponsePayload<T>(response: Response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  return isJson ? ((await response.json()) as T | ApiErrorEnvelope) : null;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const headers = new Headers();
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }

    try {
      const response = await fetch(buildUrl(REFRESH_PATH), {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        dispatchAuthEvent("ums:unauthorized");
        return false;
      }
      return true;
    } catch {
      dispatchAuthEvent("ums:unauthorized");
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function apiFetchInternal<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, QueryValue>,
  allowRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (shouldAttachCsrfToken(method) && !headers.has("X-CSRF-Token")) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && allowRefresh && shouldAttemptRefresh(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetchInternal<T>(path, init, query, false);
    }
  }

  const payload = await parseResponsePayload<T>(response);

  if (!response.ok) {
    const apiPayload = payload as ApiErrorEnvelope | null;
    const error = toApiError(response.status, apiPayload, "Request failed.");

    if (response.status === 401) {
      dispatchAuthEvent("ums:unauthorized");
    } else if (error.code === "PASSWORD_CHANGE_REQUIRED") {
      dispatchAuthEvent("ums:password-change-required");
    }

    throw error;
  }

  return payload as T;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, QueryValue>,
): Promise<T> {
  return apiFetchInternal<T>(path, init, query);
}
