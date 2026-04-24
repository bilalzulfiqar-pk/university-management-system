import { listAuditLogs } from "@/features/audit-logs/api";
import { listCourses } from "@/features/courses/api";
import { listDepartments } from "@/features/departments/api";
import { listOfferings } from "@/features/offerings/api";
import { listStudents } from "@/features/students/api";
import { listTeachers } from "@/features/teachers/api";

export async function getAdminDashboardSummary() {
  const [departments, students, teachers, courses, offerings, activity] = await Promise.all([
    listDepartments({ limit: 1, offset: 0 }),
    listStudents({ limit: 1, offset: 0 }),
    listTeachers({ limit: 1, offset: 0 }),
    listCourses({ limit: 1, offset: 0 }),
    listOfferings({ limit: 1, offset: 0 }),
    listAuditLogs({ limit: 5, offset: 0 }),
  ]);

  return {
    totalDepartments: departments.total,
    totalStudents: students.total,
    totalTeachers: teachers.total,
    totalCourses: courses.total,
    totalOfferings: offerings.total,
    recentActivity: activity.items,
  };
}
