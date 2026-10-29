import { apiClient } from "@/lib/api/client";
import type { Payment, PaymentDetail, PaymentListMeta, PaymentListParams, RefundInput, RefundResult } from "../types/payment";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const DAY = 86_400_000;

function toQuery({ window, ...params }: PaymentListParams) {
  return { ...params, ...(window ? { from: new Date(Date.now() - Number(window) * DAY).toISOString() } : {}) };
}

const path = (transactionId: string) => `/admin/payments/${encodeURIComponent(transactionId)}`;

export const paymentsApi = {
  list: async (params: PaymentListParams) => {
    const response = await apiClient.get<Envelope<Payment[]>>("/admin/payments", { params: toQuery(params) });
    return { data: response.data.data, meta: response.data.meta as PaymentListMeta };
  },
  methods: () => apiClient.get<Envelope<string[]>>("/admin/payments/methods").then((response) => response.data.data),
  get: (transactionId: string) => apiClient.get<Envelope<PaymentDetail>>(path(transactionId)).then((response) => response.data.data),
  sync: (transactionId: string) => apiClient.post<Envelope<PaymentDetail>>(`${path(transactionId)}/sync`).then((response) => response.data.data),
  refund: (transactionId: string, input: RefundInput) => apiClient.post<Envelope<RefundResult>>(`${path(transactionId)}/refunds`, input).then((response) => response.data.data),
};
