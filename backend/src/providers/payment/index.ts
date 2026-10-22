
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./types";

export const payments: PaymentProvider = new MockPaymentProvider();
