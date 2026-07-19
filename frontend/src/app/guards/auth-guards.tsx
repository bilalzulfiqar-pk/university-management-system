import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useAuth } from "@/app/providers/use-auth";
import { getRoleHome } from "@/lib/constants/navigation";
import type { UserRole } from "@/lib/api/types";

export function PublicOnlyRoute() {
  const { bootstrapping, user } = useAuth();

  if (bootstrapping) return <LoadingScreen label="Restoring your session…" fullscreen />;
  if (!user) return <Outlet />;
  if (user.must_change_password) return <Navigate to="/change-password" replace />;
  return <Navigate to={getRoleHome(user.role)} replace />;
}

export function ProtectedRoute() {
  const { bootstrapping, user } = useAuth();
  const location = useLocation();

  if (bootstrapping) return <LoadingScreen label="Loading your workspace…" fullscreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}

export function PasswordChangeOnlyRoute() {
  const { bootstrapping, user } = useAuth();

  if (bootstrapping) return <LoadingScreen label="Loading your account…" fullscreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.must_change_password) return <Navigate to={getRoleHome(user.role)} replace />;
  return <Outlet />;
}

export function RoleRoute({ role }: { role: UserRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={getRoleHome(user.role)} replace />;
  return <Outlet />;
}
