export type LoanDocument = { id: string; type: string; originalFilename: string; mimeType: string; sizeBytes: number; verificationStatus: "uploaded" | "verified" | "needs_review" | "rejected"; reviewNote: string | null; uploadedAt: string };
export type LoanDocumentUpload = FormData;
export type LoanDocumentReplace = FormData;
export type DeletedLoanDocument = { id: string };
