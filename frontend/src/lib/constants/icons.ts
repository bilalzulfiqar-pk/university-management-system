import {
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  School,
  ScrollText,
  ShieldUser,
  UsersRound,
  BookOpen,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

/** Icon used for each nav destination, keyed by path prefix. */
export const navIconFor: Record<string, LucideIcon> = {
  "/admin/dashboard": LayoutDashboard,
  "/admin/departments": School,
  "/admin/students": UsersRound,
  "/admin/teachers": ShieldUser,
  "/admin/courses": GraduationCap,
  "/admin/course-offerings": BookOpen,
  "/admin/audit-logs": ScrollText,
  "/teacher/dashboard": LayoutDashboard,
  "/teacher/profile": UserCircle,
  "/teacher/course-offerings": BookOpen,
  "/student/dashboard": LayoutDashboard,
  "/student/profile": UserCircle,
  "/student/course-offerings": BookOpen,
  "/security": LockKeyhole,
};

/** Quick-action destinations surfaced in the command palette. */
export interface QuickAction {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: Array<"ADMIN" | "TEACHER" | "STUDENT">;
}

export const quickActions: QuickAction[] = [
  {
    to: "/admin/students/new",
    label: "Add student",
    description: "Create a student record and account",
    icon: UsersRound,
    roles: ["ADMIN"],
  },
  {
    to: "/admin/teachers/new",
    label: "Add teacher",
    description: "Create a faculty member and account",
    icon: ShieldUser,
    roles: ["ADMIN"],
  },
  {
    to: "/admin/courses/new",
    label: "Add course",
    description: "Add a course to the catalogue",
    icon: GraduationCap,
    roles: ["ADMIN"],
  },
  {
    to: "/admin/departments/new",
    label: "Add department",
    description: "Create an academic department",
    icon: School,
    roles: ["ADMIN"],
  },
  {
    to: "/admin/course-offerings/new",
    label: "Create offering",
    description: "Open a new section for a course",
    icon: BookOpen,
    roles: ["ADMIN"],
  },
  {
    to: "/security",
    label: "Security settings",
    description: "Manage two-factor authentication",
    icon: LockKeyhole,
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
];
