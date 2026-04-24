import { apiFetch } from "@/lib/api/client";
import type { CourseOfferingRead, Page, StudentRead, TeacherRead } from "@/lib/api/types";

export function getMyTeacherProfile() {
  return apiFetch<TeacherRead>("/api/v1/me/teacher");
}

export function listMyTeacherOfferings(params: { limit?: number; offset?: number }) {
  return apiFetch<Page<CourseOfferingRead>>("/api/v1/me/teacher/course-offerings", {}, params);
}

export function listMyTeacherOfferingStudents(offeringId: number, params: { limit?: number; offset?: number }) {
  return apiFetch<Page<StudentRead>>(`/api/v1/me/teacher/course-offerings/${offeringId}/students`, {}, params);
}
