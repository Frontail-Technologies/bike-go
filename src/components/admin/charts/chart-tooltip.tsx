"use client";

import type { ReactNode } from "react";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import type { TooltipPayloadEntry } from "recharts";

type Formatter = (value: number, name: string) => string;

export function AdminChartTooltip({ active, payload, label, formatter }: { active?: boolean; payload?: ReadonlyArray<TooltipPayloadEntry>; label?: ReactNode; formatter?: Formatter }) {
  const t = useAdminTranslations();
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2 shadow-lg">
      {label ? <p className="mb-1.5 text-xs font-bold text-[var(--admin-muted)]">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const rawValue = Array.isArray(item.value) ? item.value[0] : item.value;
          const value = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0);
          const name = String(item.name ?? t("ui.charts.value"));
          return <div key={`${name}-${index}`} className="flex items-center justify-between gap-5 text-xs"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{name}</span><strong>{formatter ? formatter(value, name) : value.toLocaleString("en-US")}</strong></div>;
        })}
      </div>
    </div>
  );
}
