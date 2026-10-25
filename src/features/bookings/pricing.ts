import type { SummaryLine } from "@/components/customer/booking-summary";
import type { Motorcycle } from "@/features/vehicles/view-model";

export const HELMET_PER_DAY = 2;
export const JACKET_PER_DAY = 2;
export const TAX_RATE = 0.18;
export const PLATFORM_FEE = 1;

const round2 = (n: number) => Math.round(n * 100) / 100;

export type AddOns = Record<string, boolean>;

export type Quote = {
  days: number;
  rental: number;
  helmet: number;
  jacket: number;
  addons?: { code: string; name: string; amount: number }[];
  tax: number;
  fee: number;
  deposit: number;
  payable: number;
  taxRate?: number;
};

export function getQuote(bike: Motorcycle, days: number, addOns: AddOns): Quote {
  const rental = bike.pricePerDay * days;
  const helmet = addOns.helmet ? HELMET_PER_DAY * days : 0;
  const jacket = addOns.jacket ? JACKET_PER_DAY * days : 0;
  const tax = round2((rental + helmet + jacket) * TAX_RATE);
  const fee = PLATFORM_FEE;
  const deposit = bike.deposit;
  return { days, rental, helmet, jacket, tax, fee, deposit, payable: round2(rental + helmet + jacket + tax + fee + deposit), taxRate: TAX_RATE * 100 };
}

export type QuoteLine = SummaryLine;

export function quoteLines(quote: Quote): QuoteLine[] {
  const lines: QuoteLine[] = [{ id: "rental", days: quote.days, amount: quote.rental }];
  if (quote.addons) lines.push(...quote.addons.map((addon) => ({ id: `addon-${addon.code}`, label: addon.name, amount: addon.amount })));
  else {
    if (quote.helmet) lines.push({ id: "helmet", amount: quote.helmet });
    if (quote.jacket) lines.push({ id: "jacket", amount: quote.jacket });
  }
  lines.push(
    { id: "tax", rate: Math.round(quote.taxRate ?? TAX_RATE * 100), amount: quote.tax },
    { id: "fee", amount: quote.fee },
    { id: "deposit", amount: quote.deposit, refundable: true },
  );
  return lines;
}
