import { apiClient } from "@/lib/api/client";
import type { Loan, LoanListMeta, LoanListParams, LoanStats, LoanStatusInput } from "../types/loan";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const DAY = 86_400_000;

function toQuery({ submitted, ...params }: LoanListParams) {
  return { ...params, ...(submitted ? { from: new Date(Date.now() - Number(submitted) * DAY).toISOString() } : {}) };
}

export const loansApi = {
  list: async (params: LoanListParams) => {
    const response = await apiClient.get<Envelope<Loan[]>>("/admin/loans", { params: toQuery(params) });
    return { data: response.data.data, meta: response.data.meta as LoanListMeta };
  },
  stats: () => apiClient.get<Envelope<LoanStats>>("/admin/loans/stats").then((response) => response.data.data),
  get: (reference: string) => apiClient.get<Envelope<Loan>>(`/admin/loans/${reference}`).then((response) => response.data.data),
  updateStatus: (reference: string, input: LoanStatusInput) => apiClient.patch<Envelope<Loan>>(`/admin/loans/${reference}/status`, input).then((response) => response.data.data),
};
