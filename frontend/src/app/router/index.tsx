import { createBrowserRouter, Navigate } from "react-router-dom";

import { PublicOnlyRoute, ProtectedRoute, PasswordChangeOnlyRoute, RoleRoute } from "@/app/guards/auth-guards";
import { AppShellLayout } from "@/app/layouts/app-shell-layout";
import { AuthLayout } from "@/app/layouts/auth-layout";
import { ChangePasswordPage } from "@/features/auth/pages/change-password-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SecurityPage } from "@/features/auth/pages/security-page";
import { AuditLogPage } from "@/features/audit-logs/pages/audit-log-page";
import { CourseFormPage } from "@/features/courses/pages/course-form-page";
import { CourseListPage } from "@/features/courses/pages/course-list-page";
import { AdminDashboardPage } from "@/features/dashboard/pages/admin-dashboard-page";
import { DepartmentFormPage } from "@/features/departments/pages/department-form-page";
import { DepartmentListPage } from "@/features/departments/pages/department-list-page";
import { OfferingDetailPage } from "@/features/offerings/pages/offering-detail-page";
import { OfferingFormPage } from "@/features/offerings/pages/offering-form-page";
import { OfferingListPage } from "@/features/offerings/pages/offering-list-page";
import { StudentDashboardPage } from "@/features/student-portal/pages/student-dashboard-page";
import { StudentOfferingDetailPage } from "@/features/student-portal/pages/student-offering-detail-page";
import { StudentOfferingsPage } from "@/features/student-portal/pages/student-offerings-page";
import { StudentProfilePage } from "@/features/student-portal/pages/student-profile-page";
import { StudentFormPage } from "@/features/students/pages/student-form-page";
import { StudentListPage } from "@/features/students/pages/student-list-page";
import { TeacherDashboardPage } from "@/features/teacher-portal/pages/teacher-dashboard-page";
import { TeacherOfferingDetailPage } from "@/features/teacher-portal/pages/teacher-offering-detail-page";
import { TeacherOfferingsPage } from "@/features/teacher-portal/pages/teacher-offerings-page";
import { TeacherProfilePage } from "@/features/teacher-portal/pages/teacher-profile-page";
import { TeacherFormPage } from "@/features/teachers/pages/teacher-form-page";
import { TeacherListPage } from "@/features/teachers/pages/teacher-list-page";
import { NotFoundPage } from "@/pages/not-found-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: "/login", element: <LoginPage /> }],
      },
    ],
  },
  {
    element: <PasswordChangeOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: "/change-password", element: <ChangePasswordPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          { path: "/security", element: <SecurityPage /> },
          {
            path: "/admin",
            element: <RoleRoute role="ADMIN" />,
            children: [
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "departments", element: <DepartmentListPage /> },
              { path: "departments/new", element: <DepartmentFormPage /> },
              { path: "departments/:id/edit", element: <DepartmentFormPage /> },
              { path: "students", element: <StudentListPage /> },
              { path: "students/new", element: <StudentFormPage /> },
              { path: "students/:id/edit", element: <StudentFormPage /> },
              { path: "teachers", element: <TeacherListPage /> },
              { path: "teachers/new", element: <TeacherFormPage /> },
              { path: "teachers/:id/edit", element: <TeacherFormPage /> },
              { path: "courses", element: <CourseListPage /> },
              { path: "courses/new", element: <CourseFormPage /> },
              { path: "courses/:id/edit", element: <CourseFormPage /> },
              { path: "course-offerings", element: <OfferingListPage /> },
              { path: "course-offerings/new", element: <OfferingFormPage /> },
              { path: "course-offerings/:id/edit", element: <OfferingFormPage /> },
              { path: "course-offerings/:id", element: <OfferingDetailPage /> },
              { path: "audit-logs", element: <AuditLogPage /> },
            ],
          },
          {
            path: "/teacher",
            element: <RoleRoute role="TEACHER" />,
            children: [
              { path: "dashboard", element: <TeacherDashboardPage /> },
              { path: "profile", element: <TeacherProfilePage /> },
              { path: "course-offerings", element: <TeacherOfferingsPage /> },
              { path: "course-offerings/:id", element: <TeacherOfferingDetailPage /> },
            ],
          },
          {
            path: "/student",
            element: <RoleRoute role="STUDENT" />,
            children: [
              { path: "dashboard", element: <StudentDashboardPage /> },
              { path: "profile", element: <StudentProfilePage /> },
              { path: "course-offerings", element: <StudentOfferingsPage /> },
              { path: "course-offerings/:id", element: <StudentOfferingDetailPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
