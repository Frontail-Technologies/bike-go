import type { SupportTicketListParams } from "./types/feedback";

export const adminFeedbackQueryKeys = {
  root: () => ["admin", "feedback"] as const,
  list: (params: SupportTicketListParams) => ["admin", "feedback", "list", params] as const,
  detail: (reference: string) => ["admin", "feedback", "detail", reference] as const,
} as const;
