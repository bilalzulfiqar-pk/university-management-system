import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { listCourses } from "@/features/courses/api";
import { createOffering, getOffering, updateOffering } from "@/features/offerings/api";
import { academicTerms } from "@/lib/constants/options";
import { applyApiFormErrors } from "@/lib/api/form-errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/field";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import type { AcademicTerm } from "@/lib/api/types";

const schema = z.object({
  course_id: z.coerce.number().min(1, "Select a course."),
  term: z.enum(academicTerms as [AcademicTerm, ...AcademicTerm[]]),
  year: z.coerce.number().min(2000).max(2100),
  section: z.string().min(1, "Section is required."),
  capacity: z.union([z.literal(""), z.coerce.number().min(1)]).optional(),
});

type OfferingValues = z.infer<typeof schema>;
type OfferingInputValues = z.input<typeof schema>;

export function OfferingFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const offeringId = Number(params.id);
  const isEditing = Number.isFinite(offeringId);

  const form = useForm<OfferingInputValues, unknown, OfferingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      course_id: "0",
      term: "FALL",
      year: String(new Date().getFullYear()),
      section: "A",
      capacity: "",
    },
  });

  const coursesQuery = useQuery({
    queryKey: ["courses-options"],
    queryFn: () => listCourses({ limit: 100, offset: 0 }),
  });

  const offeringQuery = useQuery({
    queryKey: ["offering", offeringId],
    queryFn: () => getOffering(offeringId, true),
    enabled: isEditing,
  });

  useEffect(() => {
    if (offeringQuery.data) {
      form.reset({
        course_id: String(offeringQuery.data.course_id),
        term: offeringQuery.data.term,
        year: String(offeringQuery.data.year),
        section: offeringQuery.data.section,
        capacity: offeringQuery.data.capacity ? String(offeringQuery.data.capacity) : "",
      });
    }
  }, [offeringQuery.data, form]);

  const mutation = useMutation({
    mutationFn: (values: OfferingValues) => {
      const payload = {
        course_id: values.course_id,
        term: values.term,
        year: values.year,
        section: values.section,
        capacity: values.capacity === "" ? null : Number(values.capacity),
      };
      return isEditing ? updateOffering(offeringId, payload) : createOffering(payload);
    },
    onSuccess: (offering) => {
      toast.success(`Course offering ${isEditing ? "updated" : "created"} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
      navigate(`/admin/course-offerings/${offering.id}`);
    },
    onError: (error) => {
      const handled = applyApiFormErrors(error, form.setError);
      if (!handled) {
        form.setError("root", { message: error instanceof Error ? error.message : "Offering save failed." });
      }
    },
  });

  if (coursesQuery.isLoading || (isEditing && offeringQuery.isLoading)) return <LoadingScreen label="Loading form..." />;
  if (coursesQuery.isError || (isEditing && offeringQuery.isError)) return <ErrorState description="Offering form data could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Offering form"
        title={isEditing ? "Edit Course Offering" : "Create Course Offering"}
        description="Tie a course to a term, year, and section so teachers and students can interact with the right academic instance."
      />

      <Card className="max-w-4xl">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Field label="Course" error={form.formState.errors.course_id?.message}>
            <Select {...form.register("course_id")}>
              <option value={0}>Select course</option>
              {coursesQuery.data?.items.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Term" error={form.formState.errors.term?.message}>
            <Select {...form.register("term")}>
              {academicTerms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year" error={form.formState.errors.year?.message}>
            <Input type="number" min={2000} max={2100} {...form.register("year")} />
          </Field>
          <Field label="Section" error={form.formState.errors.section?.message}>
            <Input {...form.register("section")} />
          </Field>
          <Field label="Capacity" hint="Optional" error={form.formState.errors.capacity?.message}>
            <Input type="number" min={1} {...form.register("capacity")} />
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
              {mutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create offering"}
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/admin/course-offerings">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
