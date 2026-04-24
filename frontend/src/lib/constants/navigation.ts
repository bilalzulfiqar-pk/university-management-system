import type { UserRole } from "@/lib/api/types";

export function getRoleHome(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "TEACHER":
      return "/teacher/dashboard";
    case "STUDENT":
      return "/student/dashboard";
  }
}
