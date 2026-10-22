import type { UnwrapModels, UnwrapSchema } from "elysia";
import type { loanApplications, loanDocuments } from "@/libs/db/schema";
import type * as Model from "./model";
import type { DOCUMENT_TYPES, LOAN_STATUSES, LOAN_TYPES } from "./rules";

export type LoanTypeId = (typeof LOAN_TYPES)[number];
export type LoanStatus = (typeof LOAN_STATUSES)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type LoanLimits = {
  minMinor: number;
  maxMinor: number;
  maxTenure: number;
  derivedFrom: { rate: string; source: string; effectiveAt: Date } | null;
};

export type LoanView = UnwrapSchema<typeof Model.Loan>;
export type LoanPost = UnwrapModels<typeof Model.LoanPost>;
export type LoanPatch = UnwrapModels<typeof Model.LoanPatch>;
export type LoansGet = UnwrapModels<typeof Model.LoansGet>;

export type Application = typeof loanApplications.$inferSelect;
export type LoanDocumentRow = typeof loanDocuments.$inferSelect;
