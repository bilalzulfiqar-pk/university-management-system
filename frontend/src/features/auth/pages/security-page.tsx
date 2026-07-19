import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { ShieldCheck, ShieldOff, Smartphone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/app/providers/use-auth";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { Skeleton } from "@/components/ui/skeleton";
import { disableTotp, enableTotp, getTotpStatus, startTotpSetup } from "@/features/auth/api";

export function SecurityPage() {
  const { user, refreshUser } = useAuth();
  const [setupData, setSetupData] = useState<{ secret: string; provisioning_uri: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["totp-status"],
    queryFn: getTotpStatus,
  });

  useEffect(() => {
    if (!setupData) return;
    let cancelled = false;
    void QRCode.toDataURL(setupData.provisioning_uri, { width: 220, margin: 1 }).then((dataUrl: string) => {
      if (!cancelled) setQrCodeUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [setupData]);

  const startSetupMutation = useMutation({
    mutationFn: startTotpSetup,
    onSuccess: (result) => {
      setActionError(null);
      setEnableCode("");
      setSetupData(result);
      toast.success("Authenticator setup secret generated.");
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Authenticator setup could not be started.");
    },
  });

  const enableMutation = useMutation({
    mutationFn: enableTotp,
    onSuccess: async () => {
      setActionError(null);
      setEnableCode("");
      setSetupData(null);
      await statusQuery.refetch();
      await refreshUser();
      toast.success("Two-factor authentication is now enabled for your account.");
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Authenticator app could not be enabled.");
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableTotp,
    onSuccess: async () => {
      setActionError(null);
      setDisableCode("");
      await statusQuery.refetch();
      await refreshUser();
      toast.success("Two-factor authentication has been disabled.");
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Authenticator app could not be disabled.");
    },
  });

  if (statusQuery.isLoading) return <Skeleton className="h-64 w-full rounded-card" />;
  if (statusQuery.isError || !statusQuery.data || !user) {
    return <ErrorState description="Security settings could not be loaded." onRetry={() => void statusQuery.refetch()} />;
  }

  const isEnabled = statusQuery.data.enabled;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account security"
        title="Two-factor authentication"
        description="Protect your account with a Google Authenticator compatible time-based one-time password."
      />

      {/* Status card */}
      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-success-600" />
            ) : (
              <ShieldOff className="h-5 w-5 text-slate-400" />
            )}
            <p className="font-display text-lg font-semibold text-ink-900">
              {isEnabled ? "Authenticator app enabled" : "Authenticator app disabled"}
            </p>
            <Badge variant={isEnabled ? "success" : "neutral"} dot>
              {isEnabled ? "Active" : "Off"}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-slate-500">
            {isEnabled
              ? "Future sign-ins will require your password plus a 6-digit authenticator code."
              : "Enable two-factor authentication to require a time-based 6-digit code during login."}
          </p>
        </div>
        {!isEnabled ? (
          <Button onClick={() => startSetupMutation.mutate()} loading={startSetupMutation.isPending}>
            <Smartphone className="h-4 w-4" />
            Set up authenticator
          </Button>
        ) : null}
      </Card>

      {/* Setup flow */}
      {!isEnabled && setupData ? (
        <Card className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center justify-start gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Google Authenticator QR code" className="h-[220px] w-[220px]" />
              ) : (
                <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                  Generating QR…
                </div>
              )}
            </div>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Scan with Google Authenticator
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="font-display text-lg font-semibold text-ink-900">Finish setup</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Scan the QR code in Google Authenticator, then enter the 6-digit code shown by the app to enable
                two-factor authentication.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Manual setup code
              </p>
              <p className="mt-1.5 font-mono text-sm font-semibold tracking-[0.16em] text-ink-900">
                {setupData.secret}
              </p>
            </div>

            <Field label="6-digit authenticator code">
              <Input
                value={enableCode}
                onChange={(event) => setEnableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
              />
            </Field>

            {actionError ? (
              <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
                {actionError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => enableMutation.mutate({ code: enableCode })}
                loading={enableMutation.isPending}
                disabled={enableCode.length !== 6}
              >
                Enable authenticator
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSetupData(null);
                  setEnableCode("");
                  setActionError(null);
                }}
              >
                Cancel setup
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Disable flow */}
      {isEnabled ? (
        <Card className="space-y-5">
          <div className="space-y-2">
            <h3 className="font-display text-lg font-semibold text-ink-900">Disable authenticator app</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              Confirm with a current 6-digit code from your authenticator app to turn off two-factor authentication.
            </p>
          </div>

          <Field label="Current authenticator code">
            <Input
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              className="max-w-xs"
            />
          </Field>

          {actionError ? (
            <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
              {actionError}
            </div>
          ) : null}

          <Button
            variant="secondary"
            onClick={() => disableMutation.mutate({ code: disableCode })}
            loading={disableMutation.isPending}
            disabled={disableCode.length !== 6}
          >
            Disable authenticator
          </Button>
        </Card>
      ) : null}

      {/* Info card */}
      <Card className="space-y-3">
        <h3 className="font-display text-lg font-semibold text-ink-900">What changes after enabling?</h3>
        <ul className="space-y-2.5 text-sm text-slate-600">
          {[
            "Your login will require email, password, and a 6-digit code from Google Authenticator.",
            "Your existing active browser session keeps working until you sign out or it expires.",
            "If you disable the authenticator app, future logins go back to password-only sign-in.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
