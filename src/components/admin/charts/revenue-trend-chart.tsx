"use client";

import { useReducedMotion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenueTrendPoint } from "@/components/admin/data";
import { AdminChartTooltip } from "./chart-tooltip";
import { ChartEmptyState } from "./chart-empty-state";
import { formatMinor } from "@/lib/format";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

function formatMoney(value: number) {
  return formatMinor(value, "USD").replace(/\.00$/, "");
}

function formatAxisMoney(value: number) {
  return formatMinor(value, "USD", { compact: true });
}

export function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const t = useAdminTranslations();
  const reduceMotion = useReducedMotion();
  if (!data.length) return <ChartEmptyState title={t("ui.charts.noRevenue")} />;
  return (
    <div>
      <p className="sr-only">{t("ui.charts.revenueSummary")}</p>
      <div className="h-64 min-w-0 w-full" aria-label={t("ui.charts.revenueTrend")}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 256 }}>
          <AreaChart data={data} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id="booked-usd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--admin-accent-strong)" stopOpacity={0.28} /><stop offset="95%" stopColor="var(--admin-accent-strong)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} tickFormatter={(value) => formatAxisMoney(Number(value))} width={68} />
            <Tooltip content={({ active, payload, label }) => <AdminChartTooltip active={active} payload={payload} label={label} formatter={(value) => formatMoney(value)} />} />
            <Area type="monotone" dataKey="bookedMinor" name={t("ui.charts.booked")} stroke="var(--admin-accent-strong)" fill="url(#booked-usd)" strokeWidth={2.5} animationDuration={450} isAnimationActive={!reduceMotion} />
            <Area type="monotone" dataKey="paidMinor" name={t("ui.charts.paid")} stroke="var(--admin-success)" fill="transparent" strokeWidth={2.5} animationDuration={450} isAnimationActive={!reduceMotion} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-[var(--admin-accent-strong)]" />{t("ui.charts.booked")}</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-[var(--admin-success)]" />{t("ui.charts.paid")}</span></div>
    </div>
  );
}
