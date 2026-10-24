import type { PaymentStatus } from "../types/payment";

export const statusLabels: Record<PaymentStatus, string> = { pending: "Pending", paid: "Paid", failed: "Failed" };

/** The backend records the provider key (for example `payway`), not a method, so it is shown as a name. */
export const providerLabel = (provider: string) => provider.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", ...options }).format(new Date(iso));
export const fmtDateTime = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtShort = (iso: string) => fmt(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
