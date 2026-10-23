import { ChartLineIcon } from "@phosphor-icons/react";

export function ChartEmptyState({ title = "No chart data", description = "Data will appear here when it becomes available." }: { title?: string; description?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-6 text-center" role="status">
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-white text-[var(--admin-muted)]"><ChartLineIcon size={20} aria-hidden /></span>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-[var(--admin-muted)]">{description}</p>
    </div>
  );
}

export function ChartLoadingState() {
  return <div className="h-64 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" role="status" aria-label="Loading chart"><span className="sr-only">Loading chart</span></div>;
}
