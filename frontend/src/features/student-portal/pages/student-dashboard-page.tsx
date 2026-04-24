import { useQuery } from "@tanstack/react-query";

import { getMyStudentProfile, listMyStudentOfferings } from "@/features/student-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card } from "@/components/ui/card";
import { formatTerm } from "@/lib/utils/format";

export function StudentDashboardPage() {
  const profileQuery = useQuery({ queryKey: ["my-student-profile"], queryFn: getMyStudentProfile });
  const offeringsQuery = useQuery({ queryKey: ["my-student-offerings"], queryFn: () => listMyStudentOfferings({ limit: 50, offset: 0 }) });

  if (profileQuery.isLoading || offeringsQuery.isLoading) return <LoadingScreen label="Loading student dashboard..." />;
  if (profileQuery.isError || offeringsQuery.isError || !profileQuery.data || !offeringsQuery.data) return <ErrorState description="Student dashboard could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student portal" title={`Welcome, ${profileQuery.data.first_name}`} description="Your profile and enrolled course offerings, kept intentionally simple." />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Current semester" value={profileQuery.data.current_semester} />
        <StatCard label="Department ID" value={profileQuery.data.department_id} />
        <StatCard label="Enrolled offerings" value={offeringsQuery.data.total} />
      </div>

      <Card className="space-y-4">
        <h3 className="text-xl font-semibold text-ink-950">My current enrollments</h3>
        {offeringsQuery.data.items.length === 0 ? (
          <EmptyState title="No enrollments yet" description="Your enrolled course offerings will appear here after an admin adds them." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {offeringsQuery.data.items.map((offering) => (
              <div key={offering.id} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-ink-950">{offering.course_code} — {offering.course_name}</p>
                <p className="mt-1 text-sm text-slate-700">{formatTerm(offering.term)} {offering.year} • Section {offering.section}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
