import { adminLocations, adminVehicles } from "@/components/admin/data";
import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import { documentTypes, type LoanCurrency, type LoanStatus, loanTypes } from "@/components/admin/mock/loan-types";

export type CustomerStatus = Extract<AdminStatus, "active" | "inactive">;

export type CustomerBooking = {
  id: string; reference: string; vehicle: string; registration: string; pickupAt: string; returnAt: string; location: string;
  amountMinor: number; status: AdminStatus; paymentStatus: AdminStatus; detailId: string;
};
export type CustomerLoan = {
  id: string; reference: string; loanType: string; requestedMinor: number; currency: LoanCurrency; tenureMonths: number; submittedAt: string; status: LoanStatus; detailId: string;
};
export type CustomerDocument = {
  id: string; type: string; loanReference: string; uploadedAt: string; status: AdminStatus; detailId: string;
};
export type CustomerActivity = { id: string; title: string; detail: string; at: string; kind: "account" | "booking" | "loan" | "document" };

export type Customer = {
  id: string; reference: string; name: string; email: string; phone: string; city: string; address: string; nationality: string;
  dateOfBirth: string; joinedAt: string; status: CustomerStatus; providers: Array<"Google" | "Telegram">; telegramUsername: string | null;
  profileComplete: boolean; bookings: CustomerBooking[]; loans: CustomerLoan[]; documents: CustomerDocument[]; activity: CustomerActivity[];
};

const seeds = [
  ["Sok Chantha", "chantha.sok@gmail.com", "+855 12 345 678", "Phnom Penh", "No. 12, Street 214, Boeng Keng Kang", "Cambodian", "1995-03-15", "2026-01-12", "active"],
  ["Lim Sreynich", "sreynich.lim@gmail.com", "+855 87 234 567", "Siem Reap", "Wat Bo Road, Sala Kamreuk", "Cambodian", "1998-07-22", "2026-02-03", "active"],
  ["Chea Dara", "dara.chea@gmail.com", "+855 11 987 654", "Phnom Penh", "No. 48, Preah Sihanouk Blvd", "Cambodian", "1992-11-09", "2026-02-19", "inactive"],
  ["Kong Vannak", "vannak.kong@gmail.com", "+855 16 323 232", "Battambang", "Street 3, Svay Pao", "Cambodian", "1989-01-30", "2026-03-08", "active"],
  ["Heng Sokna", "sokna.heng@gmail.com", "+855 93 445 566", "Phnom Penh", "No. 7, Street 51, Daun Penh", "Cambodian", "1996-09-14", "2026-03-25", "active"],
  ["Meas Sopheak", "sopheak.meas@gmail.com", "+855 96 778 899", "Kampong Cham", "National Road 7, Veal Vong", "Cambodian", "1990-05-02", "2026-04-11", "active"],
  ["Pich Ratanak", "ratanak.pich@gmail.com", "+855 12 889 912", "Phnom Penh", "No. 91, Mao Tse Toung Blvd", "Cambodian", "1994-12-27", "2026-05-06", "active"],
  ["Touch Marady", "marady.touch@gmail.com", "+855 70 123 456", "Sihanoukville", "Ekareach Street, Sangkat 3", "Cambodian", "1999-04-18", "2026-05-29", "inactive"],
  ["Marie Tan", "marie.tan@example.com", "+855 93 456 789", "Siem Reap", "Pub Street Lane, Svay Dangkum", "Singaporean", "1991-08-05", "2026-06-17", "active"],
  ["David Kim", "david.kim@example.com", "+855 15 167 654", "Phnom Penh", "No. 33, Street 278, BKK1", "Korean", "1987-02-11", "2026-07-09", "active"],
  ["Rith Sophea", "sophea.rith@gmail.com", "+855 85 612 004", "Phnom Penh", "No. 5, Street 163, Toul Tom Poung", "Cambodian", "1997-10-21", "2026-10-02", "active"],
  ["Vann Dara", "dara.vann@gmail.com", "+855 69 301 775", "Siem Reap", "Sivutha Blvd, Sala Kamreuk", "Cambodian", "2000-06-03", "2026-10-14", "active"],
] as const;

const bookingStatuses: AdminStatus[] = ["completed", "ongoing", "completed", "confirmed", "completed", "cancelled", "completed"];
const paymentStatuses: AdminStatus[] = ["paid", "paid", "paid", "partially-paid", "paid", "refunded", "paid"];
const loanStatuses: LoanStatus[] = ["documents-review", "approved", "submitted", "rejected", "eligibility-review", "action-required", "draft"];
const documentStatuses: AdminStatus[] = ["verified", "needs-review", "verified", "rejected", "verified"];

