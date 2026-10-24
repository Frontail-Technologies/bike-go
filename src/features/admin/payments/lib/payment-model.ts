import type { PaymentStatus, RefundState } from "../types/payment";

export const statusLabels: Record<PaymentStatus, string> = { pending: "Pending", paid: "Paid", failed: "Failed" };

/** Provider keys as stored, named for people. */
const providers: Record<string, string> = { aba_payway: "ABA PayWay" };
export const providerLabel = (provider: string) => providers[provider] ?? provider.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

/** The badge shows the payment's state including refunds, which the backend derives from the recorded amounts. */
export const badgeStatus = (payment: { status: PaymentStatus; refundState: RefundState }) => (payment.status === "paid" && payment.refundState === "full" ? "refunded" : payment.status === "paid" && payment.refundState === "partial" ? "partially_refunded" : payment.status);

export const toMinor = (decimal: string) => Math.round(Number(decimal) * 100);
export const toDecimal = (minor: number) => (minor / 100).toFixed(2);

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", ...options }).format(new Date(iso));
export const fmtDateTime = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtShort = (iso: string) => fmt(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
