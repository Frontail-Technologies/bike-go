"use client";

import { useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, ArrowRightIcon, ArrowsClockwiseIcon, BankIcon, CalendarCheckIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, ReceiptIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdminButton as Button } from "@/components/admin/controls";
import { PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/data-display/misc";
import { DetailCard as Card, DetailRow as Row } from "@/components/admin/data-display/detail";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { usePaymentMutations, usePaymentQuery } from "../hooks/use-payments";
import { badgeStatus, fmtDateTime, providerLabel } from "../lib/payment-model";
import type { PaymentDetail as PaymentDetailData } from "../types/payment";
import { RefundDialog } from "./refund-dialog";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { adminT } from "@/features/admin/i18n/translate";

const dash = "—";

function timelineFor(payment: PaymentDetailData): ActivityItem[] {
  const meta: Record<PaymentDetailData["timeline"][number]["kind"], { title: string; state: ActivityItem["state"]; icon: ReactNode }> = {
    created: { title: adminT("payments.timeline.created"), state: "done", icon: <ReceiptIcon size={16} /> },
    provider_created: { title: adminT("payments.timeline.provider_created"), state: "done", icon: <BankIcon size={16} /> },
    paid: { title: adminT("payments.timeline.paid"), state: "done", icon: <CheckCircleIcon size={16} /> },
    failed: { title: adminT("payments.timeline.failed"), state: "failed", icon: <XCircleIcon size={16} /> },
    refund_pending: { title: adminT("payments.timeline.refund_pending"), state: "current", icon: <ClockIcon size={16} /> },
    refund_completed: { title: adminT("payments.timeline.refund_completed"), state: "done", icon: <ArrowCounterClockwiseIcon size={16} /> },
    refund_failed: { title: adminT("payments.timeline.refund_failed"), state: "failed", icon: <XCircleIcon size={16} /> },
  };
  return payment.timeline.map((event, index) => ({
    id: `${event.kind}-${event.at}-${index}`,
    state: meta[event.kind].state,
    title: meta[event.kind].title,
    detail: [event.amountMinor === null ? null : `${(event.amountMinor / 100).toFixed(2)} ${payment.currency}`, event.actor].filter(Boolean).join(" · ") || undefined,
    time: `${fmtDateTime(event.at)} ICT`,
    icon: meta[event.kind].icon,
  }));
}

export function PaymentDetail({ transactionId }: { transactionId: string }) {
  const t = useAdminTranslations();
  const query = usePaymentQuery(transactionId);
  const payment = query.data;
  if (query.isError && !payment) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 422);
    return <AdminPage><PageHeader title={t("pages.payments.detail")} /><AdminErrorState title={notFound ? t("payments.detail.notFound") : t("payments.detail.paymentLoadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!payment) return <AdminPage><PageHeader title={t("pages.payments.detail")} /><AdminLoadingState label={t("payments.detail.loadingPayment")} /></AdminPage>;
  return <PaymentWorkspace payment={payment} />;
}

function PaymentWorkspace({ payment }: { payment: PaymentDetailData }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const refundDialog = useOverlayState();
  const mutations = usePaymentMutations(payment.transactionId);
  const { customer, booking } = payment;
  const paid = payment.status === "paid" ? (payment.paidAmountMinor ?? payment.amountMinor) : 0;

  async function sync() {
    try {
      await mutations.sync.mutateAsync();
      toast.success(t("payments.detail.synced"));
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : t("payments.detail.syncError"));
    }
  }

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: t("pages.payments.title"), href: "/admin/payments" }, { label: payment.transactionId }]} />

      <header className="adminHero flex flex-col gap-3 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="break-all text-2xl font-extrabold tracking-tight sm:text-3xl">{t("payments.detail.title", { id: payment.transactionId })}</h1>
            <PaymentStatusBadge status={badgeStatus(payment)} />
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("payments.detail.createdAt", { date: fmtDateTime(payment.createdAt) })} · {providerLabel(payment.provider)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" isPending={mutations.sync.isPending} onPress={() => void sync()}><ArrowsClockwiseIcon />{t("payments.detail.sync")}</Button>
          {payment.refundEligibility.allowed ? <Button variant="danger" className="min-h-11" onPress={refundDialog.open}><ArrowCounterClockwiseIcon />{t("payments.detail.refund")}</Button> : null}
        </div>
      </header>
      {payment.status === "paid" && !payment.refundEligibility.allowed && payment.refundEligibility.reason ? <p className="text-xs font-semibold text-[var(--admin-muted)]">{t("payments.detail.refundUnavailable", { reason: payment.refundEligibility.reason })}</p> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-5">
          <Card title={t("payments.detail.transaction")}>
            <dl className="space-y-3">
              <Row label={t("payments.detail.transactionId")}>{payment.transactionId}</Row>
              <Row label={t("payments.detail.status")}><PaymentStatusBadge status={badgeStatus(payment)} /></Row>
              <Row label={t("payments.detail.provider")}><span className="inline-flex items-center gap-1.5"><CreditCardIcon size={14} aria-hidden />{providerLabel(payment.provider)}</span></Row>
              <Row label={t("payments.detail.method")}>{payment.method ?? t("payments.detail.notReported")}</Row>
              <Row label={t("payments.detail.providerStatus")}>{payment.providerStatus ?? dash}</Row>
              <Row label={t("payments.detail.approvalCode")}>{payment.approvalCode ?? dash}</Row>
              <Row label={t("payments.detail.bankRef")}>{payment.bankRef ?? dash}</Row>
              <Row label={t("payments.detail.payerAccount")}>{payment.payerAccount ?? dash}</Row>
              <Row label={t("payments.detail.bank")}>{payment.bankName ?? dash}</Row>
              {payment.cardSource ? <Row label={t("payments.detail.cardSource")}>{payment.cardSource}</Row> : null}
              <Row label={t("payments.detail.transactionDate")}>{fmtDateTime(payment.providerCreatedAt ?? payment.createdAt)} ICT</Row>
              {payment.paidAt ? <Row label={t("payments.detail.paid")}>{fmtDateTime(payment.paidAt)} ICT</Row> : null}
              {payment.review ? <Row label={t("payments.detail.providerNote")}>{payment.review}</Row> : null}
              <Row label={t("payments.detail.lastSynced")}>{payment.detailsSyncedAt ? `${fmtDateTime(payment.detailsSyncedAt)} ICT` : t("payments.detail.notSynced")}</Row>
            </dl>
          </Card>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            <Card title={t("payments.detail.customer")} action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={() => router.push(`/admin/customers/${customer.id}`)}>{t("payments.detail.view")}<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{customer.reference}</p></div></div>
              <ul className="space-y-2.5 text-sm"><li className="flex items-center gap-2"><PhoneIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.phone ?? dash}</li><li className="flex items-center gap-2 break-all"><EnvelopeSimpleIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{customer.email ?? dash}</li></ul>
            </Card>

            <Card title={t("payments.detail.relatedBooking")} action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={() => router.push(`/admin/bookings/${booking.reference}`)}>{t("payments.detail.viewBooking")}<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-3 flex items-center gap-3"><VehiclePhoto vehicle={{ id: booking.vehicleId, name: booking.vehicleName, vehicleType: booking.vehicleType, images: booking.vehicleImage ? [booking.vehicleImage] : [] }} className="h-14 w-20 shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="80px" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{booking.vehicleName}</p><p className="text-xs text-[var(--admin-muted)]">{booking.reference}</p></div></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CalendarCheckIcon size={16} className="mt-0.5 shrink-0 text-[var(--admin-muted)]" aria-hidden />{fmtDateTime(booking.pickupAt)} → {fmtDateTime(booking.returnAt)}</li>
                <li className="flex items-center gap-2"><MapPinIcon size={16} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />{booking.pickupLocation.name}{booking.returnLocation.name !== booking.pickupLocation.name ? ` → ${booking.returnLocation.name}` : ""}</li>
              </ul>
            </Card>
          </div>

          <Card title={t("payments.detail.refunds")}>
            {payment.refunds.length ? (
              <ul className="divide-y divide-[var(--admin-border)]">
                {payment.refunds.map((refund) => (
                  <li key={refund.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0"><p className="text-sm font-bold"><CurrencyAmount amount={refund.amountMinor} currency={refund.currency} /> <span className="ml-1 text-xs font-semibold text-[var(--admin-muted)]">{t(`payments.detail.refundStatus.${refund.status}`)}</span></p><p className="text-xs text-[var(--admin-muted)]">{refund.reason}{refund.initiatedBy ? ` · ${refund.initiatedBy}` : ""}</p>{refund.status === "failed" && refund.providerMessage ? <p className="text-xs text-[var(--admin-danger)]">{refund.providerMessage}{refund.providerCode ? ` (${refund.providerCode})` : ""}</p> : null}</div>
                    <p className="text-xs text-[var(--admin-muted)]">{fmtDateTime(refund.completedAt ?? refund.failedAt ?? refund.createdAt)} ICT</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-[var(--admin-muted)]">{t("payments.detail.noRefunds")}</p>}
            {payment.providerOperations.length ? (
              <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
                <h3 className="mb-2 text-xs font-extrabold text-[var(--admin-muted)]">{t("payments.detail.operations")}</h3>
                <ul className="space-y-1.5 text-xs">
                  {payment.providerOperations.map((operation, index) => <li key={`${operation.status}-${index}`} className="flex justify-between gap-3"><span className="font-semibold">{operation.status}{operation.amountMinor !== null ? ` · ${(operation.amountMinor / 100).toFixed(2)} ${payment.currency}` : ""}</span><span className="text-[var(--admin-muted)]">{operation.at ? `${fmtDateTime(operation.at)} ICT` : dash}{operation.bankRef ? ` · ${operation.bankRef}` : ""}</span></li>)}
                </ul>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card title={t("payments.detail.timeline")}><ActivityTimeline items={timelineFor(payment)} /></Card>
          <Card title={t("payments.detail.amount")}>
            <dl className="space-y-2.5">
              <Row label={t("payments.detail.original")}><CurrencyAmount amount={payment.amountMinor} currency={payment.currency} /></Row>
              <Row label={t("payments.detail.paidAmount")}><CurrencyAmount amount={paid} currency={payment.currency} /></Row>
              <Row label={t("payments.detail.refundedAmount")}>{payment.refundedMinor > 0 ? <span className="text-[var(--admin-danger)]">−<CurrencyAmount amount={payment.refundedMinor} currency={payment.currency} /></span> : <CurrencyAmount amount={0} currency={payment.currency} />}</Row>
              <Row label={t("payments.detail.remaining")}><CurrencyAmount amount={payment.status === "paid" ? payment.refundableMinor : 0} currency={payment.currency} /></Row>
              <Row label={t("payments.detail.fee")}><span className="font-medium text-[var(--admin-muted)]">{t("payments.detail.feeMissing")}</span></Row>
              <div className="mt-1 flex items-end justify-between gap-3 rounded-xl bg-[var(--admin-accent-soft)] p-3"><dt className="text-sm font-extrabold">{t("payments.detail.net")}</dt><dd className="text-right"><CurrencyAmount amount={payment.netMinor} currency={payment.currency} className="text-xl font-extrabold" /><span className="block text-[11px] text-[var(--admin-muted)]">{t("payments.detail.netHint")}</span></dd></div>
            </dl>
          </Card>
        </div>
      </div>

      <RefundDialog payment={payment} isOpen={refundDialog.isOpen} onOpenChange={refundDialog.setOpen} />
    </AdminPage>
  );
}
