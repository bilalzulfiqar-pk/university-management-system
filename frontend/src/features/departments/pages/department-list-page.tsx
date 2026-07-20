import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Building2, Pencil, Plus, Search } from "lucide-react";

import { archiveDepartment, listDepartments } from "@/features/departments/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { ListPanel } from "@/components/common/list-panel";
import { MobileRecordCard } from "@/components/common/mobile-record-card";
import { StatusPill } from "@/components/common/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, Td, Th, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";

const STATUS_FILTERS = [
  { value: "ACTIVE", label: "Active only" },
  { value: "ARCHIVED", label: "Archived only" },
  { value: "ALL", label: "All records" },
] as const;

export function DepartmentListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("ACTIVE");
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ["departments", appliedSearch, statusFilter, offset],
    queryFn: () =>
      listDepartments({
        search: appliedSearch,
        include_deleted: statusFilter !== "ACTIVE",
        limit: 10,
        offset,
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveDepartment,
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Department archive failed."),
  });

  const visibleDepartments =
    statusFilter === "ARCHIVED"
      ? query.data?.items.filter((department) => Boolean(department.deleted_at)) ?? []
      : statusFilter === "ALL"
        ? query.data?.items ?? []
        : query.data?.items.filter((department) => !department.deleted_at) ?? [];

  const selectedDepartment = query.data?.items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Departments"
        description="Set up the academic structure that students, teachers, and courses depend on."
        actions={
          <Button asChild>
            <Link to="/admin/departments/new">
              <Plus className="h-4 w-4" />
              Create department
            </Link>
          </Button>
        }
      />

      <ListPanel
        filters={
          <form
            className="grid gap-3 lg:grid-cols-[2fr_auto_auto] lg:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              setOffset(0);
              setAppliedSearch(search.trim());
            }}
          >
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or code"
              leadingIcon={<Search className="h-4 w-4" />}
            />
            <Button variant="secondary" type="submit">
              Apply filters
            </Button>
            <Select
              className="lg:max-w-[200px]"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as (typeof STATUS_FILTERS)[number]["value"])
              }
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </form>
        }
      >
        {query.isLoading ? (
          <SkeletonTable rows={6} columns={5} />
        ) : query.isError || !query.data ? (
          <ErrorState description="Departments could not be loaded." onRetry={() => query.refetch()} />
        ) : visibleDepartments.length === 0 ? (
          <EmptyState
            title="No departments found"
            description={
              statusFilter === "ARCHIVED"
                ? "No archived departments match the current filters."
                : "Create your first department to begin organizing students, teachers, and courses."
            }
            icon={<Building2 className="h-5 w-5" />}
            action={
              <Button asChild size="sm">
                <Link to="/admin/departments/new">Create department</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <Table>
                <TableHead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Code</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {visibleDepartments.map((department) => {
                    const actions: RowAction[] = department.deleted_at
                      ? []
                      : [
                          {
                            label: "Archive",
                            icon: <Archive />,
                            destructive: true,
                            onSelect: () => setSelectedId(department.id),
                          },
                        ];

                    return (
                      <TableRow key={department.id}>
                        <Td className="font-semibold text-ink-900">{department.name}</Td>
                        <Td>
                          <Badge variant="ink" className="font-mono">
                            {department.code}
                          </Badge>
                        </Td>
                        <Td>
                          <StatusPill archived={Boolean(department.deleted_at)} />
                        </Td>
                        <Td className="text-slate-500">{formatDate(department.updated_at)}</Td>
                        <Td align="right">
                          <RowActions
                            actions={actions}
                            primaryAction={
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/admin/departments/${department.id}/edit`}>Edit</Link>
                              </Button>
                            }
                          />
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {visibleDepartments.map((department) => {
                const actions: RowAction[] = department.deleted_at
                  ? []
                  : [
                      {
                        label: "Archive",
                        icon: <Archive />,
                        destructive: true,
                        onSelect: () => setSelectedId(department.id),
                      },
                    ];

                return (
                  <MobileRecordCard
                    key={department.id}
                    title={department.name}
                    badges={
                      <>
                        <Badge variant="ink" className="font-mono">
                          {department.code}
                        </Badge>
                        <StatusPill archived={Boolean(department.deleted_at)} />
                      </>
                    }
                    fields={[{ label: "Updated", value: formatDate(department.updated_at) }]}
                    actions={
                      <RowActions
                        actions={actions}
                        primaryAction={
                          <Button variant="ghost" size="icon-sm" asChild aria-label="Edit department">
                            <Link to={`/admin/departments/${department.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        }
                      />
                    }
                  />
                );
              })}
            </div>

            <PaginationControls
              total={query.data.total}
              limit={query.data.limit}
              offset={query.data.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </ListPanel>

      <Dialog
        open={Boolean(selectedDepartment)}
        title="Archive department?"
        description="This removes the department from normal admin lists. The backend will block the action if active records still depend on it."
        confirmLabel="Archive department"
        destructive
        pending={archiveMutation.isPending}
        onClose={() => setSelectedId(null)}
        onConfirm={() => {
          if (selectedId) archiveMutation.mutate(selectedId);
        }}
      />
    </div>
  );
}
