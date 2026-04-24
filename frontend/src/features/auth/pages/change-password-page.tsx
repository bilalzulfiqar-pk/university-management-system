import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/use-auth";
import { changePassword } from "@/features/auth/api";
import { applyApiFormErrors } from "@/lib/api/form-errors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { getRoleHome } from "@/lib/constants/navigation";

const schema = z
  .object({
    current_password: z.string().min(8, "Current password must be at least 8 characters."),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .regex(/[A-Z]/, "New password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "New password must contain at least one lowercase letter.")
      .regex(/\d/, "New password must contain at least one digit.")
      .regex(/[^A-Za-z0-9]/, "New password must contain at least one special character."),
    confirm_password: z.string().min(8, "Confirm your new password."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

type ChangePasswordValues = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, refreshUser, setMustChangePassword } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      setMustChangePassword(false);
      const refreshed = await refreshUser();
      toast.success("Password updated successfully.");
      if (refreshed) {
        navigate(getRoleHome(refreshed.role), { replace: true });
      }
    } catch (error) {
      const handled = applyApiFormErrors(error, setError);
      if (!handled) {
        setError("root", { message: error instanceof Error ? error.message : "Password change failed." });
      }
    }
  });

  return (
    <Card className="mx-auto max-w-xl space-y-7 p-8">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-700">First login protection</p>
        <h2 className="text-3xl font-semibold tracking-tight text-ink-950">Change your password to continue</h2>
        <p className="text-sm leading-6 text-slate-700">
          {user?.role === "ADMIN"
            ? "Use this page whenever you want to rotate your password."
            : "Your admin assigned a temporary password. Set a personal one before you can access the rest of the app."}
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <Field label="Current password" error={errors.current_password?.message}>
          <Input type="password" autoComplete="current-password" {...register("current_password")} />
        </Field>

        <Field
          label="New password"
          hint="Use at least 8 characters, including upper, lower, number, and symbol."
          error={errors.new_password?.message}
        >
          <Input type="password" autoComplete="new-password" {...register("new_password")} />
        </Field>

        <Field label="Confirm new password" error={errors.confirm_password?.message}>
          <Input type="password" autoComplete="new-password" {...register("confirm_password")} />
        </Field>

        {errors.root?.message ? (
          <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-danger-500">
            {errors.root.message}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating password..." : "Save new password"}
        </Button>
      </form>
    </Card>
  );
}
