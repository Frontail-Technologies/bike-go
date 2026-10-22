import type { Currency } from "@/libs/money";
import { MockPaymentProvider } from "./mock";

export type PaymentIntent = { providerReference: string; status: "pending" | "paid" | "failed"; amountMinor: number; currency: Currency };

/**
 * The contract a payment provider must meet. The booking domain never imports a provider directly, so adding ABA
 * later (KHQR / payment links, webhooks, refunds) means one new implementation here and a webhook route, with no
 * change to booking logic. Until the ABA merchant details are confirmed nothing real is implemented.
 */
export interface PaymentProvider {
  createPayment(input: { bookingReference: string; amountMinor: number; currency: Currency; expiresAt: Date }): Promise<PaymentIntent>;
  /** Verifies a provider callback or a client-reported result against the provider itself. Never trust the client. */
  verifyPayment(providerReference: string): Promise<PaymentIntent>;
  getPaymentStatus(providerReference: string): Promise<PaymentIntent>;
  refund(input: { providerReference: string; amountMinor: number; reason: string }): Promise<{ refundReference: string; status: "pending" | "refunded" | "failed" }>;
}

export const payments: PaymentProvider = new MockPaymentProvider();
