"use client";

import { Button } from "@heroui/react";
import { BriefcaseIcon, CalendarBlankIcon, TimerIcon } from "@phosphor-icons/react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { CurrencyAmount } from "@/components/admin/money";
import { type Loan, fmtDate } from "./loan-data";
import { LoanStatusBadge } from "./loan-parts";

export function AdminLoanApplicationCard({ loan, onReview }: { loan: Loan; onReview: (loan: Loan) => void }) {
  return (
    <article className="adminSurface adminLift flex min-w-0 flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start gap-3">
        <CustomerAvatar name={loan.applicant.name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-extrabold leading-tight">{loan.applicant.name}</h3>
          <p className="text-xs text-[var(--admin-muted)]">{loan.reference} · {loan.loanType}</p>
        </div>
      </header>
      <div className="adminTile flex flex-wrap items-end justify-between gap-x-3 gap-y-2 rounded-xl p-3">
        <div><p className="text-[11px] font-medium text-[var(--admin-muted)]">Requested amount</p><CurrencyAmount amount={loan.requestedMinor} currency={loan.currency} showCode className="text-lg font-extrabold" /></div>
        <LoanStatusBadge status={loan.status} />
      </div>
      <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
        <li className="flex items-center gap-2"><TimerIcon size={14} className="shrink-0" aria-hidden />{loan.tenureMonths} months</li>
        <li className="flex items-center gap-2"><BriefcaseIcon size={14} className="shrink-0" aria-hidden /><span className="truncate">{loan.employment.type} · {loan.employment.employer}</span></li>
        <li className="flex items-center gap-2"><CalendarBlankIcon size={14} className="shrink-0" aria-hidden />Submitted {fmtDate(loan.submittedAt)}</li>
      </ul>
      <Button variant="outline" className="mt-auto min-h-11 md:min-h-9" onPress={() => onReview(loan)}>Review</Button>
    </article>
  );
}
