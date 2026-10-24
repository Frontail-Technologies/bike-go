"use client";

import { Button } from "@heroui/react";
import { BriefcaseIcon, CalendarBlankIcon, TimerIcon } from "@phosphor-icons/react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { LoanStatusBadge } from "@/components/admin/loans/loan-parts";
import { CurrencyAmount } from "@/components/admin/money";
import { employmentLabels, loanTypeLabel } from "../lib/loan-model";
import type { Loan } from "../types/loan";
import { fmtDate } from "./loan-format";

export function AdminLoanApplicationCard({ loan, onReview }: { loan: Loan; onReview: (loan: Loan) => void }) {
  const employment = [loan.employment.employmentType ? employmentLabels[loan.employment.employmentType] ?? loan.employment.employmentType : null, loan.employment.employerName].filter(Boolean).join(" · ");
  return (
    <article className="adminSurface adminLift flex min-w-0 flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start gap-3">
        <CustomerAvatar name={loan.customer.name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-extrabold leading-tight">{loan.customer.name}</h3>
          <p className="text-xs text-[var(--admin-muted)]">{loan.reference} · {loanTypeLabel(loan.loanType)}</p>
        </div>
      </header>
      <div className="adminTile flex flex-wrap items-end justify-between gap-x-3 gap-y-2 rounded-xl p-3">
        <div><p className="text-[11px] font-medium text-[var(--admin-muted)]">Requested amount</p><CurrencyAmount amount={loan.requestedAmountMinor} currency={loan.currency} showCode className="text-lg font-extrabold" /></div>
        <LoanStatusBadge status={loan.status} />
      </div>
      <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
        <li className="flex items-center gap-2"><TimerIcon size={14} className="shrink-0" aria-hidden />{loan.tenureMonths} months</li>
        {employment ? <li className="flex items-center gap-2"><BriefcaseIcon size={14} className="shrink-0" aria-hidden /><span className="truncate">{employment}</span></li> : null}
        <li className="flex items-center gap-2"><CalendarBlankIcon size={14} className="shrink-0" aria-hidden />{loan.submittedAt ? `Submitted ${fmtDate(loan.submittedAt)}` : `Started ${fmtDate(loan.createdAt)}`}</li>
      </ul>
      <Button variant="outline" className="mt-auto min-h-11 md:min-h-9" onPress={() => onReview(loan)}>Review</Button>
    </article>
  );
}
