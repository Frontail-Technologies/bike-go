"use client";

import { ChartLineIcon } from "@phosphor-icons/react";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function ChartEmptyState({ title, description }: { title?: string; description?: string }) {
  const t = useAdminTranslations();
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-6 text-center" role="status">
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-white text-[var(--admin-muted)]"><ChartLineIcon size={20} aria-hidden /></span>
      <p className="text-sm font-bold">{title ?? t("ui.charts.noData")}</p>
      <p className="mt-1 max-w-xs text-xs text-[var(--admin-muted)]">{description ?? t("ui.charts.noDataDescription")}</p>
    </div>
  );
}

export function ChartLoadingState() {
  const t = useAdminTranslations();
  return <div className="h-64 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" role="status" aria-label={t("ui.charts.loading")}><span className="sr-only">{t("ui.charts.loading")}</span></div>;
}
