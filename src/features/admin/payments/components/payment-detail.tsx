"use client";

import { Button } from "@heroui/react";
import { ArrowRightIcon, CalendarCheckIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, ReceiptIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/data-display/misc";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { usePaymentQuery } from "../hooks/use-payments";
import { fmtDateTime, providerLabel } from "../lib/payment-model";
import type { PaymentDetail as PaymentDetailData } from "../types/payment";

function Card({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("adminSurface rounded-2xl p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-start justify-between gap-4 text-sm"><dt className="shrink-0 text-[var(--admin-muted)]">{label}</dt><dd className="min-w-0 break-words text-right font-semibold">{children}</dd></div>;
}

/** Only what the backend recorded: the attempt, and how it ended. A failure is stamped when the attempt last changed. */
function timelineFor(payment: PaymentDetailData): ActivityItem[] {
  const created: ActivityItem = { id: "created", state: "done", title: "Payment created", time: `${fmtDateTime(payment.createdAt)} ICT`, icon: <ReceiptIcon size={16} /> };
  if (payment.status === "paid") return [created, { id: "paid", state: "done", title: "Payment confirmed", time: `${fmtDateTime(payment.paidAt ?? payment.updatedAt)} ICT`, icon: <CheckCircleIcon size={16} /> }];
  if (payment.status === "failed") return [created, { id: "failed", state: "failed", title: "Payment failed", detail: payment.review ?? undefined, time: `${fmtDateTime(payment.updatedAt)} ICT`, icon: <XCircleIcon size={16} /> }];
  return [created, { id: "pending", state: "current", title: "Payment pending", detail: "Waiting for the provider to confirm the payment.", time: "Awaiting confirmation", icon: <ClockIcon size={16} /> }];
}

export function PaymentDetail({ transactionId }: { transactionId: string }) {
  const query = usePaymentQuery(transactionId);
  const payment = query.data;
  if (query.isError && !payment) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 422);
    return <AdminPage><PageHeader title="Payment Details" /><AdminErrorState title={notFound ? "Payment not found" : "Couldn’t load the payment"} description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!payment) return <AdminPage><PageHeader title="Payment Details" /><AdminLoadingState label="Loading payment…" /></AdminPage>;
  return <PaymentWorkspace payment={payment} />;
}

function PaymentWorkspace({ payment }: { payment: PaymentDetailData }) {
  const router = useRouter();
  const { customer, booking } = payment;

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Payments", href: "/admin/payments" }, { label: payment.transactionId }]} />

      <header className="adminHero flex flex-col gap-2 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="break-all text-2xl font-extrabold tracking-tight sm:text-3xl">Payment {payment.transactionId}</h1>
          <PaymentStatusBadge status={payment.status} />
        </div>
        <p className="text-sm text-[var(--admin-muted)]">{fmtDateTime(payment.createdAt)} (Asia/Phnom_Penh)</p>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card title="Payment Information">
            <dl className="space-y-3">
              <Row label="Reference">{payment.transactionId}</Row>
              <Row label="Amount"><CurrencyAmount amount={payment.amountMinor} currency={payment.currency} showCode /></Row>
              <Row label="Currency">{payment.currency}</Row>
              <Row label="Status"><PaymentStatusBadge status={payment.status} /></Row>
              <Row label="Provider"><span className="inline-flex items-center gap-1.5"><CreditCardIcon size={14} aria-hidden />{providerLabel(payment.provider)}</span></Row>
              <Row label="Created">{fmtDateTime(payment.createdAt)} ICT</Row>
              <Row label="Paid">{payment.paidAt ? `${fmtDateTime(payment.paidAt)} ICT` : "Not paid"}</Row>
              <Row label="Last updated">{fmtDateTime(payment.updatedAt)} ICT</Row>
              {payment.review ? <Row label="Provider note">{payment.review}</Row> : null}
            </dl>
          </Card>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            <Card title="Customer" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/customers/${customer.id}`)}>View<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{customer.reference}</p></div></div>
              <ul className="space-y-2.5 text-sm"><li className="flex items-center gap-2"><PhoneIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.phone ?? "—"}</li><li className="flex items-center gap-2 break-all"><EnvelopeSimpleIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.email ?? "—"}</li></ul>
            </Card>

            <Card title="Related Booking" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/bookings/${booking.reference}`)}>View Booking<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-3 flex items-center gap-3"><VehiclePhoto vehicle={{ id: booking.vehicleId, name: booking.vehicleName, vehicleType: booking.vehicleType, images: booking.vehicleImage ? [booking.vehicleImage] : [] }} className="h-14 w-20 shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="80px" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{booking.vehicleName}</p><p className="text-xs text-[var(--admin-muted)]">{booking.reference}</p></div></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CalendarCheckIcon size={16} className="mt-0.5 shrink-0 text-[var(--admin-muted)]" aria-hidden />{fmtDateTime(booking.pickupAt)} → {fmtDateTime(booking.returnAt)}</li>
                <li className="flex items-center gap-2"><MapPinIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{booking.pickupLocation.name}{booking.returnLocation.name !== booking.pickupLocation.name ? ` → ${booking.returnLocation.name}` : ""}</li>
              </ul>
            </Card>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <Card title="Payment Timeline"><ActivityTimeline items={timelineFor(payment)} /></Card>
          <Card title="Summary">
            <dl className="space-y-2.5">
              <Row label="Amount"><CurrencyAmount amount={payment.amountMinor} currency={payment.currency} /></Row>
              <div className="mt-1 flex items-end justify-between gap-3 rounded-xl bg-[var(--admin-accent-soft)] p-3"><dt className="text-sm font-extrabold">{payment.status === "paid" ? "Received" : "Received so far"}</dt><dd className="text-right"><CurrencyAmount amount={payment.status === "paid" ? payment.amountMinor : 0} currency={payment.currency} className="text-xl font-extrabold" /><span className="block text-[11px] text-[var(--admin-muted)]">{payment.currency}</span></dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
