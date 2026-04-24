import { Activity, BookOpen, Building2, GraduationCap, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getAdminDashboardSummary } from "@/features/dashboard/api";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

export function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: getAdminDashboardSummary,
  });

  if (isLoading) return <LoadingScreen label="Building the admin dashboard..." />;
  if (isError || !data) return <ErrorState description="The dashboard summary could not be loaded." onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin command center"
        title="Keep the university setup moving"
        description="Review the current footprint of departments, accounts, and course offerings, then jump into the actions that matter most."
        actions={
          <>
            <Button asChild>
              <Link to="/admin/students/new">Add student</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/admin/course-offerings/new">Create offering</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
        <StatCard label="Students" value={data.totalStudents} icon={<UsersRound className="h-5 w-5" />} />
        <StatCard label="Teachers" value={data.totalTeachers} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Departments" value={data.totalDepartments} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Courses" value={data.totalCourses} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Active Offerings" value={data.totalOfferings} icon={<Activity className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-ink-950">Quick actions</h3>
              <p className="text-sm text-slate-700">Run the common setup tasks without digging through the sidebar.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Button asChild><Link to="/admin/departments">Manage departments</Link></Button>
            <Button asChild variant="secondary"><Link to="/admin/teachers/new">Add teacher</Link></Button>
            <Button asChild variant="secondary"><Link to="/admin/courses/new">Add course</Link></Button>
            <Button asChild variant="secondary"><Link to="/admin/audit-logs">Review audit history</Link></Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-ink-950">Recent audit activity</h3>
            <p className="text-sm text-slate-700">Readable backend-owned history for the latest admin write actions.</p>
          </div>
          <div className="space-y-4">
            {data.recentActivity.map((entry) => (
              <div key={entry.id} className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-ink-950">{entry.description}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {entry.action.replaceAll("_", " ")} • {formatDate(entry.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
