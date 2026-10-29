import type { SupportTicketCategory, SupportTicketStatus } from "../types/feedback";

export const categoryLabels: Record<SupportTicketCategory, string> = {
  booking: "Booking",
  payment: "Payment",
  bike: "Bike",
  pickup: "Pickup / return",
  app: "App issue",
  other: "Other",
};

export function ticketBadge(status: SupportTicketStatus) {
  return status === "resolved" ? { status: "completed" as const, label: "Resolved" } : { status: "pending" as const, label: "Open" };
}
