export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";
export type AcademicTerm = "SPRING" | "SUMMER" | "FALL";

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    request_id?: string | null;
    details?: unknown;
  };
}

export interface ApiValidationIssue {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface TimestampedModel {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  totp_enabled: boolean;
  profile_id: number | null;
  first_name: string | null;
  last_name: string | null;
}

export interface SessionResponse {
  expires_in: number;
  refresh_expires_in: number;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
  totp_code?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface TotpStatusResponse {
  enabled: boolean;
}

export interface TotpSetupResponse {
  secret: string;
  provisioning_uri: string;
}

export interface TotpCodePayload {
  code: string;
}

export interface DepartmentRead extends TimestampedModel {
  name: string;
  code: string;
}

export interface DepartmentPayload {
  name: string;
  code: string;
}

export interface StudentRead extends TimestampedModel {
  user_id: number;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  first_name: string;
  last_name: string;
  roll_number: string;
  department_id: number;
  current_semester: number;
}

export interface StudentPayload {
  email: string;
  temporary_password?: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  department_id: number;
  current_semester: number;
  is_active: boolean;
}

export interface TeacherRead extends TimestampedModel {
  user_id: number;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  first_name: string;
  last_name: string;
  employee_id: string;
  department_id: number;
}

export interface TeacherPayload {
  email: string;
  temporary_password?: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department_id: number;
  is_active: boolean;
}

export interface CourseRead extends TimestampedModel {
  name: string;
  code: string;
  credit_hours: number;
  department_id: number;
}

export interface CoursePayload {
  name: string;
  code: string;
  credit_hours: number;
  department_id: number;
}

export interface CourseOfferingRead extends TimestampedModel {
  course_id: number;
  course_code: string;
  course_name: string;
  term: AcademicTerm;
  year: number;
  section: string;
  capacity: number | null;
  teacher_ids: number[];
  student_count: number;
}

export interface CourseOfferingPayload {
  course_id: number;
  term: AcademicTerm;
  year: number;
  section: string;
  capacity?: number | null;
}

export interface AdminAuditLogRead {
  id: number;
  actor_user_id: number | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_label: string | null;
  description: string;
  method: string;
  path: string;
  status_code: number;
  request_id: string | null;
  client_ip: string | null;
  created_at: string;
}
