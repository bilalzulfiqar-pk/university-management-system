import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { createDepartment, getDepartment, updateDepartment } from "@/features/departments/api";
import { applyApiFormErrors } from "@/lib/api/form-errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";

const schema = z.object({
  name: z.string().min(1, "Department name is required."),
  code: z
    .string()
    .min(2, "Department code is required.")
    .regex(/^[A-Za-z0-9-]+$/, "Department code can contain only letters, numbers, and hyphens."),
});

type DepartmentValues = z.infer<typeof schema>;

export function DepartmentFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const departmentId = Number(params.id);
  const isEditing = Number.isFinite(departmentId);

  const form = useForm<DepartmentValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "" },
  });

  const query = useQuery({
    queryKey: ["department", departmentId],
    queryFn: () => getDepartment(departmentId, true),
    enabled: isEditing,
  });

  useEffect(() => {
    if (query.data) {
      form.reset({ name: query.data.name, code: query.data.code });
    }
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: (values: DepartmentValues) =>
      isEditing ? updateDepartment(departmentId, values) : createDepartment(values),
    onSuccess: () => {
      toast.success(`Department ${isEditing ? "updated" : "created"} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      navigate("/admin/departments");
    },
    onError: (error) => {
      const handled = applyApiFormErrors(error, form.setError);
      if (!handled) {
        form.setError("root", { message: error instanceof Error ? error.message : "Department save failed." });
      }
    },
  });

  if (isEditing && query.isLoading) return <LoadingScreen label="Loading department..." />;
  if (isEditing && query.isError) return <ErrorState description="Department details could not be loaded." onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Department form"
        title={isEditing ? "Edit Department" : "Create Department"}
        description="Keep department setup short and consistent so courses and users map cleanly."
      />

      <Card className="max-w-3xl">
        <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Field label="Department name" error={form.formState.errors.name?.message}>
            <Input placeholder="Computer Science" {...form.register("name")} />
          </Field>

          <Field label="Department code" hint="Stored uppercase by the backend" error={form.formState.errors.code?.message}>
            <Input placeholder="CS" {...form.register("code")} />
          </Field>

          {form.formState.errors.root?.message ? (
            <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-danger-500">
              {form.formState.errors.root.message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create department"}
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/admin/departments">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
