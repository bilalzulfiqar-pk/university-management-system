import { createContext } from "react";

import type { AuthUser, LoginPayload, TokenResponse } from "@/lib/api/types";

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  bootstrapping: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  setMustChangePassword: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
