export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[18px] border border-dashed border-slate-300 bg-white/80">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-ink-800" />
        <p className="text-sm font-medium text-slate-700">{label}</p>
      </div>
    </div>
  );
}
