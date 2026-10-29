 "use client";

import { AdminChartCard, MetricBarChart, RevenueTrendChart, StatusDonutChart } from "@/components/admin/charts";
import type { MetricPoint, RevenueTrendPoint, StatusMetric } from "@/components/admin/data";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function DashboardPrimaryCharts({ days, revenue, vehicleStatus, vehicleTotal }: { days: number; revenue: RevenueTrendPoint[]; vehicleStatus: StatusMetric[]; vehicleTotal: number }) {
  const t = useAdminTranslations();
  return (
    <section aria-label={t("dashboard.charts.label")} className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
      <AdminChartCard title={t("dashboard.charts.trends")} description={t("dashboard.charts.trendsDescription", { days })}><RevenueTrendChart data={revenue} /></AdminChartCard>
      <AdminChartCard title={t("dashboard.charts.vehicleStatus")} description={t("dashboard.charts.vehicleStatusDescription", { count: vehicleTotal })}><StatusDonutChart compact data={vehicleStatus} centerLabel={t("dashboard.charts.vehicles")} /></AdminChartCard>
    </section>
  );
}

export function DashboardActivityCharts({ days, volume, loanStatus }: { days: number; volume: MetricPoint[]; loanStatus: StatusMetric[] }) {
  const t = useAdminTranslations();
  return (
    <section aria-label={t("dashboard.charts.activity")} className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
      <AdminChartCard title={t("dashboard.charts.volume")} description={t("dashboard.charts.volumeDescription", { days })}><MetricBarChart data={volume} label={t("nav.bookings")} /></AdminChartCard>
      <AdminChartCard title={t("dashboard.charts.loanStatus")} description={t("dashboard.charts.loanStatusDescription")}><StatusDonutChart compact data={loanStatus} centerLabel={t("dashboard.charts.applications")} /></AdminChartCard>
    </section>
  );
}

