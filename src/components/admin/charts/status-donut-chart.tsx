"use client";

import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusMetric } from "@/components/admin/data";
import { AdminChartTooltip } from "./chart-tooltip";
import { ChartEmptyState } from "./chart-empty-state";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function StatusDonutChart({ data, centerLabel: centerLabelProp, compact = false }: { data: StatusMetric[]; centerLabel?: string; compact?: boolean }) {
  const t = useAdminTranslations();
  const centerLabel = centerLabelProp ?? t("ui.charts.total");
  const reduceMotion = useReducedMotion();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!data.length || total === 0) return <ChartEmptyState title={t("ui.charts.noStatus")} />;
  return (
    <div className={compact ? "grid items-center gap-4" : "grid items-center gap-5 sm:grid-cols-[minmax(180px,0.85fr)_minmax(160px,1fr)]"}>
      <div className={compact ? "relative mx-auto h-48 w-full max-w-60 min-w-0" : "relative h-56 min-w-0"} aria-label={`${centerLabel}: ${total}`}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 224 }}>
          <PieChart accessibilityLayer>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={compact ? 52 : 58} outerRadius={compact ? 72 : 82} paddingAngle={2} stroke="var(--admin-surface)" strokeWidth={2} animationDuration={450} isAnimationActive={!reduceMotion}>{data.map((item) => <Cell key={item.label} fill={item.color} />)}</Pie>
            <Tooltip content={({ active, payload, label }) => <AdminChartTooltip active={active} payload={payload} label={label} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-2xl font-extrabold">{total}</strong><span className="text-[11px] text-[var(--admin-muted)]">{centerLabel}</span></div>
      </div>
      <ul className="space-y-2.5" aria-label={t("ui.charts.statusValues")}>{data.map((item) => <li key={item.label} className="flex items-center justify-between gap-4 text-xs"><span className="flex items-center gap-2 text-[var(--admin-muted)]"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong>{item.value.toLocaleString("en-US")}</strong></li>)}</ul>
    </div>
  );
}
