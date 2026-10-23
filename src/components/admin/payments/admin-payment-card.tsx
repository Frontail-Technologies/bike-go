"use client";

import { Button } from "@heroui/react";
import { CalendarBlankIcon, CreditCardIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { CurrencyAmount } from "@/components/admin/money";
import { type Payment, fmtShort } from "./payment-data";
import { PaymentStatusBadge, PaymentTypeBadge } from "./payment-parts";

export function AdminPaymentCard({ payment, onView }: { payment: Payment; onView: (payment: Payment) => void }) {
  return (
    <article className="adminSurface adminLift flex min-w-0 flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1"><h3 className="text-[15px] font-extrabold leading-tight">{payment.reference}</h3><p className="text-xs text-[var(--admin-muted)]">{fmtShort(payment.createdAt)} ICT</p></div>
        <PaymentStatusBadge status={payment.status} />
      </header>
      <div className="flex items-center gap-2.5">
        <CustomerAvatar name={payment.customer.name} size="sm" className="size-8 text-[11px]" />
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{payment.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{payment.customer.reference}</p></div>
      </div>
      <div className="adminTile flex flex-wrap items-end justify-between gap-x-3 gap-y-2 rounded-xl p-3">
        <div><p className="text-[11px] font-medium text-[var(--admin-muted)]">Amount</p><CurrencyAmount amount={payment.amount} currency={payment.currency} showCode className="text-lg font-extrabold" /></div>
        <PaymentTypeBadge type={payment.type} />
      </div>
      <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
        <li className="flex items-center gap-2"><LinkSimpleIcon size={14} className="shrink-0" aria-hidden />{payment.type === "booking" ? "Booking" : "Loan"} {payment.relatedReference}</li>
        <li className="flex items-center gap-2"><CreditCardIcon size={14} className="shrink-0" aria-hidden />{payment.method ?? "No method yet"}</li>
        <li className="flex items-center gap-2"><CalendarBlankIcon size={14} className="shrink-0" aria-hidden />{payment.description}</li>
      </ul>
      <Button variant="outline" className="mt-auto min-h-11 md:min-h-9" onPress={() => onView(payment)}>View Details</Button>
    </article>
  );
}
