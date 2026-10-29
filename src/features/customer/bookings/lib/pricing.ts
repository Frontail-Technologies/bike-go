import type { SummaryLine } from "@/components/customer/booking-summary";
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

export type QuoteLine = SummaryLine;

export function quoteLines(quote: Quote): QuoteLine[] {
  const lines: QuoteLine[] = [{ id: "rental", days: quote.days, amount: quote.rental }];
  if (quote.addons) lines.push(...quote.addons.map((addon) => ({ id: `addon-${addon.code}`, label: addon.name, amount: addon.amount })));
  else {
    if (quote.helmet) lines.push({ id: "helmet", amount: quote.helmet });
    if (quote.jacket) lines.push({ id: "jacket", amount: quote.jacket });
  }
  lines.push(
    { id: "tax", rate: Math.round(quote.taxRate ?? 0), amount: quote.tax },
    { id: "fee", amount: quote.fee },
    { id: "deposit", amount: quote.deposit, refundable: true },
  );
  return lines;
}
