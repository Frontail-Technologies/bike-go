import type { AdminStatus } from "@/components/admin/data-display/status-badge";

export type AdminDocument = {
  id: string; reference: string; customer: string; type: string; fileName: string; status: AdminStatus; uploadedAt: string;
};

export type AdminPayment = {
  id: string; reference: string; bookingReference: string; customer: string; amountMinor: number; method: string;
  status: AdminStatus; paidAt: string;
};

const people = [
  ["John Smith", "JS", "john@example.com", "+855 12 345 678", "Phnom Penh"],
  ["Marie Tan", "MT", "marie@example.com", "+855 93 456 789", "Siem Reap"],
  ["David Kim", "DK", "david@example.com", "+855 15 167 654", "Phnom Penh"],
  ["Sarah Wong", "SW", "sarah@example.com", "+855 11 222 333", "Sihanoukville"],
  ["Chan Dara", "CD", "chan@example.com", "+855 11 111 222", "Phnom Penh"],
  ["Sokha Chan", "SC", "sokha@example.com", "+855 96 804 312", "Siem Reap"],
] as const;

const documentStatuses: AdminStatus[] = ["verified", "needs-review", "verified", "rejected", "verified", "expired", "needs-review", "verified"];
const documentTypes = ["Passport", "Visa", "Driving licence", "Passport", "National ID", "Proof of address", "Driving licence", "Visa"];
export const adminDocuments: AdminDocument[] = Array.from({ length: 8 }, (_, index) => ({ id: `document-${index + 1}`, reference: `DOC${String(index + 1).padStart(4, "0")}`, customer: people[index % people.length][0], type: documentTypes[index], fileName: `${documentTypes[index].toLowerCase().replaceAll(" ", "_")}_${index + 1}.pdf`, status: documentStatuses[index], uploadedAt: `2026-10-${String(14 + index).padStart(2, "0")}T06:00:00.000Z` }));

const paymentStatuses: AdminStatus[] = ["paid", "paid", "pending", "failed", "paid", "refunded", "partially-paid", "paid", "paid", "pending"];
export const adminPayments: AdminPayment[] = Array.from({ length: 10 }, (_, index) => ({ id: `payment-${index + 1}`, reference: `PAY${String(index + 1).padStart(4, "0")}`, bookingReference: `BND${String(124 - index).padStart(4, "0")}`, customer: people[index % people.length][0], amountMinor: 3200 + index * 650, method: ["Credit card", "Cash", "Bank transfer"][index % 3], status: paymentStatuses[index], paidAt: `2026-10-${String(15 + index).padStart(2, "0")}T05:15:00.000Z` }));
