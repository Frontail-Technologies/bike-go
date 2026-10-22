import { BankIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { type LoanApplication, getLoanType } from "./data";
import { LoanStatusBadge } from "./loan-status-badge";

export function ApplicationCard({ application }: { application: LoanApplication }) {
  const type = getLoanType(application.loanType);

  return (
    <Link
      href={`/loans/${application.reference}`}
      className="flex min-w-0 items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.99] motion-reduce:transition-none"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
        <BankIcon size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold">{type?.name ?? "Loan"}</span>
        <span className="tabular truncate text-xs text-subtle">
          {formatPrice(application.amount)} · {application.tenure} months · {application.reference}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <LoanStatusBadge status={application.status} />
          <span className="text-xs text-subtle">Applied {formatDate(application.createdAt, { day: "numeric", month: "short" })}</span>
        </span>
      </span>
      <CaretRightIcon size={16} className="shrink-0 text-subtle" />
    </Link>
  );
}
