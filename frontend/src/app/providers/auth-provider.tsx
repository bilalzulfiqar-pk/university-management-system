import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "@/app/providers/auth-context";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { AuthUser, LoginPayload, SessionResponse } from "@/lib/api/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/api/v1/auth/me");
      setUser(me);
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
    const result = await apiFetch<SessionResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
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
      bootstrapping,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      setMustChangePassword,
    }),
    [bootstrapping, login, logout, refreshUser, setMustChangePassword, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
