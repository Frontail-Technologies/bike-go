export type CheckoutForm = { action: string; method: "POST"; fields: Record<string, string> };
export type StartedPayment = { transactionId: string; amountMinor: number; currency: "USD"; expiresAt: string | null; checkout: CheckoutForm };
export type BookingPayment = {
  bookingStatus: string;
  paymentStatus: string;
  attempt: { transactionId: string; status: "pending" | "paid" | "failed"; amountMinor: number; currency: "USD"; method: string | null; paidAt: string | null; failedAt: string | null } | null;
};
