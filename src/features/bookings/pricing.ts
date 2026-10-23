import type { SummaryLine } from "@/components/customer/booking-summary";
import type { Motorcycle } from "@/features/mock/data";

export const HELMET_PER_DAY = 2;
export const JACKET_PER_DAY = 2;
export const TAX_RATE = 0.18;
export const PLATFORM_FEE = 1;

const round2 = (n: number) => Math.round(n * 100) / 100;

export type AddOns = { helmet: boolean; jacket: boolean };

export type Quote = {
  days: number;
  rental: number;
  helmet: number;
  jacket: number;
  /** Tax on rental and add-ons. */
  tax: number;
  fee: number;
  /** Refundable security deposit, held until the bike is returned. */
  deposit: number;
  /** Everything charged at booking, deposit included. */
  payable: number;
};

export function getQuote(bike: Motorcycle, days: number, addOns: AddOns): Quote {
  const rental = bike.pricePerDay * days;
  const helmet = addOns.helmet ? HELMET_PER_DAY * days : 0;
  const jacket = addOns.jacket ? JACKET_PER_DAY * days : 0;
  const tax = round2((rental + helmet + jacket) * TAX_RATE);
  const fee = PLATFORM_FEE;
  const deposit = bike.deposit;
  return { days, rental, helmet, jacket, tax, fee, deposit, payable: round2(rental + helmet + jacket + tax + fee + deposit) };
}

export type QuoteLine = SummaryLine;

/** Line items for BookingSummary, in display order. */
export function quoteLines(quote: Quote): QuoteLine[] {
  const lines: QuoteLine[] = [{ id: "rental", days: quote.days, amount: quote.rental }];
  if (quote.helmet) lines.push({ id: "helmet", amount: quote.helmet });
  if (quote.jacket) lines.push({ id: "jacket", amount: quote.jacket });
  lines.push(
    { id: "tax", rate: Math.round(TAX_RATE * 100), amount: quote.tax },
    { id: "fee", amount: quote.fee },
    { id: "deposit", amount: quote.deposit, refundable: true },
  );
  return lines;
}
