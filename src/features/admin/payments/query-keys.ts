import type { PaymentListParams } from "./types/payment";

/** Query identities local to the payments feature. */
export const adminPaymentQueryKeys = {
  root: () => ["admin", "payments"] as const,
  list: (params: PaymentListParams) => ["admin", "payments", "list", params] as const,
  methods: () => ["admin", "payments", "methods"] as const,
  detail: (transactionId: string) => ["admin", "payments", "detail", transactionId] as const,
} as const;
