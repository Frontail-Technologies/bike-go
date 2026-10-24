"use client";

import { Button } from "@heroui/react";
import { ArrowRightIcon, CalendarCheckIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, EnvelopeSimpleIcon, HandCoinsIcon, MapPinIcon, PhoneIcon, ReceiptIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { fmtDateTime as bookingDateTime } from "@/components/admin/payments/payment-booking-mock";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/data-display/misc";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { LoanStatusBadge } from "@/components/admin/loans/loan-parts";
import { CurrencyAmount, formatCurrency } from "@/components/admin/money";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { cn } from "@/lib/cn";
import { fmtDateTime, getPayment, type Payment, typeLabels } from "./payment-data";
import { PaymentStatusBadge, PaymentTypeBadge } from "./payment-parts";

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

const shift = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();

function timelineFor(payment: Payment): ActivityItem[] {
  const at = (minutes: number) => `${fmtDateTime(shift(payment.createdAt, minutes))} ICT`;
  const created: ActivityItem = { id: "created", state: "done", title: "Payment created", time: at(0), icon: <ReceiptIcon size={16} /> };
  switch (payment.status) {
    case "unpaid": return [created, { id: "awaiting", state: "current", title: "Awaiting payment", time: "No payment received yet", icon: <ClockIcon size={16} /> }];
    case "pending": return [created, { id: "pending", state: "current", title: "Payment pending", detail: "Waiting for the customer to complete the payment.", time: at(1), icon: <ClockIcon size={16} /> }];
    case "failed": return [created, { id: "failed", state: "failed", title: "Payment failed", detail: "The payment was not completed.", time: at(3), icon: <XCircleIcon size={16} /> }];
    case "paid": return [created, { id: "paid", state: "done", title: "Payment confirmed", time: at(2), icon: <CheckCircleIcon size={16} /> }];
    case "refunded": return [created, { id: "paid", state: "done", title: "Payment confirmed", time: at(2), icon: <CheckCircleIcon size={16} /> }, { id: "refunded", state: "done", title: "Refunded", detail: "The full amount was refunded.", time: at(60 * 26), icon: <ArrowRightIcon size={16} /> }];
    case "partially-refunded": return [created, { id: "paid", state: "done", title: "Payment confirmed", time: at(2), icon: <CheckCircleIcon size={16} /> }, { id: "refunded", state: "done", title: "Partial refund issued", detail: `${formatCurrency(payment.refunded, payment.currency)} was refunded.`, time: at(60 * 26), icon: <ArrowRightIcon size={16} /> }];
  }
}

export function PaymentDetail({ reference }: { reference: string }) {
  const router = useRouter();
  const payment = getPayment(reference);
  if (!payment) return <AdminPage><PageHeader title="Payment Details" /><AdminErrorState title="Payment not found" description="This UI preview does not contain that payment." /></AdminPage>;
  const { customer, booking, loan } = payment;
  const net = payment.status === "paid" || payment.status === "refunded" || payment.status === "partially-refunded" ? payment.amount - payment.refunded : 0;

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Payments", href: "/admin/payments" }, { label: payment.reference }]} />

      <header className="adminHero flex flex-col gap-2 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Payment {payment.reference}</h1>
          <PaymentStatusBadge status={payment.status} />
          <PaymentTypeBadge type={payment.type} />
        </div>
        <p className="text-sm text-[var(--admin-muted)]">{fmtDateTime(payment.createdAt)} (Asia/Phnom_Penh)</p>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card title="Payment Information">
            <dl className="space-y-3">
              <Row label="Reference">{payment.reference}</Row>
              <Row label="Amount"><CurrencyAmount amount={payment.amount} currency={payment.currency} showCode /></Row>
              <Row label="Currency">{payment.currency}</Row>
              <Row label="Status"><PaymentStatusBadge status={payment.status} /></Row>
              <Row label="Payment method">{payment.method ? <span className="inline-flex items-center gap-1.5"><CreditCardIcon size={14} aria-hidden />{payment.method}</span> : "Not recorded"}</Row>
              <Row label="Type">{typeLabels[payment.type]} payment</Row>
              <Row label="Description">{payment.description}</Row>
            </dl>
          </Card>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            <Card title="Customer" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/customers/${customer.id}`)}>View<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{customer.reference}</p></div></div>
              <ul className="space-y-2.5 text-sm"><li className="flex items-center gap-2"><PhoneIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.phone}</li><li className="flex items-center gap-2 break-all"><EnvelopeSimpleIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.email}</li><li className="flex items-center gap-2"><MapPinIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.city}, Cambodia</li></ul>
            </Card>

            {booking ? (
              <Card title="Related Booking" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/bookings/${booking.reference}`)}>View Booking<ArrowRightIcon size={14} /></Button>}>
                <div className="mb-3 flex items-center gap-3"><VehiclePhoto vehicle={booking.vehicle} className="h-14 w-20 shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="80px" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{booking.vehicle.name}</p><p className="text-xs text-[var(--admin-muted)]">{booking.reference}</p></div></div>
                <ul className="space-y-2 text-sm"><li className="flex items-start gap-2"><CalendarCheckIcon size={16} className="mt-0.5 shrink-0 text-[var(--admin-muted)]" aria-hidden />{bookingDateTime(booking.pickupAt)} → {bookingDateTime(booking.returnAt)}</li><li className="flex items-center gap-2"><MapPinIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{booking.pickupLocation}</li></ul>
              </Card>
            ) : loan ? (
              <Card title="Related Loan Application" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/loans/${loan.reference}`)}>View<ArrowRightIcon size={14} /></Button>}>
                <div className="mb-3 flex items-center gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"><HandCoinsIcon size={24} weight="duotone" aria-hidden /></span><div className="min-w-0"><p className="truncate text-sm font-extrabold">{loan.loanType}</p><p className="text-xs text-[var(--admin-muted)]">{loan.reference}</p></div></div>
                <dl className="space-y-2.5"><Row label="Requested"><CurrencyAmount amount={loan.requestedMinor} currency={loan.currency} showCode /></Row><Row label="Tenure">{loan.tenureMonths} months</Row><Row label="Status"><LoanStatusBadge status={loan.status} /></Row></dl>
              </Card>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <Card title="Payment Timeline"><ActivityTimeline items={timelineFor(payment)} /></Card>
          <Card title="Summary">
            <dl className="space-y-2.5">
              <Row label="Amount"><CurrencyAmount amount={payment.amount} currency={payment.currency} /></Row>
              <Row label="Fees"><span className="font-medium text-[var(--admin-muted)]">None recorded</span></Row>
              {payment.refunded ? <Row label="Refunded"><span className="text-[var(--admin-danger)]">−<CurrencyAmount amount={payment.refunded} currency={payment.currency} /></span></Row> : null}
              <div className="mt-1 flex items-end justify-between gap-3 rounded-xl bg-[var(--admin-accent-soft)] p-3"><dt className="text-sm font-extrabold">{payment.status === "paid" || payment.refunded ? "Net received" : "Received so far"}</dt><dd className="text-right"><CurrencyAmount amount={net} currency={payment.currency} className="text-xl font-extrabold" /><span className="block text-[11px] text-[var(--admin-muted)]">{payment.currency}</span></dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
