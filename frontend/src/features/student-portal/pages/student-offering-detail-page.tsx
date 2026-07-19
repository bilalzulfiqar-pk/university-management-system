import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { listMyStudentOfferings } from "@/features/student-portal/api";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { FactGrid } from "@/components/common/fact-grid";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTerm } from "@/lib/utils/format";

export function StudentOfferingDetailPage() {
  const params = useParams();
  const offeringId = Number(params.id);
  const query = useQuery({
    queryKey: ["my-student-offerings"],
    queryFn: () => listMyStudentOfferings({ limit: 50, offset: 0 }),
  });

  const offering = query.data?.items.find((item) => item.id === offeringId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student portal"
        title={offering ? `${offering.course_code} · ${formatTerm(offering.term)} ${offering.year}` : "Offering"}
        description="A read-only view of the enrolled offering tied to your own account."
      />

      {query.isLoading ? (
        <Skeleton className="h-48 w-full rounded-card" />
      ) : query.isError || !query.data ? (
        <ErrorState description="Course offering detail could not be loaded." onRetry={() => query.refetch()} />
      ) : !offering ? (
        <ErrorState description="This offering is not part of your current enrollments." />
      ) : (
        <Card>
          <CardTitle>{offering.course_name}</CardTitle>
          <CardDescription className="mt-1">
            {formatTerm(offering.term)} {offering.year} · Section {offering.section}
          </CardDescription>
          <div className="mt-5">
            <FactGrid
              facts={[
                { label: "Course code", value: offering.course_code, mono: true },
                { label: "Section", value: offering.section },
                {
                  label: "Capacity",
                  value: offering.capacity ? String(offering.capacity) : "No limit",
                },
                { label: "Assigned teachers", value: offering.teacher_ids.length },
                { label: "Enrolled students", value: offering.student_count },
                { label: "Last updated", value: formatDate(offering.updated_at) },
              ]}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
