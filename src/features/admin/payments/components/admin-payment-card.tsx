"use client";

import { Button } from "@heroui/react";
import { CalendarBlankIcon, CreditCardIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import { PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { CurrencyAmount } from "@/components/admin/money";
import { badgeStatus, fmtShort, providerLabel } from "../lib/payment-model";
import type { Payment } from "../types/payment";

export function AdminPaymentCard({ payment, onView }: { payment: Payment; onView: (payment: Payment) => void }) {
  return (
    <article className="adminSurface adminLift flex min-w-0 flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1"><h3 className="truncate text-[15px] font-extrabold leading-tight">{payment.transactionId}</h3><p className="text-xs text-[var(--admin-muted)]">{fmtShort(payment.createdAt)} ICT</p></div>
        <PaymentStatusBadge status={badgeStatus(payment)} />
      </header>
      <div className="flex items-center gap-2.5">
        <CustomerAvatar name={payment.customer.name} size="sm" className="size-8 text-[11px]" />
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{payment.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{payment.customer.reference}</p></div>
      </div>
      <div className="adminTile rounded-xl p-3">
        <p className="text-[11px] font-medium text-[var(--admin-muted)]">Amount</p>
        <CurrencyAmount amount={payment.amountMinor} currency={payment.currency} showCode className="text-lg font-extrabold" />
        {payment.refundedMinor > 0 ? <p className="mt-1 text-xs text-[var(--admin-danger)]">−<CurrencyAmount amount={payment.refundedMinor} currency={payment.currency} /> refunded</p> : null}
      </div>
      <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
        <li className="flex items-center gap-2"><LinkSimpleIcon size={14} className="shrink-0" aria-hidden />Booking {payment.booking.reference}</li>
        <li className="flex items-center gap-2"><CreditCardIcon size={14} className="shrink-0" aria-hidden />{providerLabel(payment.provider)}{payment.method ? " · " + payment.method : ""}</li>
        <li className="flex items-center gap-2"><CalendarBlankIcon size={14} className="shrink-0" aria-hidden />{payment.booking.vehicleName}</li>
      </ul>
      <Button variant="outline" className="mt-auto min-h-11 md:min-h-9" onPress={() => onView(payment)}>View Details</Button>
    </article>
  );
}
