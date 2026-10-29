import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import type { SupportTicket, SupportTicketListMeta, SupportTicketListParams, SupportTicketUpdateInput } from "../types/feedback";


export const feedbackApi = {
  list: async (params: SupportTicketListParams) => {
    const response = await apiClient.get<Envelope<SupportTicket[]>>("/admin/support-tickets", { params });
    return { data: response.data.data, meta: response.data.meta as SupportTicketListMeta };
  },
  get: (reference: string) => apiClient.get<Envelope<SupportTicket>>(`/admin/support-tickets/${reference}`).then((response) => response.data.data),
  update: (reference: string, input: SupportTicketUpdateInput) => apiClient.patch<Envelope<SupportTicket>>(`/admin/support-tickets/${reference}`, input).then((response) => response.data.data),
};
