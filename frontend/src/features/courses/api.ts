import { apiFetch } from "@/lib/api/client";
import type { CoursePayload, CourseRead, MessageResponse, Page } from "@/lib/api/types";

export function listCourses(params: {
  search?: string;
  department_id?: number;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<Page<CourseRead>>("/api/v1/admin/courses", {}, params);
}

export function getCourse(id: number, includeDeleted = false) {
  return apiFetch<CourseRead>(`/api/v1/admin/courses/${id}`, {}, { include_deleted: includeDeleted });
}

export function createCourse(payload: CoursePayload) {
  return apiFetch<CourseRead>("/api/v1/admin/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCourse(id: number, payload: Partial<CoursePayload>) {
  return apiFetch<CourseRead>(`/api/v1/admin/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveCourse(id: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/courses/${id}`, { method: "DELETE" });
}
