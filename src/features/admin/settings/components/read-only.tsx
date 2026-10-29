"use client";

import { LockSimpleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function ReadOnlyList({ title, description, items }: { title: string; description: string; items: readonly string[] }) {
  return (
    <section aria-label={title} className="adminSurface rounded-2xl p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <LockSimpleIcon size={16} className="text-[var(--admin-muted)]" aria-hidden />
          {title}
        </h2>
        <p className="text-sm text-[var(--admin-muted)]">{description}</p>
      </header>
      <ol className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={item} className="adminTile inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold">
            <span className="text-[11px] font-bold text-[var(--admin-muted)]">{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function InfoTile({ label, value, hint, badge, loading = false, children }: { label: string; value?: ReactNode; hint?: string; badge?: string; loading?: boolean; children?: ReactNode }) {
  const t = useAdminTranslations();
  return (
    <div className="adminSurface flex flex-col gap-2 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-[var(--admin-muted)]">{label}</p>
        <span className="whitespace-nowrap rounded-full bg-[var(--admin-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-muted)]">{badge ?? t("settings.systemConfigured")}</span>
      </div>
      {loading ? <span className="h-8 w-24 animate-pulse rounded bg-[var(--admin-surface-muted)]" aria-label={t("settings.loading")} /> : value !== undefined ? <p className="text-2xl font-extrabold tracking-tight">{value}</p> : null}
      {children}
      {hint ? <p className="text-xs text-[var(--admin-muted)]">{hint}</p> : null}
    </div>
  );
}
