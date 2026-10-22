const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Rates and ranges: whole dollars ("$15"), cents only when there are some ("$5.40"). */
export function formatPrice(amount: number) {
  return Number.isInteger(amount) ? usdWhole.format(amount) : usdCents.format(amount);
}

/** Itemised amounts and totals: always two decimals, so a column of figures lines up ("$30.00"). */
export function formatMoney(amount: number) {
  return usdCents.format(amount);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(value);
}
