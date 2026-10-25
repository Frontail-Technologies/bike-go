export type SupportTicketCategory = "booking" | "payment" | "bike" | "pickup" | "app" | "other";
export type SupportTicketInput = { category: SupportTicketCategory; bookingReference?: string | null; message: string };
export type ReportedIssue = { reference: string; category: SupportTicketCategory; status: "open" | "resolved"; createdAt: string };
