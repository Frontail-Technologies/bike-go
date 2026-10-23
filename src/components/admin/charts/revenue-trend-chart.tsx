"use client";

import { useReducedMotion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency, RevenueTrendPoint } from "@/components/admin/data";
import { AdminChartTooltip } from "./chart-tooltip";
import { ChartEmptyState } from "./chart-empty-state";

function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: currency === "KHR" ? 0 : 0 }).format(currency === "USD" ? value / 100 : value);
}

function formatAxisMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(currency === "USD" ? value / 100 : value);
}

export function RevenueTrendChart({ data, currency }: { data: RevenueTrendPoint[]; currency: Currency }) {
  const reduceMotion = useReducedMotion();
  if (!data.length) return <ChartEmptyState title="No revenue activity" />;
  return (
    <div>
      <p className="sr-only">Revenue chart in {currency}. Booked and paid amounts are shown as separate lines.</p>
      <div className="h-64 min-w-0 w-full" aria-label={`Revenue trend in ${currency}`}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 256 }}>
          <AreaChart data={data} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id={`booked-${currency}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--admin-accent-strong)" stopOpacity={0.28} /><stop offset="95%" stopColor="var(--admin-accent-strong)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} tickFormatter={(value) => formatAxisMoney(Number(value), currency)} width={68} />
            <Tooltip content={({ active, payload, label }) => <AdminChartTooltip active={active} payload={payload} label={label} formatter={(value) => formatMoney(value, currency)} />} />
            <Area type="monotone" dataKey="bookedMinor" name="Booked" stroke="var(--admin-accent-strong)" fill={`url(#booked-${currency})`} strokeWidth={2.5} animationDuration={450} isAnimationActive={!reduceMotion} />
            <Area type="monotone" dataKey="paidMinor" name="Paid" stroke="var(--admin-success)" fill="transparent" strokeWidth={2.5} animationDuration={450} isAnimationActive={!reduceMotion} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold"><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-[var(--admin-accent-strong)]" />Booked</span><span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-[var(--admin-success)]" />Paid</span></div>
    </div>
  );
}
