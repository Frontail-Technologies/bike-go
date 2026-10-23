"use client";

import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusMetric } from "@/components/admin/data";
import { AdminChartTooltip } from "./chart-tooltip";
import { ChartEmptyState } from "./chart-empty-state";

export function StatusDonutChart({ data, centerLabel = "Total" }: { data: StatusMetric[]; centerLabel?: string }) {
  const reduceMotion = useReducedMotion();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!data.length || total === 0) return <ChartEmptyState title="No status activity" />;
  return (
    <div className="grid items-center gap-5 sm:grid-cols-[minmax(180px,0.85fr)_minmax(160px,1fr)]">
      <div className="relative h-56 min-w-0" aria-label={`${centerLabel}: ${total}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={2} stroke="var(--admin-surface)" strokeWidth={2} isAnimationActive={!reduceMotion}>{data.map((item) => <Cell key={item.label} fill={item.color} />)}</Pie>
            <Tooltip content={({ active, payload, label }) => <AdminChartTooltip active={active} payload={payload} label={label} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-2xl font-extrabold">{total}</strong><span className="text-[11px] text-[var(--admin-muted)]">{centerLabel}</span></div>
      </div>
      <ul className="space-y-2.5" aria-label="Status values">{data.map((item) => <li key={item.label} className="flex items-center justify-between gap-4 text-xs"><span className="flex items-center gap-2 text-[var(--admin-muted)]"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong>{item.value.toLocaleString("en-US")}</strong></li>)}</ul>
    </div>
  );
}
