import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { archiveDepartment, listDepartments } from "@/features/departments/api";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { StatusPill } from "@/components/common/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableHead, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";

export function DepartmentListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [offset, setOffset] = useState(0);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ["departments", appliedSearch, statusFilter, offset],
    queryFn: () => listDepartments({ search: appliedSearch, include_deleted: statusFilter !== "ACTIVE", limit: 10, offset }),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveDepartment,
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedDepartmentId(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Department archive failed."),
  });

  if (query.isLoading) return <LoadingScreen label="Loading departments..." />;
  if (query.isError || !query.data) return <ErrorState description="Departments could not be loaded." onRetry={() => query.refetch()} />;

  const visibleDepartments =
    statusFilter === "ARCHIVED"
      ? query.data.items.filter((department) => Boolean(department.deleted_at))
      : statusFilter === "ALL"
        ? query.data.items
        : query.data.items.filter((department) => !department.deleted_at);

  const selectedDepartment = query.data.items.find((item) => item.id === selectedDepartmentId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Departments"
        description="Set up the academic structure that students, teachers, and courses depend on."
        actions={
          <Button asChild>
            <Link to="/admin/departments/new">Create department</Link>
          </Button>
        }
      />

      <Card className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[2fr_auto_1fr] xl:items-center">
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              setOffset(0);
              setAppliedSearch(search.trim());
            }}
          >
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or code" />
            <Button variant="secondary" type="submit">
              Apply filters
            </Button>
          </form>
          <Select className="lg:max-w-[220px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ACTIVE" | "ARCHIVED" | "ALL")}>
            <option value="ACTIVE">Active only</option>
            <option value="ARCHIVED">Archived only</option>
            <option value="ALL">All records</option>
          </Select>
        </div>

        <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-ink-950">Archived department behavior</p>
          <p className="mt-1 text-sm text-slate-700">
            Departments are soft-delete only in this MVP. Archived departments can be reviewed here, but restore is not available from the backend yet.
          </p>
        </div>

        {visibleDepartments.length === 0 ? (
          <EmptyState
            title="No departments found"
            description={
              statusFilter === "ARCHIVED"
                ? "No archived departments match the current filters."
                : "Create your first department to begin organizing students, teachers, and courses."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[16px] border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Code</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {visibleDepartments.map((department) => (
                    <tr key={department.id}>
                      <Td className="font-semibold">{department.name}</Td>
                      <Td>{department.code}</Td>
                      <Td>
                        <StatusPill archived={Boolean(department.deleted_at)} />
                      </Td>
                      <Td>{formatDate(department.updated_at)}</Td>
                      <Td className="min-w-[240px] text-right">
                        <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                          <Button variant="secondary" size="sm" asChild>
                            <Link to={`/admin/departments/${department.id}/edit`}>Edit</Link>
                          </Button>
                          {!department.deleted_at ? (
                            <Button variant="danger" size="sm" onClick={() => setSelectedDepartmentId(department.id)}>
                              Archive
                            </Button>
                          ) : (
                            <Badge variant="warning">Soft-delete only</Badge>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            <PaginationControls total={query.data.total} limit={query.data.limit} offset={query.data.offset} onPageChange={setOffset} />
          </>
        )}
      </Card>

      <Dialog
        open={Boolean(selectedDepartment)}
        title="Archive department?"
        description="This removes the department from normal admin lists. The backend will block the action if active records still depend on it."
        confirmLabel="Archive department"
        destructive
        pending={archiveMutation.isPending}
        onClose={() => setSelectedDepartmentId(null)}
        onConfirm={() => {
          if (selectedDepartmentId) archiveMutation.mutate(selectedDepartmentId);
        }}
      />
    </div>
  );
}
