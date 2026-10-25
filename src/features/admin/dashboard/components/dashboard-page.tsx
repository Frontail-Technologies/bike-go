"use client";

import { Button } from "@heroui/react";
import { BuildingsIcon, CalendarBlankIcon, CalendarCheckIcon, CarProfileIcon, CurrencyDollarIcon, FileTextIcon, HandCoinsIcon, PlusIcon, UserPlusIcon, UsersIcon, type Icon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookingStatusBadge } from "@/components/admin/bookings/booking-parts";
import { adminCopy } from "@/components/admin/config";
import { AdminSelect, formatCambodiaDate } from "@/components/admin/controls";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount, formatCurrency } from "@/components/admin/money";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { useDashboardQuery } from "../hooks/use-dashboard";
import type { DashboardRange } from "../types/dashboard";
import { loanStatusMetrics, rangeDays, rangeOptions, revenuePoints, toBookingStatus, usdRevenue, vehicleStatusMetrics, volumePoints } from "../lib/view-model";

const quickActions: ReadonlyArray<{ href: string; label: string; Icon: Icon; tone: string }> = [
  { href: "/admin/vehicles/new", label: "Add Vehicle", Icon: PlusIcon, tone: "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" },
  { href: "/admin/bookings", label: "New Booking", Icon: CalendarCheckIcon, tone: "bg-[#efe9ff] text-[#6246c7]" },
  { href: "/admin/customers", label: "Add Customer", Icon: UserPlusIcon, tone: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" },
  { href: "/admin/loans", label: "Review Loans", Icon: HandCoinsIcon, tone: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" },
  { href: "/admin/documents", label: "Review Documents", Icon: FileTextIcon, tone: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" },
  { href: "/admin/locations", label: "Manage Locations", Icon: BuildingsIcon, tone: "bg-[var(--admin-surface-muted)] text-[var(--admin-text)]" },
];

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function ChartSectionSkeleton() {
  return (
    <div aria-label="Loading dashboard charts" role="status" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
      <div className="adminHero h-[360px] animate-pulse rounded-2xl" />
      <div className="adminHero h-[360px] animate-pulse rounded-2xl" />
    </div>
  );
}

const DashboardPrimaryCharts = dynamic(() => import("./dashboard-charts").then((module) => module.DashboardPrimaryCharts), { loading: ChartSectionSkeleton });
const DashboardActivityCharts = dynamic(() => import("./dashboard-charts").then((module) => module.DashboardActivityCharts), { loading: ChartSectionSkeleton });

export function DashboardPage() {
  const router = useRouter();
  const [range, setRange] = useState<DashboardRange>("30d");
  const query = useDashboardQuery(range);
  const data = query.data;
  const loading = query.isLoading;
  const days = rangeDays(range);
  const revenue = data ? usdRevenue(data) : null;

  return (
    <AdminPage className="gap-5 lg:gap-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${adminCopy.adminName.split(" ")[0]}! Here’s what’s happening with RideGo today.`}
        actions={
          <>
            <AdminSelect label="Date range" value={range} onChange={(value) => setRange(value as DashboardRange)} options={rangeOptions.map((option) => ({ ...option }))} icon={<CalendarBlankIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />} className="min-w-44" />
            <Button variant="primary" className="hidden sm:inline-flex" onPress={() => router.push("/admin/vehicles/new")}><PlusIcon />Add Vehicle</Button>
          </>
        }
      />

      {query.isError && !data ? (
        <AdminErrorState title="Couldn’t load the dashboard" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <section aria-label="Operational metrics" aria-busy={loading} className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
            <StatCard loading={loading} tone="accent" label="Total Vehicles" value={data?.vehicles.total ?? 0} icon={<CarProfileIcon size={22} weight="duotone" />} secondary={`${data?.vehicles.byStatus.available ?? 0} available`} />
            <StatCard loading={loading} tone="purple" label="Active Bookings" value={data?.bookings.activeNow ?? 0} icon={<CalendarCheckIcon size={22} weight="duotone" />} secondary={`${data?.bookings.upcomingPickups7d ?? 0} pickups in 7 days`} />
            <StatCard loading={loading} tone="success" label="Customers" value={(data?.customers.total ?? 0).toLocaleString("en-US")} icon={<UsersIcon size={22} weight="duotone" />} secondary={`${data?.customers.newLast30Days ?? 0} new in 30 days`} />
            <StatCard loading={loading} tone="success" label="Revenue (USD)" value={formatCurrency(revenue?.bookedMinor ?? 0, "USD").replace(/\.00$/, "")} icon={<CurrencyDollarIcon size={22} weight="duotone" />} secondary={`${formatCurrency(revenue?.paidMinor ?? 0, "USD").replace(/\.00$/, "")} paid`} />
            <StatCard loading={loading} tone="warning" label="Loan Applications" value={data?.loans.total ?? 0} icon={<HandCoinsIcon size={22} weight="duotone" />} secondary={`${data?.loans.awaitingReview ?? 0} awaiting review`} />
          </section>

          {data ? (
            <DashboardPrimaryCharts days={days} revenue={revenuePoints(data)} vehicleStatus={vehicleStatusMetrics(data)} vehicleTotal={data.vehicles.total} />
          ) : (
            <ChartSectionSkeleton />
          )}

          <section aria-label="Operations" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
            <ContentSection title="Recent Bookings" actions={<Link className="rounded-md px-1 text-xs font-bold text-[var(--admin-accent-strong)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]" href="/admin/bookings">View all</Link>}>
              <div className="p-5">
                {loading ? (
                  <ul aria-label="Loading recent bookings" aria-busy="true" className="space-y-3">
                    {Array.from({ length: 3 }, (_, index) => <li key={index} className="h-12 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />)}
                  </ul>
                ) : data && data.recentBookings.length > 0 ? (
                  <ul className="-my-1 divide-y divide-[var(--admin-border)]">
                    {data.recentBookings.map((booking) => (
                      <li key={booking.reference} className="flex items-center gap-3 py-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-xs font-extrabold text-[var(--admin-warning)]" aria-hidden>{initials(booking.customerName)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{booking.customerName}</p>
                          <p className="truncate text-xs text-[var(--admin-muted)]">{booking.vehicleName} · {booking.reference}</p>
                        </div>
                        <div className="hidden text-right text-xs text-[var(--admin-muted)] sm:block">
                          <p className="font-semibold text-[var(--admin-text)]"><CurrencyAmount amount={booking.totalPayableMinor} currency={booking.currency} /></p>
                          <p>{formatCambodiaDate(booking.pickupAt, { year: undefined, hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <BookingStatusBadge status={toBookingStatus(booking.bookingStatus)} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-[var(--admin-muted)]">No bookings yet.</p>
                )}
              </div>
            </ContentSection>

            <ContentSection title="Quick Actions">
              <div className="p-5">
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
              </div>
            </ContentSection>
          </section>

          {data ? <DashboardActivityCharts days={days} volume={volumePoints(data)} loanStatus={loanStatusMetrics(data)} /> : <ChartSectionSkeleton />}
          {query.isError && data ? <p role="alert" className="text-center text-xs font-semibold text-[var(--admin-danger)]">Couldn’t refresh the latest numbers. Showing the last loaded data.</p> : null}
        </>
      )}
    </AdminPage>
  );
}
