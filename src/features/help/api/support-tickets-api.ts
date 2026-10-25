import { apiClient } from "@/lib/api/client";

type Envelope<T> = { data: T };

export type SupportTicketCategory = "booking" | "payment" | "bike" | "pickup" | "app" | "other";

export type ReportedIssue = { reference: string; category: SupportTicketCategory; status: "open" | "resolved"; createdAt: string };

export const supportTicketsApi = {
  create: (input: { category: SupportTicketCategory; bookingReference?: string | null; message: string }) =>
    apiClient.post<Envelope<ReportedIssue>>("/support-tickets", input).then((response) => response.data.data),
};
