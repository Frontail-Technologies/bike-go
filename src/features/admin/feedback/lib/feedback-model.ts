import type { SupportTicketCategory, SupportTicketStatus } from "../types/feedback";

export const categoryLabels: Record<SupportTicketCategory, string> = {
  booking: "Booking",
  payment: "Payment",
  bike: "Bike",
  pickup: "Pickup / return",
  app: "App issue",
  other: "Other",
};

/** Reuses the shared badge's existing tones: open reads as pending, resolved as completed. */
export function ticketBadge(status: SupportTicketStatus) {
  return status === "resolved" ? { status: "completed" as const, label: "Resolved" } : { status: "pending" as const, label: "Open" };
}
