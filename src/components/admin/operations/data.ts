import type { AdminStatus } from "@/components/admin/data-display/status-badge";

export type AdminBooking = {
  id: string; reference: string; customer: string; email: string; phone: string; vehicle: string; registration: string;
  pickupAt: string; returnAt: string; location: string; status: AdminStatus; paymentStatus: AdminStatus;
  rentalMinor: number; depositMinor: number; totalMinor: number;
};

export type AdminCustomer = {
  id: string; name: string; initials: string; email: string; phone: string; city: string; joinedAt: string;
  status: AdminStatus; totalBookings: number; activeRentals: number; totalSpentMinor: number; loanApplications: number;
};

export type AdminLoan = {
  id: string; reference: string; applicant: string; email: string; phone: string; occupation: string; employer: string;
  monthlyIncomeMinor: number; requestedMinor: number; tenureMonths: number; purpose: string; status: AdminStatus; submittedAt: string;
};

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

const bookingStatuses: AdminStatus[] = ["ongoing", "completed", "confirmed", "cancelled", "completed", "pending", "completed", "no-show", "ongoing", "confirmed", "completed", "pending"];
const vehicles = ["Toyota Vios", "Honda Click 125", "Yamaha NMAX 155", "KTM Duke 250", "Honda PCX 160", "Toyota Fortuner"];

export const adminBookings: AdminBooking[] = Array.from({ length: 12 }, (_, index) => {
  const person = people[index % people.length];
  const rentalMinor = 3600 + (index % 5) * 1200;
  const depositMinor = 20000 + (index % 3) * 5000;
  return {
    id: `booking-${index + 1}`, reference: `BND${String(124 - index).padStart(4, "0")}`, customer: person[0], email: person[2], phone: person[3],
    vehicle: vehicles[index % vehicles.length], registration: `RG-${String(index + 1).padStart(4, "0")}`,
    pickupAt: `2026-10-${String(20 + (index % 8)).padStart(2, "0")}T03:00:00.000Z`, returnAt: `2026-10-${String(22 + (index % 8)).padStart(2, "0")}T03:00:00.000Z`,
    location: index % 3 === 0 ? "Siem Reap Riverside" : "Phnom Penh Central", status: bookingStatuses[index], paymentStatus: index % 4 === 3 ? "partially-paid" : index % 5 === 4 ? "refunded" : "paid",
    rentalMinor, depositMinor, totalMinor: rentalMinor + depositMinor,
  };
});

export const adminCustomers: AdminCustomer[] = Array.from({ length: 12 }, (_, index) => {
  const person = people[index % people.length];
  return { id: `customer-${index + 1}`, name: person[0], initials: person[1], email: person[2], phone: person[3], city: person[4], joinedAt: `2026-${String(1 + (index % 9)).padStart(2, "0")}-15T03:00:00.000Z`, status: index === 4 ? "inactive" : "available", totalBookings: 2 + index, activeRentals: index % 4 === 0 ? 1 : 0, totalSpentMinor: 8500 + index * 4300, loanApplications: index % 3 };
});

const loanStatuses: AdminStatus[] = ["under-review", "approved", "pending", "rejected", "approved", "pending", "under-review", "approved"];
export const adminLoans: AdminLoan[] = Array.from({ length: 8 }, (_, index) => {
  const person = people[index % people.length];
  return { id: `loan-${index + 1}`, reference: `LNN${String(28 - index).padStart(4, "0")}`, applicant: person[0], email: person[2], phone: person[3], occupation: index % 2 ? "Operations Manager" : "Software Engineer", employer: index % 2 ? "Mekong Logistics" : "Tech Co., Ltd.", monthlyIncomeMinor: 85000 + index * 12000, requestedMinor: 300000 + index * 50000, tenureMonths: 12 + (index % 3) * 6, purpose: index % 2 ? "Business expansion" : "Vehicle purchase", status: loanStatuses[index], submittedAt: `2026-10-${String(12 + index).padStart(2, "0")}T04:30:00.000Z` };
});

const documentStatuses: AdminStatus[] = ["verified", "needs-review", "verified", "rejected", "verified", "expired", "needs-review", "verified"];
const documentTypes = ["Passport", "Visa", "Driving licence", "Passport", "National ID", "Proof of address", "Driving licence", "Visa"];
export const adminDocuments: AdminDocument[] = Array.from({ length: 8 }, (_, index) => ({ id: `document-${index + 1}`, reference: `DOC${String(index + 1).padStart(4, "0")}`, customer: people[index % people.length][0], type: documentTypes[index], fileName: `${documentTypes[index].toLowerCase().replaceAll(" ", "_")}_${index + 1}.pdf`, status: documentStatuses[index], uploadedAt: `2026-10-${String(14 + index).padStart(2, "0")}T06:00:00.000Z` }));

const paymentStatuses: AdminStatus[] = ["paid", "paid", "pending", "failed", "paid", "refunded", "partially-paid", "paid", "paid", "pending"];
export const adminPayments: AdminPayment[] = Array.from({ length: 10 }, (_, index) => ({ id: `payment-${index + 1}`, reference: `PAY${String(index + 1).padStart(4, "0")}`, bookingReference: `BND${String(124 - index).padStart(4, "0")}`, customer: people[index % people.length][0], amountMinor: 3200 + index * 650, method: ["Credit card", "Cash", "Bank transfer"][index % 3], status: paymentStatuses[index], paidAt: `2026-10-${String(15 + index).padStart(2, "0")}T05:15:00.000Z` }));
