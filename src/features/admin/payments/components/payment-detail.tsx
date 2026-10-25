"use client";

import { Button, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, ArrowRightIcon, ArrowsClockwiseIcon, BankIcon, CalendarCheckIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, ReceiptIcon, XCircleIcon } from "@phosphor-icons/react";
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
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { usePaymentMutations, usePaymentQuery } from "../hooks/use-payments";
import { badgeStatus, fmtDateTime, providerLabel } from "../lib/payment-model";
import type { PaymentDetail as PaymentDetailData } from "../types/payment";
import { RefundDialog } from "./refund-dialog";

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

const dash = "—";

/** Only what was recorded: this server's attempt, PayWay's own transaction, how it ended, and every refund. */
function timelineFor(payment: PaymentDetailData): ActivityItem[] {
  const at = (iso: string) => `${fmtDateTime(iso)} ICT`;
  const events: Array<{ when: number; item: ActivityItem }> = [];
  const add = (when: string, item: ActivityItem) => events.push({ when: Date.parse(when), item });

  add(payment.createdAt, { id: "created", state: "done", title: "Payment created", detail: payment.transactionId, time: at(payment.createdAt), icon: <ReceiptIcon size={16} /> });
  if (payment.providerCreatedAt) add(payment.providerCreatedAt, { id: "provider", state: "done", title: "PayWay transaction created", detail: providerLabel(payment.provider), time: at(payment.providerCreatedAt), icon: <BankIcon size={16} /> });
  if (payment.status === "paid" && payment.paidAt) add(payment.paidAt, { id: "paid", state: "done", title: "Paid", detail: [payment.method, payment.approvalCode ? `Approval ${payment.approvalCode}` : null, payment.bankRef ? `Ref ${payment.bankRef}` : null].filter(Boolean).join(" · ") || undefined, time: at(payment.paidAt), icon: <CheckCircleIcon size={16} /> });
  if (payment.status === "failed") add(payment.failedAt ?? payment.updatedAt, { id: "failed", state: "failed", title: "Failed", detail: payment.review ?? undefined, time: at(payment.failedAt ?? payment.updatedAt), icon: <XCircleIcon size={16} /> });

  let cumulative = 0;
  for (const refund of payment.refunds) {
    if (refund.status === "completed") {
      cumulative += refund.amountMinor;
      const full = cumulative >= payment.amountMinor;
      add(refund.completedAt ?? refund.createdAt, { id: refund.id, state: "done", title: full ? "Full refund" : "Partial refund", detail: `${(refund.amountMinor / 100).toFixed(2)} ${refund.currency} — ${refund.reason}${refund.initiatedBy ? ` (${refund.initiatedBy})` : ""}`, time: at(refund.completedAt ?? refund.createdAt), icon: <ArrowCounterClockwiseIcon size={16} /> });
    } else if (refund.status === "failed") {
      add(refund.failedAt ?? refund.createdAt, { id: refund.id, state: "failed", title: "Refund declined", detail: `${(refund.amountMinor / 100).toFixed(2)} ${refund.currency} — ${refund.providerMessage ?? refund.reason}`, time: at(refund.failedAt ?? refund.createdAt), icon: <XCircleIcon size={16} /> });
    } else {
      add(refund.createdAt, { id: refund.id, state: "current", title: "Refund pending", detail: `${(refund.amountMinor / 100).toFixed(2)} ${refund.currency} — waiting for PayWay to confirm`, time: at(refund.createdAt), icon: <ClockIcon size={16} /> });
    }
  }

  const sorted = events.sort((a, b) => a.when - b.when).map((entry) => entry.item);
  if (payment.status === "pending") sorted.push({ id: "pending", state: "current", title: "Pending", detail: "Waiting for the provider to confirm the payment.", time: "Awaiting confirmation", icon: <ClockIcon size={16} /> });
  return sorted;
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
  const refundDialog = useOverlayState();
  const mutations = usePaymentMutations(payment.transactionId);
  const { customer, booking } = payment;
  const paid = payment.status === "paid" ? (payment.paidAmountMinor ?? payment.amountMinor) : 0;

  async function sync() {
    try {
      await mutations.sync.mutateAsync();
      toast.success("Synchronised with ABA PayWay");
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The PayWay record could not be refreshed.");
    }
  }

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Payments", href: "/admin/payments" }, { label: payment.transactionId }]} />

      <header className="adminHero flex flex-col gap-3 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="break-all text-2xl font-extrabold tracking-tight sm:text-3xl">Payment {payment.transactionId}</h1>
            <PaymentStatusBadge status={badgeStatus(payment)} />
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{fmtDateTime(payment.createdAt)} (Asia/Phnom_Penh) · {providerLabel(payment.provider)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" isPending={mutations.sync.isPending} onPress={() => void sync()}><ArrowsClockwiseIcon />Sync from PayWay</Button>
          {payment.refundEligibility.allowed ? <Button variant="danger" className="min-h-11" onPress={refundDialog.open}><ArrowCounterClockwiseIcon />Refund Payment</Button> : null}
        </div>
      </header>
      {payment.status === "paid" && !payment.refundEligibility.allowed && payment.refundEligibility.reason ? <p className="text-xs font-semibold text-[var(--admin-muted)]">Refund unavailable: {payment.refundEligibility.reason}</p> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card title="Transaction">
            <dl className="space-y-3">
              <Row label="PayWay transaction ID">{payment.transactionId}</Row>
              <Row label="Status"><PaymentStatusBadge status={badgeStatus(payment)} /></Row>
              <Row label="Provider"><span className="inline-flex items-center gap-1.5"><CreditCardIcon size={14} aria-hidden />{providerLabel(payment.provider)}</span></Row>
              <Row label="Payment method">{payment.method ?? "Not reported yet"}</Row>
              <Row label="Provider status">{payment.providerStatus ?? dash}</Row>
              <Row label="Approval code">{payment.approvalCode ?? dash}</Row>
              <Row label="Bank reference">{payment.bankRef ?? dash}</Row>
              <Row label="Payer account">{payment.payerAccount ?? dash}</Row>
              <Row label="Bank">{payment.bankName ?? dash}</Row>
              {payment.cardSource ? <Row label="Card source">{payment.cardSource}</Row> : null}
              <Row label="Transaction date">{fmtDateTime(payment.providerCreatedAt ?? payment.createdAt)} ICT</Row>
              {payment.paidAt ? <Row label="Paid">{fmtDateTime(payment.paidAt)} ICT</Row> : null}
              {payment.review ? <Row label="Provider note">{payment.review}</Row> : null}
              <Row label="Last synchronised">{payment.detailsSyncedAt ? `${fmtDateTime(payment.detailsSyncedAt)} ICT` : "Not synchronised yet"}</Row>
            </dl>
          </Card>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            <Card title="Customer" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={() => router.push(`/admin/customers/${customer.id}`)}>View<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{customer.reference}</p></div></div>
              <ul className="space-y-2.5 text-sm"><li className="flex items-center gap-2"><PhoneIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.phone ?? dash}</li><li className="flex items-center gap-2 break-all"><EnvelopeSimpleIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.email ?? dash}</li></ul>
            </Card>

            <Card title="Related Booking" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={() => router.push(`/admin/bookings/${booking.reference}`)}>View Booking<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-3 flex items-center gap-3"><VehiclePhoto vehicle={{ id: booking.vehicleId, name: booking.vehicleName, vehicleType: booking.vehicleType, images: booking.vehicleImage ? [booking.vehicleImage] : [] }} className="h-14 w-20 shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="80px" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{booking.vehicleName}</p><p className="text-xs text-[var(--admin-muted)]">{booking.reference}</p></div></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CalendarCheckIcon size={16} className="mt-0.5 shrink-0 text-[var(--admin-muted)]" aria-hidden />{fmtDateTime(booking.pickupAt)} → {fmtDateTime(booking.returnAt)}</li>
                <li className="flex items-center gap-2"><MapPinIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{booking.pickupLocation.name}{booking.returnLocation.name !== booking.pickupLocation.name ? ` → ${booking.returnLocation.name}` : ""}</li>
              </ul>
            </Card>
          </div>

          <Card title="Refunds">
            {payment.refunds.length ? (
              <ul className="divide-y divide-[var(--admin-border)]">
                {payment.refunds.map((refund) => (
                  <li key={refund.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0"><p className="text-sm font-bold"><CurrencyAmount amount={refund.amountMinor} currency={refund.currency} /> <span className="ml-1 text-xs font-semibold capitalize text-[var(--admin-muted)]">{refund.status}</span></p><p className="text-xs text-[var(--admin-muted)]">{refund.reason}{refund.initiatedBy ? ` · ${refund.initiatedBy}` : ""}</p>{refund.status === "failed" && refund.providerMessage ? <p className="text-xs text-[var(--admin-danger)]">{refund.providerMessage}{refund.providerCode ? ` (${refund.providerCode})` : ""}</p> : null}</div>
                    <p className="text-xs text-[var(--admin-muted)]">{fmtDateTime(refund.completedAt ?? refund.failedAt ?? refund.createdAt)} ICT</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-[var(--admin-muted)]">No refunds have been made for this payment.</p>}
            {payment.providerOperations.length ? (
              <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
                <h3 className="mb-2 text-xs font-extrabold text-[var(--admin-muted)]">PayWay operations</h3>
                <ul className="space-y-1.5 text-xs">
                  {payment.providerOperations.map((operation, index) => <li key={`${operation.status}-${index}`} className="flex justify-between gap-3"><span className="font-semibold">{operation.status}{operation.amountMinor !== null ? ` · ${(operation.amountMinor / 100).toFixed(2)} ${payment.currency}` : ""}</span><span className="text-[var(--admin-muted)]">{operation.at ? `${fmtDateTime(operation.at)} ICT` : dash}{operation.bankRef ? ` · ${operation.bankRef}` : ""}</span></li>)}
                </ul>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card title="Payment Timeline"><ActivityTimeline items={timelineFor(payment)} /></Card>
          <Card title="Amount">
            <dl className="space-y-2.5">
              <Row label="Original amount"><CurrencyAmount amount={payment.amountMinor} currency={payment.currency} /></Row>
              <Row label="Paid amount"><CurrencyAmount amount={paid} currency={payment.currency} /></Row>
              <Row label="Refunded amount">{payment.refundedMinor > 0 ? <span className="text-[var(--admin-danger)]">−<CurrencyAmount amount={payment.refundedMinor} currency={payment.currency} /></span> : <CurrencyAmount amount={0} currency={payment.currency} />}</Row>
              <Row label="Remaining refundable"><CurrencyAmount amount={payment.status === "paid" ? payment.refundableMinor : 0} currency={payment.currency} /></Row>
              <Row label="Processing fee"><span className="font-medium text-[var(--admin-muted)]">Not provided by PayWay</span></Row>
              <div className="mt-1 flex items-end justify-between gap-3 rounded-xl bg-[var(--admin-accent-soft)] p-3"><dt className="text-sm font-extrabold">Net after refunds</dt><dd className="text-right"><CurrencyAmount amount={Math.max(0, paid - payment.refundedMinor)} currency={payment.currency} className="text-xl font-extrabold" /><span className="block text-[11px] text-[var(--admin-muted)]">Paid amount − refunded amount</span></dd></div>
            </dl>
          </Card>
        </div>
      </div>

      <RefundDialog payment={payment} isOpen={refundDialog.isOpen} onOpenChange={refundDialog.setOpen} />
    </AdminPage>
  );
}
