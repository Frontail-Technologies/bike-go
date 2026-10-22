import { env } from "@/env";
import { PaywayPaymentProvider } from "./payway";
import type { PaymentProvider } from "./types";

const frontend = env.FRONTEND_ORIGINS[0] ?? "http://localhost:3000";

function create(): PaymentProvider | null {
  if (env.PAYMENT_DRIVER !== "payway") return null;
  return new PaywayPaymentProvider({
    merchantId: env.PAYWAY_MERCHANT_ID!,
    apiKey: env.PAYWAY_API_KEY!,
    checkoutUrl: env.PAYWAY_CHECKOUT_URL,
    checkUrl: env.PAYWAY_CHECK_URL,
    paymentOption: env.PAYWAY_PAYMENT_OPTION,
    callbackUrl: `${env.BETTER_AUTH_URL}/api/v1/payments/payway/callback`,
    continueUrl: (reference) => `${frontend}/bookings/${reference}/confirmation`,
    cancelUrl: (reference) => `${frontend}/bookings/${reference}`,
  });
}

export const payments = create();
