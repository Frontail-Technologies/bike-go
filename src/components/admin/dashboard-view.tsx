"use client";

import { Button } from "@heroui/react";
import { BuildingsIcon, CalendarBlankIcon, CalendarCheckIcon, CarProfileIcon, CurrencyDollarIcon, FileTextIcon, HandCoinsIcon, PlusIcon, UserPlusIcon, UsersIcon, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminChartCard, MetricBarChart, RevenueTrendChart, StatusDonutChart } from "@/components/admin/charts";
import { AdminSelect, formatCambodiaDate } from "@/components/admin/controls";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { adminCopy } from "@/components/admin/config";
import { adminDashboard, adminVehicles, type DashboardPeriod, type StatusMetric } from "@/components/admin/data";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { cn } from "@/lib/cn";

const statusTone = (status: string): AdminStatus =>
  (({
    ready_for_pickup: "confirmed",
    active: "ongoing",
    submitted: "under-review",
    documents_under_review: "under-review",
    additional_documents_required: "needs-review",
    eligibility_review: "under-review",
  })[status] as AdminStatus | undefined) ?? (status.replaceAll("_", "-") as AdminStatus);

const periods = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const quickActions: ReadonlyArray<{ href: string; label: string; Icon: Icon; tone: string }> = [
  { href: "/admin/vehicles/new", label: "Add Vehicle", Icon: PlusIcon, tone: "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" },
  { href: "/admin/bookings", label: "New Booking", Icon: CalendarCheckIcon, tone: "bg-[var(--admin-info-soft)] text-[var(--admin-info)]" },
  { href: "/admin/customers", label: "Add Customer", Icon: UserPlusIcon, tone: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" },
  { href: "/admin/loans", label: "Review Loans", Icon: HandCoinsIcon, tone: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" },
  { href: "/admin/documents", label: "Review Documents", Icon: FileTextIcon, tone: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" },
  { href: "/admin/locations", label: "Manage Locations", Icon: BuildingsIcon, tone: "bg-[var(--admin-surface-muted)] text-[var(--admin-text)]" },
];

const vehicleStatusColors: Record<string, string> = { available: "var(--admin-success)", rented: "var(--admin-info)", maintenance: "var(--admin-warning)", inactive: "var(--admin-muted)" };

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export function DashboardView() {
  const router = useRouter();
  const [period, setPeriod] = useState<DashboardPeriod>(30);
  const data = adminDashboard;
  const selectedRevenue = data.bookings.revenue[0];
  const vehicleStatus = useMemo<StatusMetric[]>(() => {
    const counts = adminVehicles.reduce<Record<string, number>>((all, vehicle) => ({ ...all, [vehicle.status]: (all[vehicle.status] ?? 0) + 1 }), {});
    return Object.entries(counts).map(([status, value]) => ({ label: status[0].toUpperCase() + status.slice(1), value, color: vehicleStatusColors[status] ?? "var(--admin-muted)" }));
  }, []);

  return (
    <AdminPage className="gap-5 lg:gap-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${adminCopy.adminName.split(" ")[0]}! Here’s what’s happening with RideGo today.`}
        actions={
          <>
            <AdminSelect label="Date range" value={String(period)} onChange={(value) => setPeriod(Number(value) as DashboardPeriod)} options={periods} icon={<CalendarBlankIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />} className="min-w-44" />
            <Button variant="primary" className="hidden sm:inline-flex" onPress={() => router.push("/admin/vehicles/new")}><PlusIcon />Add Vehicle</Button>
          </>
        }
      />

      <section aria-label="Operational metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
        <StatCard tone="accent" label="Total Vehicles" value={data.vehicles.total} icon={<CarProfileIcon size={22} weight="duotone" />} trend={{ direction: "up", value: "8%", label: "vs last month" }} />
        <StatCard tone="info" label="Active Bookings" value={data.bookings.activeNow} icon={<CalendarCheckIcon size={22} weight="duotone" />} trend={{ direction: "up", value: "12%" }} />
        <StatCard tone="success" label="Customers" value={data.customers.total.toLocaleString("en-US")} icon={<UsersIcon size={22} weight="duotone" />} trend={{ direction: "up", value: "6%" }} />
        <StatCard tone="success" label="Revenue (USD)" value={selectedRevenue ? `$${Math.round(selectedRevenue.bookedMinor / 100).toLocaleString("en-US")}` : "—"} icon={<CurrencyDollarIcon size={22} weight="duotone" />} trend={{ direction: "up", value: "18%" }} />
        <StatCard tone="warning" label="Loan Applications" value={data.loans.total} icon={<HandCoinsIcon size={22} weight="duotone" />} secondary={`${data.loans.awaitingReview} awaiting review · ${data.pendingDocumentReviews} documents`} />
      </section>

      <section aria-label="Dashboard charts" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
        <AdminChartCard title="Booking Trends" description={`Booked and paid revenue, last ${period} days (USD).`}><RevenueTrendChart data={data.charts.revenue.USD[period]} /></AdminChartCard>
        <AdminChartCard title="Vehicle Status" description={`${data.vehicles.total} vehicles across the fleet.`}><StatusDonutChart compact data={vehicleStatus} centerLabel="Vehicles" /></AdminChartCard>
      </section>

      <section aria-label="Operations" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
        <AdminChartCard title="Recent Bookings" actions={<Link className="rounded-md px-1 text-xs font-bold text-[var(--admin-info)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]" href="/admin/bookings">View all</Link>}>
          <ul className="-my-1 divide-y divide-[var(--admin-border)]">
            {data.recentBookings.map((booking) => (
              <li key={booking.reference} className="flex items-center gap-3 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-xs font-extrabold text-[var(--admin-warning)]" aria-hidden>{initials(booking.customerName)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{booking.customerName}</p>
                  <p className="truncate text-xs text-[var(--admin-muted)]">{booking.vehicleName} · {booking.reference}</p>
                </div>
                <div className="hidden text-right text-xs text-[var(--admin-muted)] sm:block">
                  <p className="font-semibold text-[var(--admin-text)]"><MoneyDisplay amount={booking.totalPayableMinor} /></p>
                  <p>{formatCambodiaDate(booking.pickupAt, { year: undefined, hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <AdminStatusBadge status={statusTone(booking.bookingStatus)} />
              </li>
            ))}
          </ul>
        </AdminChartCard>

        <AdminChartCard title="Quick Actions">
          <ul className="grid grid-cols-2 gap-2.5">
            {quickActions.map(({ href, label, Icon, tone }) => (
              <li key={href}>
                <Link href={href} className="adminTile adminLift flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl p-3 text-center text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]">
                  <span className={cn("flex size-10 items-center justify-center rounded-xl", tone)}><Icon size={20} weight="duotone" aria-hidden /></span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </AdminChartCard>
      </section>

      <section aria-label="Activity breakdown" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
        <AdminChartCard title="Booking Volume" description={`Bookings per period, last ${period} days.`}><MetricBarChart data={data.charts.bookingVolume[period]} /></AdminChartCard>
        <AdminChartCard title="Loan Status" description="Current loan application pipeline."><StatusDonutChart compact data={data.charts.loanStatus} centerLabel="Applications" /></AdminChartCard>
      </section>
    </AdminPage>
  );
}
