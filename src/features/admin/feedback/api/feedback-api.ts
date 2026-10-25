import { apiClient } from "@/lib/api/client";
import type { SupportTicket, SupportTicketListMeta, SupportTicketListParams, SupportTicketUpdateInput } from "../types/feedback";

type Envelope<T> = { data: T; meta: Record<string, unknown> };

export const feedbackApi = {
  list: async (params: SupportTicketListParams) => {
    const response = await apiClient.get<Envelope<SupportTicket[]>>("/admin/support-tickets", { params });
    return { data: response.data.data, meta: response.data.meta as SupportTicketListMeta };
  },
  get: (reference: string) => apiClient.get<Envelope<SupportTicket>>(`/admin/support-tickets/${reference}`).then((response) => response.data.data),
  update: (reference: string, input: SupportTicketUpdateInput) => apiClient.patch<Envelope<SupportTicket>>(`/admin/support-tickets/${reference}`, input).then((response) => response.data.data),
};
