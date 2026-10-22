import { Separator } from "@heroui/react";
import { PriceDisplay } from "@/components/customer/price-display";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export type SummaryLine = { label: string; amount: number; hint?: string };

type BookingSummaryProps = {
  lines: SummaryLine[];
  totalLabel?: string;
  className?: string;
};

/** Itemised amounts with a total. The total is always the sum of the lines shown. */
export function BookingSummary({ lines, totalLabel = "Total amount", className }: BookingSummaryProps) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <section aria-label="Booking summary" className={cn("rounded-card border border-line bg-surface p-4 shadow-card", className)}>
      <dl className="flex flex-col gap-3 text-sm">
        {lines.map((line) => (
          <div key={line.label} className="flex items-center justify-between gap-4">
            <dt className="text-subtle">
              {line.label}
              {line.hint ? <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">{line.hint}</span> : null}
            </dt>
            <dd className="tabular font-semibold">{formatPrice(line.amount)}</dd>
          </div>
        ))}
      </dl>
      <Separator className="my-4" />
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-bold">{totalLabel}</span>
        <span data-testid="summary-total">
          <PriceDisplay amount={total} unit={null} size="lg" />
        </span>
      </div>
    </section>
  );
}
