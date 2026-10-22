import type { Motorcycle } from "@/features/mock/data";

export const HELMET_PER_DAY = 100;
export const JACKET_PER_DAY = 150;
export const GST_RATE = 0.18;
export const PLATFORM_FEE = 49;

export type AddOns = { helmet: boolean; jacket: boolean };

export type Quote = {
  days: number;
  rental: number;
  helmet: number;
  jacket: number;
  /** GST on rental and add-ons. */
  gst: number;
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
  const gst = Math.round((rental + helmet + jacket) * GST_RATE);
  const fee = PLATFORM_FEE;
  const deposit = bike.deposit;
  return { days, rental, helmet, jacket, gst, fee, deposit, payable: rental + helmet + jacket + gst + fee + deposit };
}

export type QuoteLine = { label: string; amount: number; hint?: string };

/** Line items for BookingSummary, in display order. */
export function quoteLines(quote: Quote): QuoteLine[] {
  const unit = quote.days === 1 ? "day" : "days";
  const lines: QuoteLine[] = [{ label: `Rental (${quote.days} ${unit})`, amount: quote.rental }];
  if (quote.helmet) lines.push({ label: "Helmet", amount: quote.helmet });
  if (quote.jacket) lines.push({ label: "Riding jacket", amount: quote.jacket });
  lines.push(
    { label: "GST (18%)", amount: quote.gst },
    { label: "Platform fee", amount: quote.fee },
    { label: "Security deposit", amount: quote.deposit, hint: "Refundable" },
  );
  return lines;
}
