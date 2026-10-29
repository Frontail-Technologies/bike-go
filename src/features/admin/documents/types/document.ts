import type { DocumentType, VerificationStatus } from "@/features/admin/loans/types/loan";

export type DocumentSort = "newest" | "oldest";
export type UploadedWindow = "7" | "30" | "90";

export type DocumentListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: VerificationStatus;
  type?: DocumentType;
  uploaded?: UploadedWindow;
  sort?: DocumentSort;
};
export type DocumentListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type ReviewDocument = {
  id: string;
  type: DocumentType;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  verificationStatus: VerificationStatus;
  reviewNote: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
  loan: { reference: string; loanType: string; status: string };
  applicant: { id: string; reference: string; name: string; nationality: string | null };
  fileUrl: string;
};

export type DocumentEvent = { kind: "uploaded" | "reviewed"; status: VerificationStatus; note: string | null; by: string | null; at: string };
export type ReviewDocumentDetail = ReviewDocument & { history: DocumentEvent[] };

export type DocumentStats = { uploaded: number; verified: number; needsReview: number; rejected: number; total: number };

export type DocumentDecision = "verified" | "needs_review" | "rejected";
export type DocumentReviewInput = { verificationStatus: DocumentDecision; note?: string };
