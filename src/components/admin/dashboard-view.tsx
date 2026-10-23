"use client";

import { Button } from "@heroui/react";
import {
  CalendarCheckIcon,
  CarProfileIcon,
  CurrencyDollarIcon,
  HandCoinsIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminDashboard, type Currency } from "@/components/admin/data";
import { formatCambodiaDate } from "@/components/admin/controls";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { StatCard } from "@/components/admin/data-display/stat-card";
import {
  AdminStatusBadge,
  type AdminStatus,
} from "@/components/admin/data-display/status-badge";
import {
  AdminPage,
  ContentSection,
  PageHeader,
  SplitPanel,
} from "@/components/admin/layout";

const statusTone = (status: string): AdminStatus =>
  (({
    ready_for_pickup: "confirmed",
    active: "ongoing",
    submitted: "under-review",
    documents_under_review: "under-review",
    eligibility_review: "under-review",
  })[status] as AdminStatus | undefined) ??
  (status.replaceAll("_", "-") as AdminStatus);

function RevenueOverview({
  revenue,
}: {
  revenue: Array<{
    currency: Currency;
    bookedMinor: number;
    paidMinor: number;
  }>;
}) {
  if (!revenue.length)
    return (
      <p className="p-5 text-sm text-(--admin-muted)">
        Revenue will appear after the first confirmed booking.
      </p>
    );
  return (
    <div className="space-y-6 p-5">
      {revenue.map((item) => {
        const maximum = Math.max(item.bookedMinor, 1);
        return (
          <div key={item.currency} className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-(--admin-muted)">
                  {item.currency}
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  <MoneyDisplay
                    amount={item.bookedMinor}
                    currency={item.currency}
                  />
                </p>
              </div>
              <p className="text-right text-xs text-(--admin-muted)">
                Paid
                <br />
                <strong className="text-sm text-[var(--admin-text)]">
                  <MoneyDisplay
                    amount={item.paidMinor}
                    currency={item.currency}
                  />
                </strong>
              </p>
            </div>
            <div
              className="space-y-2"
              role="img"
              aria-label={`${item.currency}: ${item.paidMinor} paid of ${item.bookedMinor} booked in minor units`}
            >
              <div className="h-3 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--admin-accent)]"
                  style={{
                    width: `${Math.max(2, (item.bookedMinor / maximum) * 100)}%`,
                  }}
                />
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--admin-success)]"
                  style={{
                    width: `${Math.max(item.paidMinor ? 2 : 0, (item.paidMinor / maximum) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-[11px] text-(--admin-muted)">
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-[var(--admin-accent)]" />
                Booked
              </span>
              <span>
                <i className="mr-1 inline-block size-2 rounded-full bg-[var(--admin-success)]" />
                Paid
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BookingSummary({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return (
    <div className="space-y-3 p-5">
      {entries.length ? (
        entries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-3">
            <AdminStatusBadge status={statusTone(status)} />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--admin-info)]"
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm font-bold tabular-nums">
              {count}
            </span>
          </div>
        ))
      ) : (
        <p className="text-sm text-(--admin-muted)">No bookings yet.</p>
      )}
    </div>
  );
}

export function DashboardView() {
  const router = useRouter();
  const data = adminDashboard;
  const primaryRevenue =
    data.bookings.revenue.find((item) => item.currency === "USD") ??
    data.bookings.revenue[0];
  return (
    <AdminPage>
      <PageHeader
        title="Dashboard"
        description="A live overview of RideGo operations in Cambodia."
        actions={
          <>
            <Button
              variant="primary"
              onPress={() => router.push("/admin/vehicles/new")}
            >
              <PlusIcon />
              Add Vehicle
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={data.bookings.total}
          icon={<CalendarCheckIcon size={19} />}
          secondary={`${data.bookings.upcomingPickups7d} pickups in the next 7 days`}
        />
        <StatCard
          label="Active Rentals"
          value={data.bookings.activeNow}
          icon={<CarProfileIcon size={19} />}
          secondary={`${data.vehicles.byStatus.available ?? 0} vehicles available`}
        />
        <StatCard
          label="Total Revenue"
          value={
            primaryRevenue ? (
              <MoneyDisplay
                amount={primaryRevenue.bookedMinor}
                currency={primaryRevenue.currency}
              />
            ) : (
              "—"
            )
          }
          icon={<CurrencyDollarIcon size={19} />}
          secondary={
            data.bookings.revenue.length > 1
              ? data.bookings.revenue
                  .filter((item) => item.currency !== primaryRevenue?.currency)
                  .map((item) => (
                    <span key={item.currency} className="mr-2">
                      <MoneyDisplay
                        amount={item.bookedMinor}
                        currency={item.currency}
                      />
                    </span>
                  ))
              : "Confirmed and completed bookings"
          }
        />
        <StatCard
          label="Loan Applications"
          value={data.loans.total}
          icon={<HandCoinsIcon size={19} />}
          secondary={`${data.loans.awaitingReview} awaiting review`}
        />
      </div>
      <SplitPanel
        primary={
          <ContentSection
            title="Revenue overview"
            description="Booked and paid revenue, kept separate by currency."
          >
            <RevenueOverview revenue={data.bookings.revenue} />
          </ContentSection>
        }
        secondary={
          <ContentSection
            title="Booking status"
            description={`${data.bookings.total} total bookings`}
          >
            <BookingSummary counts={data.bookings.byStatus} />
          </ContentSection>
        }
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <ContentSection
          title="Recent bookings"
          actions={
            <Link
              className="text-xs font-bold text-[var(--admin-info)]"
              href="/admin/bookings"
            >
              View all
            </Link>
          }
        >
          <div className="divide-y divide-[var(--admin-border)]">
            {data.recentBookings.map((booking) => (
              <div
                key={booking.reference}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {booking.customerName}
                  </p>
                  <p className="truncate text-xs text-(--admin-muted)">
                    {booking.reference} · {booking.vehicleName} ·{" "}
                    {formatCambodiaDate(booking.pickupAt, { year: undefined })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <MoneyDisplay
                    amount={booking.totalPayableMinor}
                    currency={booking.currency}
                    className="text-sm"
                  />
                  <AdminStatusBadge
                    status={statusTone(booking.bookingStatus)}
                  />
                </div>
              </div>
            ))}
            {!data.recentBookings.length ? (
              <p className="p-5 text-sm text-(--admin-muted)">
                No recent bookings.
              </p>
            ) : null}
          </div>
        </ContentSection>
        <ContentSection
          title="Recent loan applications"
          actions={
            <Link
              className="text-xs font-bold text-[var(--admin-info)]"
              href="/admin/loan-applications"
            >
              View all
            </Link>
          }
        >
          <div className="divide-y divide-[var(--admin-border)]">
            {data.recentLoans.map((loan) => (
              <div
                key={loan.reference}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {loan.applicantName ?? "Applicant pending"}
                  </p>
                  <p className="truncate text-xs text-(--admin-muted)">
                    {loan.reference} · {loan.loanType.replaceAll("_", " ")} ·{" "}
                    {formatCambodiaDate(loan.createdAt, { year: undefined })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <MoneyDisplay
                    amount={loan.requestedAmountMinor}
                    currency={loan.currency}
                    className="text-sm"
                  />
                  <AdminStatusBadge status={statusTone(loan.status)} />
                </div>
              </div>
            ))}
            {!data.recentLoans.length ? (
              <p className="p-5 text-sm text-(--admin-muted)">
                No recent applications.
              </p>
            ) : null}
          </div>
        </ContentSection>
      </div>
    </AdminPage>
  );
}
