import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { listDepartments } from "@/features/departments/api";
import { createStudent, getStudent, updateStudent } from "@/features/students/api";
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
  roll_number: z.string().min(2, "Roll number is required."),
  department_id: z.coerce.number().min(1, "Select a department."),
  current_semester: z.coerce.number().min(1).max(12),
  is_active: z.boolean(),
});

type StudentValues = z.infer<typeof schema>;
type StudentInputValues = z.input<typeof schema>;

export function StudentFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentId = Number(params.id);
  const isEditing = Number.isFinite(studentId);

  const form = useForm<StudentInputValues, unknown, StudentValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      temporary_password: "",
      first_name: "",
      last_name: "",
      roll_number: "",
      department_id: "0",
      current_semester: "1",
      is_active: true,
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudent(studentId, true),
    enabled: isEditing,
  });

  useEffect(() => {
    if (studentQuery.data) {
      form.reset({
        email: studentQuery.data.email,
        temporary_password: "",
        first_name: studentQuery.data.first_name,
        last_name: studentQuery.data.last_name,
        roll_number: studentQuery.data.roll_number,
        department_id: String(studentQuery.data.department_id),
        current_semester: String(studentQuery.data.current_semester),
        is_active: studentQuery.data.is_active,
      });
    }
  }, [studentQuery.data, form]);

  const isActive = useWatch({ control: form.control, name: "is_active" });

  const mutation = useMutation({
    mutationFn: async (values: StudentValues) => {
      const payload = {
        ...values,
        temporary_password: values.temporary_password?.trim() || undefined,
      };
      if (!isEditing && !payload.temporary_password) {
        throw new Error("Temporary password is required when creating a student.");
      }
      return isEditing ? updateStudent(studentId, payload) : createStudent(payload as Required<typeof payload>);
    },
    onSuccess: () => {
      toast.success(`Student ${isEditing ? "updated" : "created"} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate("/admin/students");
    },
    onError: (error) => {
      const handled = applyApiFormErrors(error, form.setError);
      if (!handled) {
        form.setError("root", { message: error instanceof Error ? error.message : "Student save failed." });
      }
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student form"
        title={isEditing ? "Edit Student" : "Create Student"}
        description="Admin-created students receive a temporary password and must change it on first login."
      />

      {departmentsQuery.isLoading || (isEditing && studentQuery.isLoading) ? (
        <div className="max-w-4xl grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : departmentsQuery.isError || (isEditing && studentQuery.isError) ? (
        <ErrorState description="Student form data could not be loaded." />
      ) : (
        <FormCard
          title={isEditing ? "Student details" : "New student"}
          description="Admin-created students receive a temporary password and must change it on first login."
          backTo="/admin/students"
        >
          <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="First name" error={form.formState.errors.first_name?.message} required>
                <Input placeholder="Ayesha" {...form.register("first_name")} />
              </Field>

              <Field label="Last name" error={form.formState.errors.last_name?.message} required>
                <Input placeholder="Khan" {...form.register("last_name")} />
              </Field>

              <Field label="Email address" error={form.formState.errors.email?.message} required>
                <Input type="email" placeholder="student@university.edu" {...form.register("email")} />
              </Field>

              <Field
                label="Roll number"
                hint="Unique across the workspace"
                error={form.formState.errors.roll_number?.message}
                required
              >
                <Input placeholder="FA22-BSCS-001" {...form.register("roll_number")} />
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

              <Field label="Current semester" error={form.formState.errors.current_semester?.message} required>
                <Select {...form.register("current_semester")}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      Semester {value}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Temporary password"
                hint={isEditing ? "Leave blank to keep the existing password." : "Required for first login."}
                error={form.formState.errors.temporary_password?.message}
                className="md:col-span-2"
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
              submitLabel={isEditing ? "Save changes" : "Create student"}
              pending={mutation.isPending}
              cancelTo="/admin/students"
            />
          </form>
        </FormCard>
      )}
    </div>
  );
}
