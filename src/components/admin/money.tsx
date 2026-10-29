import { cn } from "@/lib/cn";

export type CurrencyCode = "USD" | "KHR";

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount / 100)
    : `៛${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function CurrencyAmount({ amount, currency, className, showCode = false }: { amount: number; currency: CurrencyCode; className?: string; showCode?: boolean }) {
  return (
    <span className={cn("whitespace-nowrap font-semibold tabular-nums", className)}>
      {formatCurrency(amount, currency)}
      {showCode ? <span className="ml-1 text-[11px] font-medium text-[var(--admin-muted)]">{currency}</span> : null}
    </span>
  );
}
