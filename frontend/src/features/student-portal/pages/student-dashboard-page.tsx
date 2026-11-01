import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Building2, GraduationCap, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import { getMyStudentProfile, listMyStudentOfferings } from "@/features/student-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardHero } from "@/components/common/dashboard-hero";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatTerm } from "@/lib/utils/format";

export function StudentDashboardPage() {
  const profileQuery = useQuery({ queryKey: ["my-student-profile"], queryFn: getMyStudentProfile });
  const offeringsQuery = useQuery({
    queryKey: ["my-student-offerings"],
    queryFn: () => listMyStudentOfferings({ limit: 50, offset: 0 }),
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
    return <ErrorState description="Student dashboard could not be loaded." />;
  }

  return (
    <div className="space-y-8">
      <DashboardHero
        eyebrow="Student portal"
        title={`Welcome, ${profileQuery.data.first_name}`}
        description="Your profile and enrolled course offerings, kept intentionally simple."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Current semester"
          value={profileQuery.data.current_semester}
          icon={<GraduationCap />}
          accent="ink"
          to="/student/profile"
        />
        <StatCard
          label="Department"
          value={profileQuery.data.department_name ?? "-"}
          icon={<Building2 />}
          accent="accent"
          to="/student/profile"
        />
        <StatCard
          label="Enrolled offerings"
          value={offeringsQuery.data.total}
          icon={<BookOpen />}
          accent="info"
          to="/student/course-offerings"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>My current enrollments</CardTitle>
            <CardDescription className="mt-1">
              Course sections you are enrolled in this term.
            </CardDescription>
          </div>
          <Badge variant="neutral">{offeringsQuery.data.total} total</Badge>
        </div>

        <div className="mt-5">
          {offeringsQuery.data.items.length === 0 ? (
            <EmptyState
              title="No enrollments yet"
              description="Your enrolled course offerings will appear here after an admin adds them."
              icon={<BookOpen className="h-5 w-5" />}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {offeringsQuery.data.items.map((offering) => (
                <Link
                  key={offering.id}
                  to={`/student/course-offerings/${offering.id}`}
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
