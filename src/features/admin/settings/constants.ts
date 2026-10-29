import { documentTypes, loanStatuses } from "@/features/admin/loans/types/loan";

export const bookingWorkflowStatuses = ["pending", "confirmed", "ready_for_pickup", "active", "completed", "cancelled", "expired"] as const;

export const loanWorkflowStatuses = loanStatuses;

export const documentTypeReference = documentTypes;
