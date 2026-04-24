import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { listDepartments } from "@/features/departments/api";
import { createCourse, getCourse, updateCourse } from "@/features/courses/api";
import { applyApiFormErrors } from "@/lib/api/form-errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/field";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";

const schema = z.object({
  name: z.string().min(1, "Course title is required."),
  code: z.string().min(2, "Course code is required."),
  credit_hours: z.coerce.number().min(1, "Credit hours must be at least 1."),
  department_id: z.coerce.number().min(1, "Select a department."),
});

type CourseValues = z.infer<typeof schema>;
type CourseInputValues = z.input<typeof schema>;

export function CourseFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const courseId = Number(params.id);
  const isEditing = Number.isFinite(courseId);

  const form = useForm<CourseInputValues, unknown, CourseValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      credit_hours: "3",
      department_id: "0",
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId, true),
    enabled: isEditing,
  });

  useEffect(() => {
    if (courseQuery.data) {
      form.reset({
        name: courseQuery.data.name,
        code: courseQuery.data.code,
        credit_hours: String(courseQuery.data.credit_hours),
        department_id: String(courseQuery.data.department_id),
      });
    }
  }, [courseQuery.data, form]);

  const mutation = useMutation({
    mutationFn: (values: CourseValues) => (isEditing ? updateCourse(courseId, values) : createCourse(values)),
    onSuccess: () => {
      toast.success(`Course ${isEditing ? "updated" : "created"} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate("/admin/courses");
    },
    onError: (error) => {
      const handled = applyApiFormErrors(error, form.setError);
      if (!handled) {
        form.setError("root", { message: error instanceof Error ? error.message : "Course save failed." });
      }
    },
  });

  if (departmentsQuery.isLoading || (isEditing && courseQuery.isLoading)) return <LoadingScreen label="Loading form..." />;
  if (departmentsQuery.isError || (isEditing && courseQuery.isError)) return <ErrorState description="Course form data could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course form"
        title={isEditing ? "Edit Course" : "Create Course"}
        description="Create the reusable catalog entry first, then turn it into term-specific offerings."
      />

      <Card className="max-w-4xl">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Field label="Course title" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Course code" error={form.formState.errors.code?.message}>
            <Input {...form.register("code")} />
          </Field>
          <Field label="Credit hours" error={form.formState.errors.credit_hours?.message}>
            <Input type="number" min={1} {...form.register("credit_hours")} />
          </Field>
          <Field label="Department" error={form.formState.errors.department_id?.message}>
            <Select {...form.register("department_id")}>
              <option value={0}>Select department</option>
              {departmentsQuery.data?.items.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="md:col-span-2">
            {form.formState.errors.root?.message ? (
              <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-danger-500">
                {form.formState.errors.root.message}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create course"}
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/admin/courses">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
