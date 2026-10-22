import type { Currency } from "@/libs/money";
import { MockPaymentProvider } from "./mock";

export type PaymentIntent = { providerReference: string; status: "pending" | "paid" | "failed"; amountMinor: number; currency: Currency };

export interface PaymentProvider {
  createPayment(input: { bookingReference: string; amountMinor: number; currency: Currency; expiresAt: Date }): Promise<PaymentIntent>;
  verifyPayment(providerReference: string): Promise<PaymentIntent>;
  getPaymentStatus(providerReference: string): Promise<PaymentIntent>;
  refund(input: { providerReference: string; amountMinor: number; reason: string }): Promise<{ refundReference: string; status: "pending" | "refunded" | "failed" }>;
}

export const payments: PaymentProvider = new MockPaymentProvider();
