export const CURRENCIES = ["USD", "KHR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const MINOR_EXPONENT: Record<Currency, number> = { USD: 2, KHR: 2 };

export function assertMinor(amount: number, label = "amount") {
  if (!Number.isSafeInteger(amount)) throw new RangeError(`${label} must be an integer number of minor units, got ${amount}`);
  return amount;
}

export function addMinor(...amounts: number[]) {
  return amounts.reduce((sum, amount) => sum + assertMinor(amount), 0);
}

export function multiplyMinor(amount: number, quantity: number) {
  assertMinor(amount);
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new RangeError(`quantity must be a non-negative integer, got ${quantity}`);
  return amount * quantity;
}

export function percentOfMinor(amount: number, rateBps: number) {
  assertMinor(amount);
  if (!Number.isSafeInteger(rateBps) || rateBps < 0) throw new RangeError(`rateBps must be a non-negative integer, got ${rateBps}`);
  return Number((BigInt(amount) * BigInt(rateBps) + 5000n) / 10000n);
}

export function toMinor(decimal: string, currency: Currency) {
  const exponent = MINOR_EXPONENT[currency];
  const match = /^(\d+)(?:\.(\d+))?$/.exec(decimal.trim());
  if (!match) throw new RangeError(`Not a valid amount: "${decimal}"`);
  const fraction = (match[2] ?? "").padEnd(exponent, "0");
  if (fraction.length > exponent && /[1-9]/.test(fraction.slice(exponent))) throw new RangeError(`"${decimal}" has more decimals than ${currency} allows`);
  return Number(`${match[1]}${fraction.slice(0, exponent)}`);
}

export function formatMinor(amount: number, currency: Currency, locale = "en-US") {
  const exponent = MINOR_EXPONENT[currency];
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: exponent, maximumFractionDigits: exponent }).format(amount / 10 ** exponent);
}
