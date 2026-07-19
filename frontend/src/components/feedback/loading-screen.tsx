import { Crest } from "@/components/common/brand-mark";
import { cn } from "@/lib/utils/cn";

export function LoadingScreen({
  label = "Loading…",
  fullscreen = false,
}: {
  label?: string;
  fullscreen?: boolean;
}) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#f5f8fc]">
        <div className="flex flex-col items-center gap-5 text-center">
          <Crest size={48} className="animate-pulse" />
          <div className="space-y-2">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-ink-700" />
            <p className="text-sm font-medium text-slate-500">{label}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[280px] items-center justify-center")}>
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-ink-700" />
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
