import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { createDepartment, getDepartment, updateDepartment } from "@/features/departments/api";
import { applyApiFormErrors } from "@/lib/api/form-errors";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { FormActions, FormCard, FormErrorBanner } from "@/components/forms/form-card";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Department form"
        title={isEditing ? "Edit Department" : "Create Department"}
        description="Keep department setup short and consistent so courses and users map cleanly."
      />

      {isEditing && query.isLoading ? (
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isEditing && query.isError ? (
        <ErrorState description="Department details could not be loaded." onRetry={() => query.refetch()} />
      ) : (
        <FormCard
          title={isEditing ? "Department details" : "New department"}
          description="Departments organize students, teachers, and courses."
          backTo="/admin/departments"
          className="max-w-3xl"
        >
          <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <Field label="Department name" error={form.formState.errors.name?.message} required>
              <Input placeholder="Computer Science" invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
            </Field>

            <Field
              label="Department code"
              hint="Stored uppercase by the backend"
              error={form.formState.errors.code?.message}
              required
            >
              <Input
                placeholder="CS"
                invalid={Boolean(form.formState.errors.code)}
                {...form.register("code")}
              />
            </Field>

            <FormErrorBanner message={form.formState.errors.root?.message} />

            <FormActions
              submitLabel={isEditing ? "Save changes" : "Create department"}
              pending={mutation.isPending}
              cancelTo="/admin/departments"
            />
          </form>
        </FormCard>
      )}
    </div>
  );
}
