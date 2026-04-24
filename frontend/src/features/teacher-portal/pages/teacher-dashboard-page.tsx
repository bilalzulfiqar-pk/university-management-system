import { useQuery } from "@tanstack/react-query";

import { listMyTeacherOfferings, getMyTeacherProfile } from "@/features/teacher-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card } from "@/components/ui/card";
import { formatTerm } from "@/lib/utils/format";

export function TeacherDashboardPage() {
  const profileQuery = useQuery({ queryKey: ["my-teacher-profile"], queryFn: getMyTeacherProfile });
  const offeringsQuery = useQuery({ queryKey: ["my-teacher-offerings"], queryFn: () => listMyTeacherOfferings({ limit: 20, offset: 0 }) });

  if (profileQuery.isLoading || offeringsQuery.isLoading) return <LoadingScreen label="Loading teacher dashboard..." />;
  if (profileQuery.isError || offeringsQuery.isError || !profileQuery.data || !offeringsQuery.data) {
    return <ErrorState description="Teacher dashboard could not be loaded." />;
  }

  const totalStudents = offeringsQuery.data.items.reduce((sum, offering) => sum + offering.student_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher workspace"
        title={`Welcome, ${profileQuery.data.first_name}`}
        description="Stay focused on the offerings assigned to you and the students inside them."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned offerings" value={offeringsQuery.data.total} />
        <StatCard label="Students across offerings" value={totalStudents} />
        <StatCard label="Department" value={`#${profileQuery.data.department_id}`} />
      </div>

      <Card className="space-y-4">
        <h3 className="text-xl font-semibold text-ink-950">Current offerings</h3>
        {offeringsQuery.data.items.length === 0 ? (
          <EmptyState title="No offerings assigned yet" description="Once an admin assigns you to a course offering, it will appear here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {offeringsQuery.data.items.map((offering) => (
              <div key={offering.id} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-ink-950">{offering.course_code} - {offering.course_name}</p>
                <p className="mt-1 text-sm text-slate-700">{formatTerm(offering.term)} {offering.year} • Section {offering.section}</p>
                <p className="mt-2 text-sm font-medium text-ink-800">{offering.student_count} students enrolled</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
