import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { listMyTeacherOfferings } from "@/features/teacher-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTerm } from "@/lib/utils/format";

export function TeacherOfferingsPage() {
  const query = useQuery({ queryKey: ["my-teacher-offerings"], queryFn: () => listMyTeacherOfferings({ limit: 50, offset: 0 }) });
  if (query.isLoading) return <LoadingScreen label="Loading offerings..." />;
  if (query.isError || !query.data) return <ErrorState description="Teacher offerings could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher workspace" title="My Course Offerings" description="Open an offering to view the roster your backend allows you to see." />
      {query.data.items.length === 0 ? (
        <EmptyState title="No offerings assigned" description="Assigned offerings will appear here as soon as an admin maps them to your account." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data.items.map((offering) => (
            <Card key={offering.id} className="space-y-3">
              <div>
                <p className="text-lg font-semibold text-ink-950">{offering.course_code} - {offering.course_name}</p>
                <p className="text-sm text-slate-700">{formatTerm(offering.term)} {offering.year} • Section {offering.section}</p>
              </div>
              <p className="text-sm font-medium text-ink-800">{offering.student_count} students enrolled</p>
              <Button variant="secondary" asChild>
                <Link to={`/teacher/course-offerings/${offering.id}`}>View roster</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
