"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "../api/feedback-api";
import { adminFeedbackQueryKeys } from "../query-keys";
import type { SupportTicket, SupportTicketListParams, SupportTicketUpdateInput } from "../types/feedback";

export function useFeedbackQuery(params: SupportTicketListParams) {
  return useQuery({ queryKey: adminFeedbackQueryKeys.list(params), queryFn: () => feedbackApi.list(params), placeholderData: keepPreviousData });
}

export function useFeedbackTicketQuery(reference: string) {
  return useQuery({ queryKey: adminFeedbackQueryKeys.detail(reference), queryFn: () => feedbackApi.get(reference) });
}

/** An update returns the fresh ticket, so the detail cache is replaced and the list refetches. */
export function useFeedbackMutations() {
  const client = useQueryClient();
  const settle = (ticket: SupportTicket) => {
    client.setQueryData(adminFeedbackQueryKeys.detail(ticket.reference), ticket);
    void client.invalidateQueries({ queryKey: adminFeedbackQueryKeys.root() });
  };
  return {
    update: useMutation({ mutationFn: ({ reference, ...input }: { reference: string } & SupportTicketUpdateInput) => feedbackApi.update(reference, input), onSuccess: settle }),
  };
}
