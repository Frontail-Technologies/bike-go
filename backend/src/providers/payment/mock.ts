import type { PaymentIntent, PaymentProvider } from "./types";

export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: Parameters<PaymentProvider["createPayment"]>[0]): Promise<PaymentIntent> {
    return { providerReference: `mock-${input.bookingReference}`, status: "pending", amountMinor: input.amountMinor, currency: input.currency };
  }

  async verifyPayment(providerReference: string): Promise<PaymentIntent> {
    return { providerReference, status: "pending", amountMinor: 0, currency: "USD" };
  }

  async getPaymentStatus(providerReference: string): Promise<PaymentIntent> {
    return this.verifyPayment(providerReference);
  }

  async refund(input: Parameters<PaymentProvider["refund"]>[0]) {
    return { refundReference: `mock-refund-${input.providerReference}`, status: "pending" as const };
  }
}
