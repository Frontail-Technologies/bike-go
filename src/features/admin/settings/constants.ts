export const bookingWorkflowStatuses = ["Pending", "Confirmed", "Ready for pickup", "Active", "Completed", "Cancelled", "Expired"] as const;

export const loanWorkflowStatuses = ["Draft", "Submitted", "Documents under review", "Additional documents required", "Eligibility review", "Approved", "Rejected"] as const;

export const documentTypeReference = ["Passport", "Visa / Residence permit", "Employment proof", "Salary / income proof", "Address proof", "Bank statement", "Other"] as const;
