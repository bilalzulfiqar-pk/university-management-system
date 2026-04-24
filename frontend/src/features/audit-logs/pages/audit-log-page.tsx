import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listAuditLogs } from "@/features/audit-logs/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils/format";

export function AuditLogPage() {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [offset, setOffset] = useState(0);

  const query = useQuery({
    queryKey: ["audit-logs", action, entityType, offset],
    queryFn: () =>
      listAuditLogs({
        action: action || undefined,
        entity_type: entityType || undefined,
        limit: 10,
        offset,
      }),
  });

  if (query.isLoading) return <LoadingScreen label="Loading audit history..." />;
  if (query.isError || !query.data) return <ErrorState description="Audit history could not be loaded." onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin audit history"
        title="Audit Logs"
        description="Readable backend-generated descriptions make this timeline ready for UI use without guessing from raw request paths."
      />

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Filter by action" value={action} onChange={(event) => setAction(event.target.value)} />
          <Input placeholder="Filter by entity type" value={entityType} onChange={(event) => setEntityType(event.target.value)} />
          <Select value="" disabled>
            <option>Recent admin events</option>
          </Select>
        </div>

        {query.data.items.length === 0 ? (
          <EmptyState title="No audit entries found" description="Admin write actions will appear here as soon as the system records them." />
        ) : (
          <>
            <div className="space-y-4">
              {query.data.items.map((entry) => (
                <div key={entry.id} className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-ink-950">{entry.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                        <span>{entry.action.replaceAll("_", " ")}</span>
                        <span>•</span>
                        <span>{entry.entity_type}</span>
                        <span>•</span>
                        <span>Status {entry.status_code}</span>
                        {entry.entity_label ? (
                          <>
                            <span>•</span>
                            <span>{entry.entity_label}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-700">
                      <p className="font-semibold">{entry.actor_role ?? "System"}</p>
                      <p>{formatDate(entry.created_at)}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{entry.method}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls total={query.data.total} limit={query.data.limit} offset={query.data.offset} onPageChange={setOffset} />
          </>
        )}
      </Card>
    </div>
  );
}
