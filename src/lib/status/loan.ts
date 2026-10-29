export const loanStatus = {
  draft: { label: "Draft", tone: "draft" }, submitted: { label: "Submitted", tone: "submitted" },
  documents_under_review: { label: "Documents under review", tone: "under-review" },
  additional_documents_required: { label: "Additional documents required", tone: "action-required" },
  eligibility_review: { label: "Eligibility review", tone: "eligibility" }, approved: { label: "Approved", tone: "approved" }, rejected: { label: "Rejected", tone: "rejected" },
} as const;

export const legacyLoanStatus: Record<string, keyof typeof loanStatus> = {
  "documents-review": "documents_under_review", "action-required": "additional_documents_required", "eligibility-review": "eligibility_review",
};
