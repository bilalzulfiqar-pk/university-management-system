import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/app/providers/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { ApiError } from "@/lib/api/client";
import { getRoleHome } from "@/lib/constants/navigation";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@example.com",
      password: "ChangeMe123!",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await login(values);
      toast.success(`Welcome back${result.user.first_name ? `, ${result.user.first_name}` : ""}.`);
      const destination = result.user.must_change_password
        ? "/change-password"
        : ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? getRoleHome(result.user.role));
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setError("root", { message: error.message });
        return;
      }
      setError("root", { message: "Login failed. Please try again." });
    }
  });

  return (
    <Card className="mx-auto max-w-xl space-y-8 p-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-800">
          <ShieldCheck className="h-4 w-4" />
          Secure access
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-950">Sign in to your workspace</h2>
          <p className="text-sm leading-6 text-slate-700">
            Use the account seeded from your backend. Students and teachers created by an admin will be asked to change
            their password on first login.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <Field label="Email address" error={errors.email?.message}>
          <Input type="email" placeholder="admin@example.com" autoComplete="email" {...register("email")} />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {errors.root?.message ? (
          <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-danger-500">
            {errors.root.message}
          </div>
        ) : null}

        <Button className="w-full" type="submit" size="lg" disabled={isSubmitting}>
          <KeyRound className="h-4 w-4" />
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
