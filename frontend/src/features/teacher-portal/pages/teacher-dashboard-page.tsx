import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Building2, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import { getMyTeacherProfile, listMyTeacherOfferings } from "@/features/teacher-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardHero } from "@/components/common/dashboard-hero";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatTerm } from "@/lib/utils/format";

export function TeacherDashboardPage() {
  const profileQuery = useQuery({ queryKey: ["my-teacher-profile"], queryFn: getMyTeacherProfile });
  const offeringsQuery = useQuery({
    queryKey: ["my-teacher-offerings"],
    queryFn: () => listMyTeacherOfferings({ limit: 20, offset: 0 }),
  });

  if (profileQuery.isLoading || offeringsQuery.isLoading) {
    return (
      <div className="space-y-8">
        <SkeletonCard className="h-36 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (profileQuery.isError || offeringsQuery.isError || !profileQuery.data || !offeringsQuery.data) {
    return <ErrorState description="Teacher dashboard could not be loaded." />;
  }

  const totalStudents = offeringsQuery.data.items.reduce((sum, offering) => sum + offering.student_count, 0);

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Teacher workspace"
        title={`Welcome, ${profileQuery.data.first_name}`}
        description="Stay focused on the offerings assigned to you and the students inside them."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Assigned offerings"
          value={offeringsQuery.data.total}
          icon={<BookOpen />}
          accent="ink"
          to="/teacher/course-offerings"
        />
        <StatCard
          label="Students across offerings"
          value={totalStudents}
          icon={<UsersRound />}
          accent="info"
          to="/teacher/course-offerings"
        />
        <StatCard
          label="Department"
          value={profileQuery.data.department_name ?? "—"}
          icon={<Building2 />}
          accent="accent"
          to="/teacher/profile"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Current offerings</CardTitle>
            <CardDescription className="mt-1">
              Sections you are teaching this term. Open one to view its roster.
            </CardDescription>
          </div>
          <Badge variant="neutral">{offeringsQuery.data.total} total</Badge>
        </div>

        <div className="mt-5">
          {offeringsQuery.data.items.length === 0 ? (
            <EmptyState
              title="No offerings assigned yet"
              description="Once an admin assigns you to a course offering, it will appear here."
              icon={<BookOpen className="h-5 w-5" />}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {offeringsQuery.data.items.map((offering) => (
                <Link
                  key={offering.id}
                  to={`/teacher/course-offerings/${offering.id}`}
                  className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-smooth hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-ink-900">
                        {offering.course_code} · {offering.course_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTerm(offering.term)} {offering.year} · Section {offering.section}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-smooth group-hover:translate-x-0.5 group-hover:text-ink-700" />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-medium text-ink-700">
                    <UsersRound className="h-3.5 w-3.5 text-slate-400" />
                    {offering.student_count} students enrolled
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
