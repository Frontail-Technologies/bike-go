import { apiClient } from "@/lib/api/client";
import type { Payment, PaymentDetail, PaymentListMeta, PaymentListParams } from "../types/payment";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const DAY = 86_400_000;

/** Date presets are rolling windows, resolved when the request is sent so they never go stale. */
function toQuery({ window, ...params }: PaymentListParams) {
  return { ...params, ...(window ? { from: new Date(Date.now() - Number(window) * DAY).toISOString() } : {}) };
}

/** Read-only: the backend exposes no payment actions, and nothing here talks to a provider. */
export const paymentsApi = {
  list: async (params: PaymentListParams) => {
    const response = await apiClient.get<Envelope<Payment[]>>("/admin/payments", { params: toQuery(params) });
    return { data: response.data.data, meta: response.data.meta as PaymentListMeta };
  },
  get: (transactionId: string) => apiClient.get<Envelope<PaymentDetail>>(`/admin/payments/${encodeURIComponent(transactionId)}`).then((response) => response.data.data),
};
