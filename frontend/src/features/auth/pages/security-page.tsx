import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/app/providers/use-auth";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    if (!setupData) {
      return;
    }

    let cancelled = false;
    void QRCode.toDataURL(setupData.provisioning_uri, { width: 220, margin: 1 }).then((dataUrl: string) => {
      if (!cancelled) {
        setQrCodeUrl(dataUrl);
      }
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
      toast.success("Google Authenticator is now enabled for your account.");
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
      toast.success("Authenticator app has been disabled.");
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Authenticator app could not be disabled.");
    },
  });

  if (statusQuery.isLoading) return <LoadingScreen label="Loading security settings..." />;
  if (statusQuery.isError || !statusQuery.data || !user) {
    return <ErrorState description="Security settings could not be loaded." onRetry={() => void statusQuery.refetch()} />;
  }

  const isEnabled = statusQuery.data.enabled;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account security"
        title="Authenticator App"
        description="Protect your account with Google Authenticator compatible two-factor authentication."
      />

      <Card className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Current status</p>
            <div className="flex items-center gap-3">
              {isEnabled ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <ShieldOff className="h-5 w-5 text-slate-500" />}
              <p className="text-lg font-semibold text-ink-950">
                {isEnabled ? "Authenticator app enabled" : "Authenticator app disabled"}
              </p>
            </div>
            <p className="text-sm text-slate-700">
              {isEnabled
                ? "Future sign-ins will require your password plus a 6-digit authenticator code."
                : "Enable Google Authenticator to require a time-based 6-digit code during login."}
            </p>
          </div>
          {!isEnabled ? (
            <Button onClick={() => startSetupMutation.mutate()} disabled={startSetupMutation.isPending}>
              <Smartphone className="h-4 w-4" />
              {startSetupMutation.isPending ? "Preparing setup..." : "Set up Google Authenticator"}
            </Button>
          ) : null}
        </div>
      </Card>

      {!isEnabled && setupData ? (
        <Card className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center justify-start gap-3">
            <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Google Authenticator QR code" className="h-[220px] w-[220px]" />
              ) : (
                <div className="flex h-[220px] w-[220px] items-center justify-center rounded-[18px] bg-slate-100 text-sm text-slate-500">
                  Generating QR...
                </div>
              )}
            </div>
            <p className="text-center text-xs uppercase tracking-[0.18em] text-slate-500">Scan with Google Authenticator</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-ink-950">Finish setup</h3>
              <p className="text-sm text-slate-700">
                Scan the QR code in Google Authenticator, then enter the 6-digit code shown by the app to enable
                two-factor authentication.
              </p>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Manual setup code</p>
              <p className="mt-2 font-mono text-sm font-semibold tracking-[0.18em] text-ink-950">{setupData.secret}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-950" htmlFor="enable-totp-code">
                6-digit authenticator code
              </label>
              <Input
                id="enable-totp-code"
                value={enableCode}
                onChange={(event) => setEnableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            {actionError ? (
              <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-danger-500">
                {actionError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => enableMutation.mutate({ code: enableCode })}
                disabled={enableMutation.isPending || enableCode.length !== 6}
              >
                {enableMutation.isPending ? "Enabling..." : "Enable authenticator app"}
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

      {isEnabled ? (
        <Card className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-ink-950">Disable authenticator app</h3>
            <p className="text-sm text-slate-700">
              To disable two-factor authentication, confirm with a current 6-digit code from your authenticator app.
            </p>
          </div>

          <div className="max-w-sm space-y-2">
            <label className="text-sm font-semibold text-ink-950" htmlFor="disable-totp-code">
              Current authenticator code
            </label>
            <Input
              id="disable-totp-code"
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
            />
          </div>

          {actionError ? (
            <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-danger-500">
              {actionError}
            </div>
          ) : null}

          <Button
            variant="secondary"
            onClick={() => disableMutation.mutate({ code: disableCode })}
            disabled={disableMutation.isPending || disableCode.length !== 6}
          >
            {disableMutation.isPending ? "Disabling..." : "Disable authenticator app"}
          </Button>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <h3 className="text-xl font-semibold text-ink-950">What changes after enabling?</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Your login will require email, password, and a 6-digit code from Google Authenticator.</li>
          <li>Your existing active browser session keeps working until you sign out or it expires.</li>
          <li>If you disable the authenticator app, future logins go back to password-only sign-in.</li>
        </ul>
      </Card>
    </div>
  );
}
