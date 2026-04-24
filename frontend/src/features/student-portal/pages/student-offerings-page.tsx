import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { listMyStudentOfferings } from "@/features/student-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTerm } from "@/lib/utils/format";

export function StudentOfferingsPage() {
  const query = useQuery({ queryKey: ["my-student-offerings"], queryFn: () => listMyStudentOfferings({ limit: 50, offset: 0 }) });
  if (query.isLoading) return <LoadingScreen label="Loading offerings..." />;
  if (query.isError || !query.data) return <ErrorState description="Student offerings could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student portal" title="My Course Offerings" description="View your currently enrolled offerings and open a quick detail page for each one." />
      {query.data.items.length === 0 ? (
        <EmptyState title="No course offerings yet" description="Your enrollments will appear here when an admin adds you to an offering." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data.items.map((offering) => (
            <Card key={offering.id} className="space-y-3">
              <div>
                <p className="text-lg font-semibold text-ink-950">{offering.course_code} — {offering.course_name}</p>
                <p className="text-sm text-slate-700">{formatTerm(offering.term)} {offering.year} • Section {offering.section}</p>
              </div>
              <Button variant="secondary" asChild>
                <Link to={`/student/course-offerings/${offering.id}`}>Open detail</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
