import { adminLabels, adminT } from "@/features/admin/i18n/translate";
import { supportTicketCategories, type SupportTicketCategory, type SupportTicketStatus } from "../types/feedback";

export const categoryLabels: Record<SupportTicketCategory, string> = adminLabels("feedback.categories", supportTicketCategories);

export function ticketBadge(status: SupportTicketStatus) {
  return status === "resolved" ? { status: "completed" as const, label: adminT("feedback.status.resolved") } : { status: "pending" as const, label: adminT("feedback.status.open") };
}
