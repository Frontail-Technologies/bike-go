export const loanStatuses = ["draft", "submitted", "documents_under_review", "additional_documents_required", "eligibility_review", "approved", "rejected"] as const;
export type LoanStatus = (typeof loanStatuses)[number];

export const loanTypes = ["personal", "vehicle", "emergency"] as const;
export type LoanType = (typeof loanTypes)[number];

export const documentTypes = ["passport", "visa_or_residence_permit", "employment_proof", "salary_or_income_proof", "address_proof", "bank_statement", "other"] as const;
export type DocumentType = (typeof documentTypes)[number];

export const verificationStatuses = ["uploaded", "verified", "needs_review", "rejected"] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export type LoanCurrency = "USD" | "KHR";

export type LoanDocument = {
  id: string;
  type: DocumentType;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  verificationStatus: VerificationStatus;
  reviewNote: string | null;
  uploadedAt: string;
};

export type LoanHistoryItem = {
  oldStatus: LoanStatus | null;
  newStatus: LoanStatus;
  note: string | null;
  noteCode: string | null;
  noteParams: Record<string, string>;
  changedBy: string | null;
  changedByName: string | null;
  createdAt: string;
};

export type Loan = {
  reference: string;
  status: LoanStatus;
  loanType: LoanType;
  currency: LoanCurrency;
  requestedAmountMinor: number;
  monthlyPaymentMinor: number;
  interestRateBps: number;
  applicantAge: number | null;
  tenureMonths: number;
  purpose: string | null;
  applicant: { fullName: string | null; mobile: string | null; email: string | null; dateOfBirth: string | null; nationality: string | null; currentCity: string | null; residenceStatus: string | null };
  employment: { employmentType: string | null; employerName: string | null; jobTitle: string | null; monthlyIncomeMinor: number | null; workExperienceMonths: number | null; hasActiveBankAccount: boolean | null };
  submittedAt: string | null;
  requestedDocumentTypes: DocumentType[];
  documents: LoanDocument[];
  history: LoanHistoryItem[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  customer: { reference: string; name: string; email: string | null; phone: string | null };
  allowedNextStatuses: LoanStatus[];
  documentChecklist: Array<{ type: DocumentType; documentId: string | null; status: string | null; uploadedAt: string | null }>;
};

export type LoanSort = "newest" | "oldest" | "amount_desc" | "amount_asc";
export type SubmittedWindow = "7" | "30" | "90";

export type LoanListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: LoanStatus;
  loanType?: LoanType;
  currency?: LoanCurrency;
  submitted?: SubmittedWindow;
  sort?: LoanSort;
};
export type LoanListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type LoanStats = { total: number; underReview: number; approved: number; rejected: number };

export type LoanStatusInput = { status: Exclude<LoanStatus, "draft">; note?: string; requestedDocumentTypes?: DocumentType[] };
