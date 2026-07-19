import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/app/providers/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { getRoleHome } from "@/lib/constants/navigation";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  totp_code: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{6}$/.test(value), "Authenticator code must be 6 digits."),
});

type LoginValues = z.infer<typeof schema>;

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? "admin@example.com";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "ChangeMe123!!";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpField, setShowTotpField] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", totp_code: "" },
  });

  const useDemoCredentials = () => {
    setValue("email", DEMO_EMAIL, { shouldValidate: false });
    setValue("password", DEMO_PASSWORD, { shouldValidate: false });
    setShowTotpField(false);
    setError("root", { message: undefined });
  };

  const onSubmit = handleSubmit(async (values) => {
    if (showTotpField && !values.totp_code.trim()) {
      setError("totp_code", { message: "Enter the 6-digit code from your authenticator app." });
      return;
    }

    try {
      const result = await login({
        email: values.email,
        password: values.password,
        totp_code: values.totp_code.trim() || undefined,
      });
      toast.success(`Welcome back${result.user.first_name ? `, ${result.user.first_name}` : ""}.`);
      const destination = result.user.must_change_password
        ? "/change-password"
        : ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
          getRoleHome(result.user.role));
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "TOTP_REQUIRED") {
          setShowTotpField(true);
          setError("totp_code", { message: "Enter the 6-digit code from Google Authenticator." });
          return;
        }
        if (error.code === "INVALID_TOTP_CODE") {
          setShowTotpField(true);
          setError("totp_code", { message: error.message });
          return;
        }
        setError("root", { message: error.message });
        return;
      }
      setError("root", { message: "Login failed. Please try again." });
    }
  });

  return (
    <Card className="space-y-7 p-7 sm:p-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-700 ring-1 ring-inset ring-ink-100">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure access
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
            Sign in to your workspace
          </h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Use your assigned account to sign in. If this is your first login, you will be asked to change your
            password.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <Field label="Email address" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@university.edu"
            autoComplete="email"
            leadingIcon={<Mail className="h-4 w-4" />}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            leadingIcon={<Lock className="h-4 w-4" />}
            trailingSlot={
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="rounded p-1.5 text-slate-400 transition-smooth hover:text-ink-700"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        {showTotpField ? (
          <Field
            label="Authenticator code"
            hint="6-digit code from Google Authenticator"
            error={errors.totp_code?.message}
          >
            <Input
              type="text"
              placeholder="123456"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              invalid={Boolean(errors.totp_code)}
              {...register("totp_code")}
            />
          </Field>
        ) : null}

        {errors.root?.message ? (
          <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            {errors.root.message}
          </div>
        ) : null}

        <Button className="w-full" type="submit" size="lg" loading={isSubmitting}>
          <KeyRound className="h-4 w-4" />
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={useDemoCredentials}
          className="text-xs font-medium text-ink-600 underline-offset-4 transition-smooth hover:text-ink-900 hover:underline"
        >
          Use demo credentials
        </button>
      </div>
    </Card>
  );
}
