"use client";

import { Button } from "@heroui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarCheckIcon, CarProfileIcon, CurrencyDollarIcon, FileMagnifyingGlassIcon, HandCoinsIcon, PlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminChartCard, MetricBarChart, RevenueTrendChart, StatusDonutChart } from "@/components/admin/charts";
import { formatCambodiaDate } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { adminDashboard, type Currency, type DashboardPeriod } from "@/components/admin/data";
import { AdminPage, PageHeader } from "@/components/admin/layout";

const statusTone = (status: string): AdminStatus =>
  (({
    ready_for_pickup: "confirmed",
    active: "ongoing",
    submitted: "under-review",
    documents_under_review: "under-review",
    additional_documents_required: "needs-review",
    eligibility_review: "under-review",
  })[status] as AdminStatus | undefined) ?? (status.replaceAll("_", "-") as AdminStatus);

type RecentBookingRow = (typeof adminDashboard.recentBookings)[number] & { id: string };
type RecentLoanRow = (typeof adminDashboard.recentLoans)[number] & { id: string };

function Selector<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: ReadonlyArray<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return <div className="flex rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-0.5" role="group" aria-label={label}>{options.map((option) => <Button key={option.value} size="sm" variant={value === option.value ? "primary" : "ghost"} aria-pressed={value === option.value} onPress={() => onChange(option.value)}>{option.label}</Button>)}</div>;
}

export function DashboardView() {
  const router = useRouter();
  const [period, setPeriod] = useState<DashboardPeriod>(30);
  const [currency, setCurrency] = useState<Currency>("USD");
  const data = adminDashboard;
  const selectedRevenue = data.bookings.revenue.find((item) => item.currency === currency);
  const bookingRows = useMemo<RecentBookingRow[]>(() => data.recentBookings.map((item) => ({ ...item, id: item.reference })), [data.recentBookings]);
  const loanRows = useMemo<RecentLoanRow[]>(() => data.recentLoans.map((item) => ({ ...item, id: item.reference })), [data.recentLoans]);
  const bookingColumns = useMemo<ColumnDef<RecentBookingRow>[]>(() => [
    { accessorKey: "reference", header: "Booking" },
    { accessorKey: "customerName", header: "Customer", cell: ({ row }) => <div><p className="font-bold">{row.original.customerName}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.vehicleName}</p></div> },
    { accessorKey: "pickupAt", header: "Pickup (ICT)", cell: ({ getValue }) => formatCambodiaDate(getValue<string>(), { year: undefined, hour: "2-digit", minute: "2-digit" }) },
    { accessorKey: "totalPayableMinor", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.totalPayableMinor} currency={row.original.currency} /> },
    { accessorKey: "bookingStatus", header: "Status", cell: ({ getValue }) => <AdminStatusBadge status={statusTone(getValue<string>())} /> },
  ], []);
  const loanColumns = useMemo<ColumnDef<RecentLoanRow>[]>(() => [
    { accessorKey: "reference", header: "Application" },
    { accessorKey: "applicantName", header: "Applicant", cell: ({ row }) => <div><p className="font-bold">{row.original.applicantName ?? "Applicant pending"}</p><p className="text-xs capitalize text-[var(--admin-muted)]">{row.original.loanType.replaceAll("_", " ")}</p></div> },
    { accessorKey: "requestedAmountMinor", header: "Requested", cell: ({ row }) => <MoneyDisplay amount={row.original.requestedAmountMinor} currency={row.original.currency} /> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <AdminStatusBadge status={statusTone(getValue<string>())} /> },
  ], []);

  return (
    <AdminPage>
      <PageHeader title="Dashboard" description="A focused overview of RideGo operations in Cambodia." actions={<Button variant="primary" onPress={() => router.push("/admin/vehicles/new")}><PlusIcon />Add Vehicle</Button>} />
      <section aria-label="Operational metrics" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Bookings" value={data.bookings.total} icon={<CalendarCheckIcon size={19} />} secondary={`${data.bookings.upcomingPickups7d} pickups in the next 7 days`} />
        <StatCard label="Active Rentals" value={data.bookings.activeNow} icon={<CarProfileIcon size={19} />} secondary={`${data.vehicles.byStatus.available ?? 0} vehicles available`} />
        <StatCard label={`Revenue (${currency})`} value={selectedRevenue ? <MoneyDisplay amount={selectedRevenue.bookedMinor} currency={currency} /> : "—"} icon={<CurrencyDollarIcon size={19} />} secondary={`${currency} only — no conversion`} />
        <StatCard label="Loan Applications" value={data.loans.total} icon={<HandCoinsIcon size={19} />} secondary={`${data.loans.awaitingReview} awaiting review`} />
        <StatCard label="Pending Document Reviews" value={data.pendingDocumentReviews} icon={<FileMagnifyingGlassIcon size={19} />} secondary="Requires an admin decision" />
      </section>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Selector label="Chart period" value={period} options={[{ value: 7, label: "7 days" }, { value: 30, label: "30 days" }, { value: 90, label: "90 days" }]} onChange={setPeriod} />
        <Selector label="Revenue currency" value={currency} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} onChange={setCurrency} />
      </div>
      <section aria-label="Dashboard charts" className="grid gap-5 xl:grid-cols-2">
        <AdminChartCard title="Revenue trend" description={`${period}-day booked and paid revenue in ${currency}.`}><RevenueTrendChart data={data.charts.revenue[currency][period]} currency={currency} /></AdminChartCard>
        <AdminChartCard title="Booking status" description={`${data.bookings.total} bookings across the current status mix.`}><StatusDonutChart data={data.charts.bookingStatus} centerLabel="Bookings" /></AdminChartCard>
        <AdminChartCard title="Booking volume" description={`${period}-day booking activity.`}><MetricBarChart data={data.charts.bookingVolume[period]} /></AdminChartCard>
        <AdminChartCard title="Loan status" description="Current loan application pipeline."><StatusDonutChart data={data.charts.loanStatus} centerLabel="Applications" /></AdminChartCard>
      </section>
      <section aria-label="Recent operations" className="grid gap-5 xl:grid-cols-2">
        <AdminChartCard title="Recent bookings" actions={<Link className="text-xs font-bold text-[var(--admin-info)]" href="/admin/bookings">View all</Link>}><AdminDataTable label="Recent bookings" columns={bookingColumns} data={bookingRows} minWidth={680} showPagination={false} /></AdminChartCard>
        <AdminChartCard title="Recent loan applications" actions={<Link className="text-xs font-bold text-[var(--admin-info)]" href="/admin/loan-applications">View all</Link>}><AdminDataTable label="Recent loan applications" columns={loanColumns} data={loanRows} minWidth={580} showPagination={false} /></AdminChartCard>
      </section>
    </AdminPage>
  );
}
