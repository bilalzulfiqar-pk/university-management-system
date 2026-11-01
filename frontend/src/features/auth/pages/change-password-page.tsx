import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound } from "lucide-react";
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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
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
    <Card className="space-y-6 p-5 sm:space-y-7 sm:p-7 md:p-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-warning-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-warning-700 ring-1 ring-inset ring-warning-200">
          <KeyRound className="h-3.5 w-3.5" />
          First login protection
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
          Change your password to continue
        </h1>
        <p className="text-sm leading-relaxed text-slate-500">
          {user?.role === "ADMIN"
            ? "Use this page whenever you want to rotate your password."
            : "Your admin assigned a temporary password. Set a personal one before you can access the rest of the app."}
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <Field label="Current password" error={errors.current_password?.message}>
          <Input
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            invalid={Boolean(errors.current_password)}
            trailingSlot={
              <button
                type="button"
                tabIndex={-1}
                aria-label={showCurrent ? "Hide password" : "Show password"}
                className="rounded p-1.5 text-slate-400 transition-smooth hover:text-ink-700"
                onClick={() => setShowCurrent((value) => !value)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register("current_password")}
          />
        </Field>

        <Field
          label="New password"
          hint="8+ chars, upper, lower, number, symbol"
          error={errors.new_password?.message}
        >
          <Input
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            invalid={Boolean(errors.new_password)}
            trailingSlot={
              <button
                type="button"
                tabIndex={-1}
                aria-label={showNew ? "Hide password" : "Show password"}
                className="rounded p-1.5 text-slate-400 transition-smooth hover:text-ink-700"
                onClick={() => setShowNew((value) => !value)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register("new_password")}
          />
        </Field>

        <Field label="Confirm new password" error={errors.confirm_password?.message}>
          <Input
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            invalid={Boolean(errors.confirm_password)}
            {...register("confirm_password")}
          />
        </Field>

        {errors.root?.message ? (
          <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            {errors.root.message}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? "Updating password…" : "Save new password"}
        </Button>
      </form>
    </Card>
  );
}
