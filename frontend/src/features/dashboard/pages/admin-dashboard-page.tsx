import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Circle,
  GraduationCap,
  ScrollText,
  UsersRound,
} from "lucide-react";

import { getAdminDashboardSummary } from "@/features/dashboard/api";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardHero } from "@/components/common/dashboard-hero";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface QuickAction {
  to: string;
  label: string;
  description: string;
  icon: typeof UsersRound;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    to: "/admin/students/new",
    label: "Add a student",
    description: "Create a student record and account",
    icon: UsersRound,
  },
  {
    to: "/admin/teachers/new",
    label: "Add a teacher",
    description: "Onboard a new faculty member",
    icon: GraduationCap,
  },
  {
    to: "/admin/courses/new",
    label: "Add a course",
    description: "Extend the course catalogue",
    icon: BookOpen,
  },
  {
    to: "/admin/course-offerings/new",
    label: "Create an offering",
    description: "Open a new section for a term",
    icon: ScrollText,
  },
];

const ACTION_DOT: Record<string, string> = {
  CREATE: "bg-success-500",
  UPDATE: "bg-info-500",
  DELETE: "bg-danger-500",
  RESTORE: "bg-warning-500",
};

export function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: getAdminDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SkeletonCard className="h-36 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description="The dashboard summary could not be loaded right now."
        onRetry={() => void refetch()}
      />
    );
  }

  // Onboarding checklist - derived from totals so a fresh instance has purpose.
  const checklist = [
    { label: "Add a department", done: data.totalDepartments > 0, to: "/admin/departments/new" },
    { label: "Create a course", done: data.totalCourses > 0, to: "/admin/courses/new" },
    { label: "Add a teacher", done: data.totalTeachers > 0, to: "/admin/teachers/new" },
    { label: "Enroll a student", done: data.totalStudents > 0, to: "/admin/students/new" },
    { label: "Open a course offering", done: data.totalOfferings > 0, to: "/admin/course-offerings/new" },
  ];
  const completed = checklist.filter((item) => item.done).length;

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Admin command center"
        title="Operations overview"
        description="Track the health of the university data setup and jump into the actions that matter most."
        actions={
          <>
            <Button asChild>
              <Link to="/admin/students/new">Add student</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="bg-white/10 text-white ring-white/15 hover:bg-white/15 hover:text-white"
            >
              <Link to="/admin/course-offerings/new">Create offering</Link>
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Students" value={data.totalStudents} icon={<UsersRound />} accent="ink" to="/admin/students" />
        <StatCard label="Teachers" value={data.totalTeachers} icon={<GraduationCap />} accent="info" to="/admin/teachers" />
        <StatCard label="Departments" value={data.totalDepartments} icon={<Building2 />} accent="accent" to="/admin/departments" />
        <StatCard label="Courses" value={data.totalCourses} icon={<BookOpen />} accent="success" to="/admin/courses" />
        <StatCard label="Active offerings" value={data.totalOfferings} icon={<Activity />} accent="warning" to="/admin/course-offerings" />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Quick actions */}
        <Card>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription className="mt-1">
            Run the common setup tasks without digging through the sidebar.
          </CardDescription>
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-smooth hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-600 ring-1 ring-inset ring-ink-100 transition-smooth group-hover:bg-ink-100">
                  <action.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-900">{action.label}</span>
                  <span className="block truncate text-xs text-slate-500">{action.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-smooth group-hover:translate-x-0.5 group-hover:text-ink-700" />
              </Link>
            ))}
          </div>
        </Card>

        {/* Onboarding checklist */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Get started</CardTitle>
              <CardDescription className="mt-1">Set up the basics to get the workspace ready.</CardDescription>
            </div>
            <span className="tabular shrink-0 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700 ring-1 ring-inset ring-ink-100">
              {completed}/{checklist.length}
            </span>
          </div>
          <ul className="mt-5 space-y-1">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-smooth hover:bg-slate-50"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      item.done ? "text-slate-400 line-through" : "font-medium text-ink-800",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recent audit activity */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription className="mt-1">
              The latest admin write actions, drawn from the audit trail.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/audit-logs">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-5 space-y-1">
          {data.recentActivity.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              No activity yet. Admin write actions will appear here.
            </p>
          ) : (
            data.recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-lg px-2 py-3 transition-smooth hover:bg-slate-50"
              >
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    ACTION_DOT[entry.action] ?? "bg-slate-400",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">{entry.description}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    <span className="uppercase tracking-[0.12em]">
                      {entry.action.replaceAll("_", " ")}
                    </span>
                    {" · "}
                    {relativeTime(entry.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
