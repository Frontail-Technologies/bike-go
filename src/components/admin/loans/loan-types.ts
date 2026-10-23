import type { AdminStatus } from "@/components/admin/data-display/status-badge";

export const loanStatuses = ["draft", "submitted", "documents-review", "action-required", "eligibility-review", "approved", "rejected"] as const;
export type LoanStatus = (typeof loanStatuses)[number];

export const loanStatusLabels: Record<LoanStatus, string> = {
  draft: "Draft", submitted: "Submitted", "documents-review": "Documents under review", "action-required": "Additional documents required",
  "eligibility-review": "Eligibility review", approved: "Approved", rejected: "Rejected",
};

const tone: Record<LoanStatus, AdminStatus> = {
  draft: "draft", submitted: "submitted", "documents-review": "under-review", "action-required": "action-required", "eligibility-review": "eligibility", approved: "approved", rejected: "rejected",
};
export const toLoanBadge = (status: LoanStatus) => ({ status: tone[status], label: loanStatusLabels[status] });

export const loanTypes = ["Personal loan", "Emergency loan", "Business loan"] as const;
export type LoanType = (typeof loanTypes)[number];
export const documentTypes = ["Passport", "Visa / Residence permit", "Employment proof", "Salary / income proof", "Address proof", "Bank statement"] as const;
export const allDocumentTypes = [...documentTypes, "Other"] as const;
export type DocumentType = (typeof allDocumentTypes)[number];
export type LoanCurrency = "USD" | "KHR";
