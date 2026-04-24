import { createContext } from "react";

import type { AuthUser, LoginPayload, SessionResponse } from "@/lib/api/types";

export interface AuthContextValue {
  user: AuthUser | null;
  bootstrapping: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<SessionResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  setMustChangePassword: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
