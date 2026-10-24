import { apiClient } from "@/lib/api/client";

type Envelope<T> = { data: T };

export type CheckoutForm = { action: string; method: "POST"; fields: Record<string, string> };

export type StartedPayment = {
  transactionId: string;
  amountMinor: number;
  currency: "USD" | "KHR";
  /** The booking hold: pay before this or the booking expires. */
  expiresAt: string | null;
  checkout: CheckoutForm;
};

export type BookingPayment = {
  bookingStatus: string;
  paymentStatus: string;
  attempt: { transactionId: string; status: "pending" | "paid" | "failed"; amountMinor: number; currency: "USD" | "KHR"; method: string | null; paidAt: string | null; failedAt: string | null } | null;
};

/**
 * The customer side of the payment flow. The amount is never sent: the backend reads the booking's stored total,
 * and the booking is only confirmed after the server verifies the transaction with ABA PayWay.
 */
export const checkoutApi = {
  start: (reference: string) => apiClient.post<Envelope<StartedPayment>>(`/bookings/${encodeURIComponent(reference)}/payments`, {}).then((response) => response.data.data),
  status: (reference: string) => apiClient.get<Envelope<BookingPayment>>(`/bookings/${encodeURIComponent(reference)}/payment`).then((response) => response.data.data),
};