const stamp = (month: number, day: number, hour = 3) => `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;

function build(seed: (typeof seeds)[number], index: number): Customer {
  const [name, email, phone, city, address, nationality, dateOfBirth, joined, status] = seed;
  const bookingCount = 2 + ((index * 3) % 6);
  const loanCount = index % 4 === 3 ? 0 : (index % 2) + 1;
  const joinedAt = `${joined}T03:00:00.000Z`;

  const bookings: CustomerBooking[] = Array.from({ length: bookingCount }, (_, slot) => {
    const vehicle = adminVehicles[(index + slot * 2) % adminVehicles.length];
    const location = adminLocations[(index + slot) % 3];
    const rental = vehicle.dailyRentalPriceMinor * (2 + (slot % 3));
    const day = 3 + ((index * 5 + slot * 4) % 24);
    const start = stamp(10 - Math.min(slot, 8), day);
    const bookingStatus = index % 4 === 1 && slot === 0 ? "ongoing" : bookingStatuses[(slot + index) % bookingStatuses.length];
    return {
      id: `${index + 1}-b${slot + 1}`, reference: `BND${String(130 - index * 7 - slot).padStart(4, "0")}`, vehicle: vehicle.name, registration: vehicle.registrationNumber,
      pickupAt: start, returnAt: stamp(10 - Math.min(slot, 8), day + 2 + (slot % 3)), location: location.name, amountMinor: rental + vehicle.securityDepositMinor / 4,
      status: bookingStatus, paymentStatus: bookingStatus === "ongoing" ? "paid" : paymentStatuses[(slot + index) % paymentStatuses.length], detailId: `BK-${String(((index + slot) % 12) + 1).padStart(4, "0")}`,
    };
  });

  const loans: CustomerLoan[] = Array.from({ length: loanCount }, (_, slot) => {
    const currency: LoanCurrency = (index + slot) % 3 === 2 ? "KHR" : "USD";
    const usd = 3000 + ((index + slot) % 4) * 1500;
    const reference = `LA-2026-${String(40 - index * 2 - slot).padStart(4, "0")}`;
    return {
      id: `${index + 1}-l${slot + 1}`, reference, loanType: loanTypes[(index + slot) % loanTypes.length], currency, requestedMinor: currency === "USD" ? usd * 100 : usd * 4100,
      tenureMonths: [12, 18, 24, 36][(index + slot) % 4], submittedAt: stamp(9 - slot, 8 + index), status: loanStatuses[(index + slot) % loanStatuses.length], detailId: reference,
    };
  });

  const documents: CustomerDocument[] = loans.flatMap((loan, loanSlot) =>
    Array.from({ length: 2 }, (_, slot) => ({
      id: `${loan.id}-d${slot + 1}`, type: documentTypes[slot], loanReference: loan.reference,
      uploadedAt: stamp(9 - loanSlot, 9 + index, 5 + slot), status: documentStatuses[(index + slot + loanSlot) % documentStatuses.length], detailId: `${loan.reference}-${slot}`,
    })),
  );

  const activity: CustomerActivity[] = [
    { id: "registered", title: "Customer registered", detail: `Signed up from ${city} with ${index % 2 ? "Telegram" : "Google"}`, at: joinedAt, kind: "account" as const },
    ...bookings.slice(0, 2).map((booking) => ({ id: `${booking.id}-created`, title: "Booking created", detail: `${booking.reference} · ${booking.vehicle}`, at: booking.pickupAt, kind: "booking" as const })),
    ...bookings.filter((booking) => booking.status === "completed").slice(0, 1).map((booking) => ({ id: `${booking.id}-done`, title: "Booking completed", detail: `${booking.reference} returned at ${booking.location}`, at: booking.returnAt, kind: "booking" as const })),
    ...loans.map((loan) => ({ id: `${loan.id}-submitted`, title: "Loan submitted", detail: `${loan.reference} · ${loan.loanType}`, at: loan.submittedAt, kind: "loan" as const })),
    ...documents.map((doc) => ({ id: `${doc.id}-up`, title: doc.status === "verified" ? "Document verified" : "Document uploaded", detail: `${doc.type} for ${doc.loanReference}`, at: doc.uploadedAt, kind: "document" as const })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    id: `customer-${index + 1}`, reference: `C-${String(index + 1).padStart(4, "0")}`, name, email, phone, city, address, nationality, dateOfBirth, joinedAt, status,
    providers: index % 3 === 0 ? ["Google", "Telegram"] : index % 2 ? ["Telegram"] : ["Google"], telegramUsername: index % 3 === 0 || index % 2 ? `@${name.split(" ")[0].toLowerCase()}_${name.split(" ")[1].toLowerCase()}` : null,
    profileComplete: index % 5 !== 4, bookings, loans, documents, activity,
  };
}

export const customers: Customer[] = seeds.map(build);

export const getCustomer = (id: string) => customers.find((customer) => customer.id === id);
export const initialsOf = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
export const totalSpentMinor = (customer: Customer) => customer.bookings.filter((booking) => booking.status !== "cancelled").reduce((sum, booking) => sum + booking.amountMinor, 0);
export const activeRentals = (customer: Customer) => customer.bookings.filter((booking) => booking.status === "ongoing").length;


export const NOW = Date.parse("2026-10-23T03:00:00.000Z");
export const monthsSince = (iso: string) => Math.max(1, Math.round((NOW - Date.parse(iso)) / (30.44 * 86_400_000)));
