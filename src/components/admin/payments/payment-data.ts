import { bookings, money } from "@/components/admin/payments/payment-booking-mock";
import { loans } from "@/components/admin/loans/loan-data";
import type { Booking, PaymentStatus } from "@/components/admin/payments/payment-booking-mock";
import type { Loan } from "@/components/admin/loans/loan-data";
import type { CurrencyCode } from "@/components/admin/money";
import { customers } from "@/components/admin/mock/customer-mock";

export const NOW = Date.parse("2026-10-23T03:00:00.000Z");
export const paymentTypes = ["booking", "loan"] as const;
export type PaymentType = (typeof paymentTypes)[number];
export const typeLabels: Record<PaymentType, string> = { booking: "Booking", loan: "Loan" };

export type Payment = {
  reference: string; createdAt: string; status: PaymentStatus; type: PaymentType; currency: CurrencyCode; amount: number; refunded: number; method: string | null; description: string;
  customer: { id: string; reference: string; name: string; phone: string; email: string; city: string };
  booking: Booking | null; loan: Loan | null; relatedReference: string;
};

const RATE = 4100;
const shift = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();

const fromBooking = (booking: Booking, index: number): Payment => {
  const usd = money(booking).total;
  const khr = index % 3 === 2;
  const amount = khr ? Math.round((usd / 100) * RATE / 100) * 100 : usd;
  const status = booking.paymentStatus;
  return {
    reference: "", createdAt: shift(booking.createdAt, 5), status, type: "booking", currency: khr ? "KHR" : "USD", amount,
    refunded: status === "refunded" ? amount : status === "partially-refunded" ? Math.round(amount / 2) : 0, method: status === "unpaid" ? null : "ABA PayWay (KHQR)",
    description: `Rental payment for ${booking.vehicle.name} (${booking.days} ${booking.days === 1 ? "day" : "days"})`,
    customer: booking.customer, booking, loan: null, relatedReference: booking.reference,
  };
};

const loanStatuses: PaymentStatus[] = ["paid", "pending", "paid", "failed"];
const loanMethods = ["Bank transfer", "Cash", "Bank transfer", "Card"];
const fromLoan = (loan: Loan, index: number): Payment => {
  const customer = customers.find((item) => item.id === loan.applicant.customerId) ?? customers[0];
  const khr = index % 2 === 1;
  return {
    reference: "", createdAt: shift(loan.submittedAt, 60 * (20 + index)), status: loanStatuses[index % loanStatuses.length], type: "loan", currency: khr ? "KHR" : "USD", amount: khr ? 600000 : 15000, refunded: 0,
    method: loanMethods[index % loanMethods.length], description: `Loan repayment instalment for ${loan.reference}`,
    customer: { id: customer.id, reference: customer.reference, name: customer.name, phone: customer.phone, email: customer.email, city: customer.city }, booking: null, loan, relatedReference: loan.reference,
  };
};

const loanPayers = loans.filter((loan) => loan.status === "approved" || loan.status === "eligibility-review" || loan.status === "documents-review" || loan.status === "rejected").slice(0, 5);

export const payments: Payment[] = [
  ...bookings.map(fromBooking),
  ...loanPayers.map(fromLoan),
]
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .map((payment, index) => ({ ...payment, reference: `PAY-${String(index + 1).padStart(4, "0")}` }));

export const getPayment = (reference: string) => payments.find((payment) => payment.reference.toLowerCase() === reference.toLowerCase());

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", ...options }).format(new Date(iso));
export const fmtDate = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtShort = (iso: string) => fmt(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
