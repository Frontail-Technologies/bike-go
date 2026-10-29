
export type LoanTypeId = "personal" | "vehicle" | "emergency";

export type LoanType = {
  id: LoanTypeId;
  apr: number;
  minAmount: number;
  maxAmount: number;
  maxTenure: number;
};

export const loanTypes: LoanType[] = [
  { id: "personal", apr: 12, minAmount: 1000, maxAmount: 25000, maxTenure: 48 },
  { id: "vehicle", apr: 9.5, minAmount: 1500, maxAmount: 15000, maxTenure: 60 },
  { id: "emergency", apr: 14, minAmount: 500, maxAmount: 5000, maxTenure: 24 },
];

export const getLoanType = (id: string) => loanTypes.find((t) => t.id === id);

export const TENURES = [6, 12, 24, 36, 48, 60] as const;
export const tenuresFor = (type: LoanType) => TENURES.filter((t) => t <= type.maxTenure);

export const RATE_MIN = 6;
export const RATE_MAX = 24;

export const loanPurposes = [{ id: "home" }, { id: "relocation" }, { id: "education" }, { id: "medical" }, { id: "travel" }, { id: "other" }];

export const residenceStatuses = [{ id: "employment-visa" }, { id: "investor-visa" }, { id: "dependent-visa" }, { id: "residence-permit" }, { id: "other" }];

export const employmentTypes = [{ id: "salaried" }, { id: "self-employed" }, { id: "business-owner" }, { id: "contract" }];

export const experienceBands = [{ id: "under-1" }, { id: "1-3" }, { id: "3-5" }, { id: "5-plus" }];

export const experienceMonths: Record<string, number> = { "under-1": 6, "1-3": 24, "3-5": 48, "5-plus": 72 };

export function experienceBandFor(months: number | null | undefined) {
  if (months === null || months === undefined) return "";
  if (months < 12) return "under-1";
  if (months < 36) return "1-3";
  if (months < 60) return "3-5";
  return "5-plus";
}

export const MAX_EMI_SHARE = 0.5;

export type DocumentId = "passport" | "residence" | "employment" | "income" | "address" | "bank";

export const documentTypes: { id: DocumentId }[] = [{ id: "passport" }, { id: "residence" }, { id: "employment" }, { id: "income" }, { id: "address" }, { id: "bank" }];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FILES = ".pdf,.jpg,.jpeg,.png";

export type StoredFile = { name: string; size: number; raw?: File };

export type LoanStatus = "submitted" | "in-review" | "eligibility-review" | "documents-required" | "approved" | "rejected";

export const statusMeta: Record<LoanStatus, { tone: "info" | "brand" | "success" | "danger" }> = {
  submitted: { tone: "info" },
  "in-review": { tone: "brand" },
  "eligibility-review": { tone: "info" },
  "documents-required": { tone: "brand" },
  approved: { tone: "success" },
  rejected: { tone: "danger" },
};

export type StatusEvent = { status: LoanStatus; at: string; note?: string; noteCode?: string; noteParams?: Record<string, string> };

export type Applicant = {
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  nationality: string;
  city: string;
  residence: string;
};

export type Employment = {
  type: string;
  employer: string;
  jobTitle: string;
  monthlyIncome: number;
  experience: string;
  bankAccount: string;
};

export type LoanApplication = {
  reference: string;
  loanType: LoanTypeId;
  amount: number;
  tenure: number;
  purpose: string;
  emi: number;
  status: LoanStatus;
  applicant: Applicant;
  employment: Employment;
  documents: Partial<Record<DocumentId, StoredFile>>;
  requestedDocuments: DocumentId[];
  history: StatusEvent[];
  createdAt: string;
};

export type LoanDraft = {
  loanType: LoanTypeId;
  amount: number;
  tenure: number;
  purpose: string;
  applicant: Applicant;
  employment: Omit<Employment, "monthlyIncome"> & { monthlyIncome: string };
  documents: Partial<Record<DocumentId, StoredFile>>;
};
