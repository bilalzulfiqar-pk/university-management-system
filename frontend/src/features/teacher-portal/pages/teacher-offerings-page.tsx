import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, UsersRound } from "lucide-react";

import { listMyTeacherOfferings } from "@/features/teacher-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import { formatTerm } from "@/lib/utils/format";

export function TeacherOfferingsPage() {
  const query = useQuery({
    queryKey: ["my-teacher-offerings"],
    queryFn: () => listMyTeacherOfferings({ limit: 50, offset: 0 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher workspace"
        title="My Course Offerings"
        description="Open an offering to view the roster your backend allows you to see."
      />

      {query.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : query.isError || !query.data ? (
        <ErrorState description="Teacher offerings could not be loaded." onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title="No offerings assigned"
          description="Assigned offerings will appear here as soon as an admin maps them to your account."
          icon={<BookOpen className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data.items.map((offering) => (
            <Link
              key={offering.id}
              to={`/teacher/course-offerings/${offering.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-ink-900">
                    {offering.course_code} · {offering.course_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatTerm(offering.term)} {offering.year} · Section {offering.section}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-smooth group-hover:translate-x-0.5 group-hover:text-ink-700" />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-ink-700">
                <UsersRound className="h-3.5 w-3.5 text-slate-400" />
                {offering.student_count} students enrolled
              </div>
            </Link>
          ))}
        </div>
      )}

      {query.data && query.data.items.length > 0 ? (
        <div className="flex items-center justify-end">
          <Badge variant="neutral">{query.data.total} total</Badge>
        </div>
      ) : null}
    </div>
  );
}
