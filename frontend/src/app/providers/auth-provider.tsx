import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "@/app/providers/auth-context";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { AuthUser, LoginPayload, TokenResponse } from "@/lib/api/types";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth/storage";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = getAccessToken();
    if (!activeToken) {
      setUser(null);
      setBootstrapping(false);
      return null;
    }

    try {
      const me = await apiFetch<AuthUser>("/api/v1/auth/me");
      setUser(me);
      setToken(activeToken);
      return me;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
      }
      throw error;
    } finally {
      setBootstrapping(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshUser().catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setBootstrapping(false);
    };
    const onPasswordRequired = () => {
      setUser((current) => (current ? { ...current, must_change_password: true } : current));
    };

    window.addEventListener("ums:unauthorized", onUnauthorized);
    window.addEventListener("ums:password-change-required", onPasswordRequired);

    return () => {
      window.removeEventListener("ums:unauthorized", onUnauthorized);
      window.removeEventListener("ums:password-change-required", onPasswordRequired);
    };
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await apiFetch<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setAccessToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await apiFetch("/api/v1/auth/logout", { method: "POST" });
      }
    } catch {
      // ignore logout request failures and clear client state anyway
    } finally {
      clearSession();
      setBootstrapping(false);
    }
  }, [clearSession]);

  const setMustChangePassword = useCallback((value: boolean) => {
    setUser((current) => (current ? { ...current, must_change_password: value } : current));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      bootstrapping,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshUser,
      setMustChangePassword,
    }),
    [bootstrapping, login, logout, refreshUser, setMustChangePassword, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
