import type { PaymentStatus, RefundState } from "../types/payment";
import { formatDateTime, formatShort } from "@/lib/date";
import { toMajor, toMinor as majorToMinor } from "@/lib/format";

export const statusLabels: Record<PaymentStatus, string> = { pending: "Pending", paid: "Paid", failed: "Failed" };

const providers: Record<string, string> = { aba_payway: "ABA PayWay" };
export const providerLabel = (provider: string) => providers[provider] ?? provider.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const badgeStatus = (payment: { status: PaymentStatus; refundState: RefundState; displayStatus?: string }) => payment.displayStatus ?? (payment.status === "paid" && payment.refundState === "full" ? "refunded" : payment.status === "paid" && payment.refundState === "partial" ? "partially_refunded" : payment.status);

export const toMinor = (decimal: string) => majorToMinor(Number(decimal));
export const toDecimal = (minor: number) => toMajor(minor).toFixed(2);
export const fmtDateTime = formatDateTime;
export const fmtShort = formatShort;
