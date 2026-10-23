import { intlLocale } from "@/i18n/hooks";

const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatPrice(amount: number) {
  return Number.isInteger(amount) ? usdWhole.format(amount) : usdCents.format(amount);
}

export function formatMoney(amount: number) {
  return usdCents.format(amount);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(value);
}
