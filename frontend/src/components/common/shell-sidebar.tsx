import { GraduationCap, LayoutDashboard, LogOut, School, ScrollText, ShieldUser, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/use-auth";
import type { UserRole } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

const navByRole: Record<UserRole, Array<{ to: string; label: string; icon: React.ReactNode }>> = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/admin/departments", label: "Departments", icon: <School className="h-4 w-4" /> },
    { to: "/admin/students", label: "Students", icon: <UsersRound className="h-4 w-4" /> },
    { to: "/admin/teachers", label: "Teachers", icon: <ShieldUser className="h-4 w-4" /> },
    { to: "/admin/courses", label: "Courses", icon: <GraduationCap className="h-4 w-4" /> },
    { to: "/admin/course-offerings", label: "Offerings", icon: <ScrollText className="h-4 w-4" /> },
    { to: "/admin/audit-logs", label: "Audit Logs", icon: <ScrollText className="h-4 w-4" /> },
  ],
  TEACHER: [
    { to: "/teacher/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/teacher/profile", label: "My Profile", icon: <ShieldUser className="h-4 w-4" /> },
    { to: "/teacher/course-offerings", label: "My Offerings", icon: <GraduationCap className="h-4 w-4" /> },
  ],
  STUDENT: [
    { to: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/student/profile", label: "My Profile", icon: <ShieldUser className="h-4 w-4" /> },
    { to: "/student/course-offerings", label: "My Enrollments", icon: <GraduationCap className="h-4 w-4" /> },
  ],
};

export function ShellSidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const links = navByRole[user.role];

  return (
    <aside className="hidden min-h-screen border-r border-white/70 bg-ink-950 px-5 py-6 text-white md:block">
      <div className="flex h-full flex-col gap-8">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">University Management</p>
            <h2 className="mt-2 text-2xl font-semibold">Operations Hub</h2>
          </div>
          <Badge className="bg-white/10 text-blue-100" variant="accent">
            {user.role}
          </Badge>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white",
                  isActive && "bg-white/12 text-white shadow-inner",
                )
              }
            >
              {item.icon}
              <span className="hidden xl:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rounded-[18px] bg-white/6 p-4">
          <p className="text-sm font-semibold">{user.first_name ?? user.email}</p>
          <p className="mt-1 text-xs text-blue-200">{user.email}</p>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
