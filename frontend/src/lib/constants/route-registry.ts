import type { UserRole } from "@/lib/api/types";
import { getRoleHome } from "./navigation";

interface RouteEntry {
  /** Exact pathname or a matcher prefix ending with `*`. */
  path: string;
  title: string;
  description?: string;
  /** Breadcrumb segments — first is treated as Home. */
  crumbs: string[];
}

/**
 * Per-route copy used by the topbar, breadcrumbs, and document title.
 * Lookups fall back to the closest prefix match.
 */
const ROUTES: RouteEntry[] = [
  {
    path: "/admin/dashboard",
    title: "Dashboard",
    description: "Track the health of the university data setup and jump into common admin tasks.",
    crumbs: ["Admin", "Dashboard"],
  },
  {
    path: "/admin/departments",
    title: "Departments",
    description: "Organise the academic departments that students, teachers, and courses belong to.",
    crumbs: ["Admin", "Departments"],
  },
  {
    path: "/admin/departments/new",
    title: "New Department",
    description: "Add a new academic department with a unique name and code.",
    crumbs: ["Admin", "Departments", "New"],
  },
  {
    path: "/admin/departments/*/edit",
    title: "Edit Department",
    description: "Update department details. Codes must remain unique across the workspace.",
    crumbs: ["Admin", "Departments", "Edit"],
  },
  {
    path: "/admin/students",
    title: "Students",
    description: "Create, update, archive, and restore student records.",
    crumbs: ["Admin", "Students"],
  },
  {
    path: "/admin/students/new",
    title: "New Student",
    description: "Create a student record and a linked account with a temporary password.",
    crumbs: ["Admin", "Students", "New"],
  },
  {
    path: "/admin/students/*/edit",
    title: "Edit Student",
    description: "Update student profile, department, semester, and account access.",
    crumbs: ["Admin", "Students", "Edit"],
  },
  {
    path: "/admin/teachers",
    title: "Teachers",
    description: "Manage faculty accounts and their department assignments.",
    crumbs: ["Admin", "Teachers"],
  },
  {
    path: "/admin/teachers/new",
    title: "New Teacher",
    description: "Add a faculty member and a linked account with a temporary password.",
    crumbs: ["Admin", "Teachers", "New"],
  },
  {
    path: "/admin/teachers/*/edit",
    title: "Edit Teacher",
    description: "Update teacher profile, department, and account access.",
    crumbs: ["Admin", "Teachers", "Edit"],
  },
  {
    path: "/admin/courses",
    title: "Courses",
    description: "Maintain the course catalogue linked to departments.",
    crumbs: ["Admin", "Courses"],
  },
  {
    path: "/admin/courses/new",
    title: "New Course",
    description: "Add a course with a unique code and credit hours.",
    crumbs: ["Admin", "Courses", "New"],
  },
  {
    path: "/admin/courses/*/edit",
    title: "Edit Course",
    description: "Update course details and department linkage.",
    crumbs: ["Admin", "Courses", "Edit"],
  },
  {
    path: "/admin/course-offerings",
    title: "Course Offerings",
    description: "Manage term sections, assign teachers, and enroll students.",
    crumbs: ["Admin", "Course Offerings"],
  },
  {
    path: "/admin/course-offerings/new",
    title: "New Offering",
    description: "Create a section for a course in a specific term and year.",
    crumbs: ["Admin", "Course Offerings", "New"],
  },
  {
    path: "/admin/course-offerings/*/edit",
    title: "Edit Offering",
    description: "Update section capacity, term, and year.",
    crumbs: ["Admin", "Course Offerings", "Edit"],
  },
  {
    path: "/admin/course-offerings/*",
    title: "Offering Details",
    description: "View roster, assigned teachers, and enrollment for this section.",
    crumbs: ["Admin", "Course Offerings", "Details"],
  },
  {
    path: "/admin/audit-logs",
    title: "Audit Logs",
    description: "A read-only history of admin write actions across the workspace.",
    crumbs: ["Admin", "Audit Logs"],
  },
  {
    path: "/teacher/dashboard",
    title: "Dashboard",
    description: "Stay focused on your assigned offerings and current classes.",
    crumbs: ["Teacher", "Dashboard"],
  },
  {
    path: "/teacher/profile",
    title: "My Profile",
    description: "Review your faculty profile and department assignment.",
    crumbs: ["Teacher", "Profile"],
  },
  {
    path: "/teacher/course-offerings",
    title: "My Offerings",
    description: "All sections currently assigned to you.",
    crumbs: ["Teacher", "Offerings"],
  },
  {
    path: "/teacher/course-offerings/*",
    title: "Offering",
    description: "View your roster for this section.",
    crumbs: ["Teacher", "Offerings", "Details"],
  },
  {
    path: "/student/dashboard",
    title: "Dashboard",
    description: "Your profile and enrolled course offerings at a glance.",
    crumbs: ["Student", "Dashboard"],
  },
  {
    path: "/student/profile",
    title: "My Profile",
    description: "Review your student profile, department, and semester.",
    crumbs: ["Student", "Profile"],
  },
  {
    path: "/student/course-offerings",
    title: "My Enrollments",
    description: "Course sections you are currently enrolled in.",
    crumbs: ["Student", "Enrollments"],
  },
  {
    path: "/student/course-offerings/*",
    title: "Offering",
    description: "Details for this enrolled section.",
    crumbs: ["Student", "Enrollments", "Details"],
  },
  {
    path: "/security",
    title: "Security",
    description: "Manage authenticator app protection for your account.",
    crumbs: ["Security"],
  },
];

function matchRoute(pathname: string): RouteEntry | undefined {
  const exact = ROUTES.find((route) => route.path === pathname);
  if (exact) return exact;

  // Try dynamic-prefix matches (paths containing `*`).
  // Sort by specificity (more segments first) so /admin/course-offerings/* beats nothing.
  const dynamic = ROUTES.filter((route) => route.path.includes("*"))
    .map((route) => ({
      route,
      prefix: route.path.slice(0, route.path.indexOf("*")),
    }))
    .filter(({ prefix }) => prefix.length > 0 && pathname.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  return dynamic[0]?.route;
}

export interface ResolvedRoute {
  title: string;
  description?: string;
  crumbs: string[];
}

export function resolveRoute(pathname: string): ResolvedRoute {
  const entry = matchRoute(pathname);
  return {
    title: entry?.title ?? "Workspace",
    description: entry?.description,
    crumbs: entry?.crumbs ?? ["Home"],
  };
}

/** Convert breadcrumb strings into BreadcrumbItem[] for a role. */
export function breadcrumbFor(
  pathname: string,
  role: UserRole,
): Array<{ label: string; to?: string }> {
  const resolved = resolveRoute(pathname);
  const home = getRoleHome(role);
  const roleLabel = role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : "Student";

  // First crumb is the role home; middle crumbs are section context.
  const items: Array<{ label: string; to?: string }> = [{ label: roleLabel, to: home }];

  resolved.crumbs.slice(1).forEach((crumb, index, arr) => {
    const isLast = index === arr.length - 1;
    items.push({ label: crumb, to: isLast ? undefined : undefined });
  });

  return items;
}
