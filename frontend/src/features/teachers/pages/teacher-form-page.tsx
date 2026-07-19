import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { listDepartments } from "@/features/departments/api";
import { createTeacher, getTeacher, updateTeacher } from "@/features/teachers/api";
import { applyApiFormErrors } from "@/lib/api/form-errors";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/field";
import { FormActions, FormCard, FormErrorBanner, FormToggle } from "@/components/forms/form-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  temporary_password: z.string().optional(),
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  employee_id: z.string().min(2, "Employee ID is required."),
  department_id: z.coerce.number().min(1, "Select a department."),
  is_active: z.boolean(),
});

type TeacherValues = z.infer<typeof schema>;
type TeacherInputValues = z.input<typeof schema>;

export function TeacherFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const teacherId = Number(params.id);
  const isEditing = Number.isFinite(teacherId);

  const form = useForm<TeacherInputValues, unknown, TeacherValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      temporary_password: "",
      first_name: "",
      last_name: "",
      employee_id: "",
      department_id: "0",
      is_active: true,
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const teacherQuery = useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: () => getTeacher(teacherId, true),
    enabled: isEditing,
  });

  useEffect(() => {
    if (teacherQuery.data) {
      form.reset({
        email: teacherQuery.data.email,
        temporary_password: "",
        first_name: teacherQuery.data.first_name,
        last_name: teacherQuery.data.last_name,
        employee_id: teacherQuery.data.employee_id,
        department_id: String(teacherQuery.data.department_id),
        is_active: teacherQuery.data.is_active,
      });
    }
  }, [teacherQuery.data, form]);

  const isActive = useWatch({ control: form.control, name: "is_active" });

  const mutation = useMutation({
    mutationFn: async (values: TeacherValues) => {
      const payload = {
        ...values,
        temporary_password: values.temporary_password?.trim() || undefined,
      };
      if (!isEditing && !payload.temporary_password) {
        throw new Error("Temporary password is required when creating a teacher.");
      }
      return isEditing ? updateTeacher(teacherId, payload) : createTeacher(payload as Required<typeof payload>);
    },
    onSuccess: () => {
      toast.success(`Teacher ${isEditing ? "updated" : "created"} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      navigate("/admin/teachers");
    },
    onError: (error) => {
      const handled = applyApiFormErrors(error, form.setError);
      if (!handled) {
        form.setError("root", { message: error instanceof Error ? error.message : "Teacher save failed." });
      }
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher form"
        title={isEditing ? "Edit Teacher" : "Create Teacher"}
        description="Teacher accounts follow the same temporary-password first-login flow as student accounts."
      />

      {departmentsQuery.isLoading || (isEditing && teacherQuery.isLoading) ? (
        <div className="max-w-4xl grid gap-4 md:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : departmentsQuery.isError || (isEditing && teacherQuery.isError) ? (
        <ErrorState description="Teacher form data could not be loaded." />
      ) : (
        <FormCard
          title={isEditing ? "Teacher details" : "New teacher"}
          description="Faculty account linked to a department."
          backTo="/admin/teachers"
        >
          <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="First name" error={form.formState.errors.first_name?.message} required>
                <Input placeholder="Imran" {...form.register("first_name")} />
              </Field>

              <Field label="Last name" error={form.formState.errors.last_name?.message} required>
                <Input placeholder="Ahmed" {...form.register("last_name")} />
              </Field>

              <Field label="Email address" error={form.formState.errors.email?.message} required>
                <Input type="email" placeholder="teacher@university.edu" {...form.register("email")} />
              </Field>

              <Field
                label="Employee ID"
                hint="Unique across the workspace"
                error={form.formState.errors.employee_id?.message}
                required
              >
                <Input placeholder="EMP-001" {...form.register("employee_id")} />
              </Field>

              <Field label="Department" error={form.formState.errors.department_id?.message} required>
                <Select {...form.register("department_id")}>
                  <option value={0}>Select department</option>
                  {departmentsQuery.data?.items.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Temporary password"
                hint={isEditing ? "Leave blank to keep the existing password." : "Required for first login."}
                error={form.formState.errors.temporary_password?.message}
              >
                <Input
                  type="password"
                  placeholder={isEditing ? "••••••••" : "Set a temporary password"}
                  {...form.register("temporary_password")}
                />
              </Field>
            </div>

            <FormToggle
              label="Account active"
              description="Inactive accounts cannot sign in."
              checked={isActive}
              onChange={(next) => form.setValue("is_active", next, { shouldDirty: true })}
            />

            <FormErrorBanner message={form.formState.errors.root?.message} />

            <FormActions
              submitLabel={isEditing ? "Save changes" : "Create teacher"}
              pending={mutation.isPending}
              cancelTo="/admin/teachers"
            />
          </form>
        </FormCard>
      )}
    </div>
  );
}
