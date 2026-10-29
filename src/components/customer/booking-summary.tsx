"use client";

import { Separator } from "@heroui/react";
import { PriceDisplay } from "@/components/customer/price-display";
import { useTranslations } from "@/i18n/hooks";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

export type SummaryLine = { id: string; label?: string; days?: number; rate?: number; amount: number; refundable?: boolean };

type BookingSummaryProps = {
  lines: SummaryLine[];
  totalLabel?: "totalAmount" | "totalPayable" | "totalPaid";
  totalAmount?: number;
  className?: string;
};

export function BookingSummary({ lines, totalLabel = "totalAmount", totalAmount, className }: BookingSummaryProps) {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const labelOf = (line: SummaryLine) => {
    if (line.label) return line.label;
    if (line.id === "rental") return t("lineRental", { days: common("days", { count: line.days ?? 1 }) });
    if (line.id === "tax") return t("lineTax", { rate: line.rate ?? 0 });
    if (line.id === "helmet") return t("lineHelmet");
    if (line.id === "jacket") return t("lineJacket");
    if (line.id === "fee") return t("lineFee");
    return t("lineDeposit");
  };
  const total = totalAmount ?? lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <section aria-label={t("summaryAria")} className={cn("rounded-card border border-line bg-surface p-4 shadow-card", className)}>
      <dl className="flex flex-col gap-3 text-sm">
        {lines.map((line, index) => (
          <div key={`${line.id}-${index}`} className="flex items-center justify-between gap-4">
            <dt className="text-subtle">
              {labelOf(line)}
              {line.refundable ? <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">{t("refundable")}</span> : null}
            </dt>
            <dd className="tabular font-semibold">{formatMoney(line.amount)}</dd>
          </div>
        ))}
      </dl>
      <Separator className="my-4" />
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-bold">{t(totalLabel)}</span>
        <span data-testid="summary-total">
          <PriceDisplay amount={Math.round(total * 100) / 100} unit={null} size="lg" precise />
        </span>
      </div>
    </section>
  );
}
