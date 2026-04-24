import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { listMyStudentOfferings } from "@/features/student-portal/api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { formatDate, formatTerm } from "@/lib/utils/format";

export function StudentOfferingDetailPage() {
  const params = useParams();
  const offeringId = Number(params.id);
  const query = useQuery({ queryKey: ["my-student-offerings"], queryFn: () => listMyStudentOfferings({ limit: 50, offset: 0 }) });

  if (query.isLoading) return <LoadingScreen label="Loading course offering..." />;
  if (query.isError || !query.data) return <ErrorState description="Course offering detail could not be loaded." />;

  const offering = query.data.items.find((item) => item.id === offeringId);
  if (!offering) return <ErrorState description="This offering is not part of your current enrollments." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student portal"
        title={`${offering.course_code} • ${formatTerm(offering.term)} ${offering.year}`}
        description="A simple read-only view of the enrolled offering tied to your own account."
      />
      <Card className="grid gap-4 md:grid-cols-2">
        <DetailRow label="Course" value={`${offering.course_code} - ${offering.course_name}`} />
        <DetailRow label="Section" value={offering.section} />
        <DetailRow label="Capacity" value={offering.capacity ? String(offering.capacity) : "No capacity set"} />
        <DetailRow label="Assigned teachers" value={String(offering.teacher_ids.length)} />
        <DetailRow label="Student count" value={String(offering.student_count)} />
        <DetailRow label="Updated" value={formatDate(offering.updated_at)} />
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink-950">{value}</p>
    </div>
  );
}
