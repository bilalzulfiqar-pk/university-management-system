import type { UserRole } from "@/lib/api/types";

export interface NavItem {
  to: string;
  label: string;
  /** lucide icon element rendered in the sidebar. */
  icon: React.ReactNode;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export interface RouteMeta {
  path: string;
  title: string;
  description?: string;
  section: string;
  /** Breadcrumb label — defaults to `title`. */
  crumb?: string;
}

/**
 * Navigation + route metadata, grouped per role. This is the single source
 * of truth consumed by the sidebar, command palette, topbar, breadcrumbs,
 * and document title.
 */
export const navByRole: Record<UserRole, NavSection[]> = {
  ADMIN: [
    {
      id: "overview",
      label: "Overview",
      items: [
        { to: "/admin/dashboard", label: "Dashboard", icon: null },
      ],
    },
    {
      id: "manage",
      label: "Manage",
      items: [
        { to: "/admin/departments", label: "Departments", icon: null },
        { to: "/admin/students", label: "Students", icon: null },
        { to: "/admin/teachers", label: "Teachers", icon: null },
        { to: "/admin/courses", label: "Courses", icon: null },
        { to: "/admin/course-offerings", label: "Course Offerings", icon: null },
      ],
    },
    {
      id: "insights",
      label: "Insights",
      items: [
        { to: "/admin/audit-logs", label: "Audit Logs", icon: null },
      ],
    },
  ],
  TEACHER: [
    {
      id: "overview",
      label: "Overview",
      items: [{ to: "/teacher/dashboard", label: "Dashboard", icon: null }],
    },
    {
      id: "workspace",
      label: "Workspace",
      items: [
        { to: "/teacher/profile", label: "My Profile", icon: null },
        { to: "/teacher/course-offerings", label: "My Offerings", icon: null },
      ],
    },
  ],
  STUDENT: [
    {
      id: "overview",
      label: "Overview",
      items: [{ to: "/student/dashboard", label: "Dashboard", icon: null }],
    },
    {
      id: "workspace",
      label: "Workspace",
      items: [
        { to: "/student/profile", label: "My Profile", icon: null },
        { to: "/student/course-offerings", label: "My Enrollments", icon: null },
      ],
    },
  ],
};

/** Flat nav list (across all sections) for a given role. */
export function flatNavForRole(role: UserRole): NavItem[] {
  return navByRole[role].flatMap((section) => section.items);
}

/** Default landing path for a role. */
export function getRoleHome(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "TEACHER":
      return "/teacher/dashboard";
    case "STUDENT":
      return "/student/dashboard";
  }
}
