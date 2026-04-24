import { apiFetch } from "@/lib/api/client";
import type { CourseOfferingRead, Page, StudentRead } from "@/lib/api/types";

export function getMyStudentProfile() {
  return apiFetch<StudentRead>("/api/v1/me/student");
}

export function listMyStudentOfferings(params: { limit?: number; offset?: number }) {
  return apiFetch<Page<CourseOfferingRead>>("/api/v1/me/student/course-offerings", {}, params);
}
