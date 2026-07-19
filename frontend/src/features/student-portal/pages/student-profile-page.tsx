import { useQuery } from "@tanstack/react-query";

import { getMyStudentProfile } from "@/features/student-portal/api";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { FactGrid } from "@/components/common/fact-grid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fullName } from "@/lib/utils/format";

export function StudentProfilePage() {
  const query = useQuery({ queryKey: ["my-student-profile"], queryFn: getMyStudentProfile });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student profile"
        title="My Profile"
        description="Your personal details, department, and semester from the backend."
      />

      {query.isLoading ? (
        <Skeleton className="h-56 w-full rounded-card" />
      ) : query.isError || !query.data ? (
        <ErrorState description="Student profile could not be loaded." onRetry={() => query.refetch()} />
      ) : (
        <Card>
          <div className="flex items-center gap-4 border-b border-slate-200/80 pb-5">
            <Avatar name={fullName(query.data.first_name, query.data.last_name)} seed={query.data.email} size="lg" />
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">
                {fullName(query.data.first_name, query.data.last_name)}
              </p>
              <p className="text-sm text-slate-500">{query.data.email}</p>
              <Badge variant={query.data.is_active ? "success" : "danger"} dot className="mt-2">
                {query.data.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="mt-5">
            <FactGrid
              facts={[
                { label: "Roll number", value: query.data.roll_number, mono: true },
                { label: "Department", value: query.data.department_name ?? `#${query.data.department_id}` },
                { label: "Current semester", value: query.data.current_semester },
                { label: "Email", value: query.data.email },
                { label: "Password change required", value: query.data.must_change_password ? "Yes" : "No" },
              ]}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
