export type CurrencyCode = "USD" | "KHR";

const fractionDigits: Record<CurrencyCode, number> = { USD: 2, KHR: 0 };

export function toMajor(minor: number, currency: CurrencyCode = "USD") {
  return minor / 10 ** fractionDigits[currency];
}

export function toMinor(major: number, currency: CurrencyCode = "USD") {
  return Math.round(major * 10 ** fractionDigits[currency]);
}

export function formatMinor(
  minor: number,
  currency: CurrencyCode = "USD",
  options: { compact?: boolean; showCode?: boolean; locale?: string } = {},
) {
  const digits = fractionDigits[currency];
  const formatted = new Intl.NumberFormat(options.locale ?? "en-US", {
    style: "currency",
    currency,
    currencyDisplay: options.showCode ? "code" : "symbol",
    notation: options.compact ? "compact" : "standard",
    minimumFractionDigits: options.compact ? 0 : digits,
    maximumFractionDigits: options.compact ? 1 : digits,
  }).format(toMajor(minor, currency));
  return formatted.replace(/\s+/g, " ").trim();
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatMoney(amount: number) {
  return formatMinor(toMinor(amount), "USD");
}
