/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { PublicOnlyRoute, ProtectedRoute, PasswordChangeOnlyRoute, RoleRoute } from "@/app/guards/auth-guards";
import { AppShellLayout } from "@/app/layouts/app-shell-layout";
import { AuthLayout } from "@/app/layouts/auth-layout";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { NotFoundPage } from "@/pages/not-found-page";

// Lazy-loaded route pages - keeps the initial bundle small and improves
// first-paint on login. Each page is split into its own chunk.
const LoginPage = lazy(() =>
  import("@/features/auth/pages/login-page").then((m) => ({ default: m.LoginPage })),
);
const ChangePasswordPage = lazy(() =>
  import("@/features/auth/pages/change-password-page").then((m) => ({ default: m.ChangePasswordPage })),
);
const SecurityPage = lazy(() =>
  import("@/features/auth/pages/security-page").then((m) => ({ default: m.SecurityPage })),
);
const AdminDashboardPage = lazy(() =>
  import("@/features/dashboard/pages/admin-dashboard-page").then((m) => ({ default: m.AdminDashboardPage })),
);
const DepartmentListPage = lazy(() =>
  import("@/features/departments/pages/department-list-page").then((m) => ({ default: m.DepartmentListPage })),
);
const DepartmentFormPage = lazy(() =>
  import("@/features/departments/pages/department-form-page").then((m) => ({ default: m.DepartmentFormPage })),
);
const StudentListPage = lazy(() =>
  import("@/features/students/pages/student-list-page").then((m) => ({ default: m.StudentListPage })),
);
const StudentFormPage = lazy(() =>
  import("@/features/students/pages/student-form-page").then((m) => ({ default: m.StudentFormPage })),
);
const TeacherListPage = lazy(() =>
  import("@/features/teachers/pages/teacher-list-page").then((m) => ({ default: m.TeacherListPage })),
);
const TeacherFormPage = lazy(() =>
  import("@/features/teachers/pages/teacher-form-page").then((m) => ({ default: m.TeacherFormPage })),
);
const CourseListPage = lazy(() =>
  import("@/features/courses/pages/course-list-page").then((m) => ({ default: m.CourseListPage })),
);
const CourseFormPage = lazy(() =>
  import("@/features/courses/pages/course-form-page").then((m) => ({ default: m.CourseFormPage })),
);
const OfferingListPage = lazy(() =>
  import("@/features/offerings/pages/offering-list-page").then((m) => ({ default: m.OfferingListPage })),
);
const OfferingFormPage = lazy(() =>
  import("@/features/offerings/pages/offering-form-page").then((m) => ({ default: m.OfferingFormPage })),
);
const OfferingDetailPage = lazy(() =>
  import("@/features/offerings/pages/offering-detail-page").then((m) => ({ default: m.OfferingDetailPage })),
);
const AuditLogPage = lazy(() =>
  import("@/features/audit-logs/pages/audit-log-page").then((m) => ({ default: m.AuditLogPage })),
);
const TeacherDashboardPage = lazy(() =>
  import("@/features/teacher-portal/pages/teacher-dashboard-page").then((m) => ({
    default: m.TeacherDashboardPage,
  })),
);
const TeacherProfilePage = lazy(() =>
  import("@/features/teacher-portal/pages/teacher-profile-page").then((m) => ({ default: m.TeacherProfilePage })),
);
const TeacherOfferingsPage = lazy(() =>
  import("@/features/teacher-portal/pages/teacher-offerings-page").then((m) => ({
    default: m.TeacherOfferingsPage,
  })),
);
const TeacherOfferingDetailPage = lazy(() =>
  import("@/features/teacher-portal/pages/teacher-offering-detail-page").then((m) => ({
    default: m.TeacherOfferingDetailPage,
  })),
);
const StudentDashboardPage = lazy(() =>
  import("@/features/student-portal/pages/student-dashboard-page").then((m) => ({
    default: m.StudentDashboardPage,
  })),
);
const StudentProfilePage = lazy(() =>
  import("@/features/student-portal/pages/student-profile-page").then((m) => ({ default: m.StudentProfilePage })),
);
const StudentOfferingsPage = lazy(() =>
  import("@/features/student-portal/pages/student-offerings-page").then((m) => ({
    default: m.StudentOfferingsPage,
  })),
);
const StudentOfferingDetailPage = lazy(() =>
  import("@/features/student-portal/pages/student-offering-detail-page").then((m) => ({
    default: m.StudentOfferingDetailPage,
  })),
);

/** Wrap a lazy page with a Suspense boundary using a consistent fallback. */
function withSuspense(node: ReactNode, label = "Loading…") {
  return <Suspense fallback={<LoadingScreen label={label} />}>{node}</Suspense>;
}

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
        children: [
          { path: "/login", element: withSuspense(<LoginPage />, "Loading sign in…") },
        ],
      },
    ],
  },
  {
    element: <PasswordChangeOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/change-password", element: withSuspense(<ChangePasswordPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          { path: "/security", element: withSuspense(<SecurityPage />) },
          {
            path: "/admin",
            element: <RoleRoute role="ADMIN" />,
            children: [
              { path: "dashboard", element: withSuspense(<AdminDashboardPage />) },
              { path: "departments", element: withSuspense(<DepartmentListPage />) },
              { path: "departments/new", element: withSuspense(<DepartmentFormPage />) },
              { path: "departments/:id/edit", element: withSuspense(<DepartmentFormPage />) },
              { path: "students", element: withSuspense(<StudentListPage />) },
              { path: "students/new", element: withSuspense(<StudentFormPage />) },
              { path: "students/:id/edit", element: withSuspense(<StudentFormPage />) },
              { path: "teachers", element: withSuspense(<TeacherListPage />) },
              { path: "teachers/new", element: withSuspense(<TeacherFormPage />) },
              { path: "teachers/:id/edit", element: withSuspense(<TeacherFormPage />) },
              { path: "courses", element: withSuspense(<CourseListPage />) },
              { path: "courses/new", element: withSuspense(<CourseFormPage />) },
              { path: "courses/:id/edit", element: withSuspense(<CourseFormPage />) },
              { path: "course-offerings", element: withSuspense(<OfferingListPage />) },
              { path: "course-offerings/new", element: withSuspense(<OfferingFormPage />) },
              { path: "course-offerings/:id/edit", element: withSuspense(<OfferingFormPage />) },
              { path: "course-offerings/:id", element: withSuspense(<OfferingDetailPage />) },
              { path: "audit-logs", element: withSuspense(<AuditLogPage />) },
            ],
          },
          {
            path: "/teacher",
            element: <RoleRoute role="TEACHER" />,
            children: [
              { path: "dashboard", element: withSuspense(<TeacherDashboardPage />) },
              { path: "profile", element: withSuspense(<TeacherProfilePage />) },
              { path: "course-offerings", element: withSuspense(<TeacherOfferingsPage />) },
              { path: "course-offerings/:id", element: withSuspense(<TeacherOfferingDetailPage />) },
            ],
          },
          {
            path: "/student",
            element: <RoleRoute role="STUDENT" />,
            children: [
              { path: "dashboard", element: withSuspense(<StudentDashboardPage />) },
              { path: "profile", element: withSuspense(<StudentProfilePage />) },
              { path: "course-offerings", element: withSuspense(<StudentOfferingsPage />) },
              { path: "course-offerings/:id", element: withSuspense(<StudentOfferingDetailPage />) },
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
