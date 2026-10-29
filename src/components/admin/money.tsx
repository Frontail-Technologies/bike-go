import { cn } from "@/lib/cn";
import { formatMinor, type CurrencyCode } from "@/lib/format";

export type { CurrencyCode } from "@/lib/format";

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return formatMinor(amount, currency);
}

export function CurrencyAmount({ amount, currency, className, showCode = false }: { amount: number; currency: CurrencyCode; className?: string; showCode?: boolean }) {
  return (
    <span className={cn("whitespace-nowrap font-semibold tabular-nums", className)}>
      {formatMinor(amount, currency)}
      {showCode ? <span className="ml-1 text-[11px] font-medium text-[var(--admin-muted)]">{currency}</span> : null}
    </span>
  );
}
