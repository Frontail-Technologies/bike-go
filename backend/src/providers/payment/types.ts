import type { Currency } from "@/libs/types";

export type CheckoutForm = { action: string; method: "POST"; fields: Record<string, string> };

export type CheckoutInput = { transactionId: string; amountMinor: number; currency: Currency; bookingReference: string };

export type TransactionCheck =
  | { state: "pending" }
  | { state: "failed"; raw: unknown }
  | { state: "approved"; amountMinor: number | null; currency: Currency | null; raw: unknown };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): CheckoutForm;
  checkTransaction(transactionId: string): Promise<TransactionCheck>;
}

export type PaywayConfig = {
  merchantId: string;
  apiKey: string;
  checkoutUrl: string;
  checkUrl: string;
  paymentOption: string;
  callbackUrl: string;
  continueUrl: (bookingReference: string) => string;
  cancelUrl: (bookingReference: string) => string;
};
