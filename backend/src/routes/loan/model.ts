import { t, type UnwrapModels, type UnwrapSchema } from "elysia";
import { Currency, Envelope, PaginationQuery } from "@/libs/api";
import { DOCUMENT_TYPES, EMPLOYMENT_TYPES, LOAN_STATUSES, LOAN_TYPES, RESIDENCE_STATUSES } from "./rules";

export const LoanStatus = t.UnionEnum([...LOAN_STATUSES]);
export const LoanType = t.UnionEnum([...LOAN_TYPES]);
export const DocumentType = t.UnionEnum([...DOCUMENT_TYPES]);
export const DocumentVerificationStatus = t.UnionEnum(["uploaded", "verified", "needs_review", "rejected"]);

const Reference = t.String({ pattern: "^LN\\d{8}$", description: "Application reference, for example LN10492038" });
export const LoanReferenceParams = t.Object({ reference: Reference });

const Fields = {
  loanType: LoanType,
  currency: Currency,
  requestedAmountMinor: t.Integer({ minimum: 1, description: "Minor units of `currency` (cents/sen)" }),
  tenureMonths: t.Integer({ minimum: 1, maximum: 120 }),
  purpose: t.String({ minLength: 2, maxLength: 200 }),

  fullName: t.String({ minLength: 2, maxLength: 120, description: "As printed on the passport" }),
  mobile: t.String({ pattern: "^\\+?[\\d\\s-]{7,20}$", description: "With country code, for example +855 12 345 678" }),
  email: t.String({ format: "email", maxLength: 200 }),
  dateOfBirth: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "YYYY-MM-DD" }),
  nationality: t.String({ minLength: 2, maxLength: 80 }),
  currentCity: t.String({ minLength: 2, maxLength: 80 }),
  residenceStatus: t.UnionEnum([...RESIDENCE_STATUSES]),

  employmentType: t.UnionEnum([...EMPLOYMENT_TYPES]),
  employerName: t.String({ minLength: 2, maxLength: 160 }),
  jobTitle: t.String({ minLength: 2, maxLength: 120 }),
  monthlyIncomeMinor: t.Integer({ minimum: 1, description: "Before tax, minor units of `currency`" }),
  workExperienceMonths: t.Integer({ minimum: 0, maximum: 720 }),
  hasActiveBankAccount: t.Boolean(),
};

const Applicant = t.Object({
  fullName: t.Nullable(t.String()),
  mobile: t.Nullable(t.String()),
  email: t.Nullable(t.String()),
  dateOfBirth: t.Nullable(t.String()),
  nationality: t.Nullable(t.String()),
  currentCity: t.Nullable(t.String()),
  residenceStatus: t.Nullable(t.String()),
});

const Employment = t.Object({
  employmentType: t.Nullable(t.String()),
  employerName: t.Nullable(t.String()),
  jobTitle: t.Nullable(t.String()),
  monthlyIncomeMinor: t.Nullable(t.Number()),
  workExperienceMonths: t.Nullable(t.Number()),
  hasActiveBankAccount: t.Nullable(t.Boolean()),
});

export const DocumentItem = t.Object({
  id: t.String({ format: "uuid" }),
  type: DocumentType,
  originalFilename: t.String(),
  mimeType: t.String(),
  sizeBytes: t.Number(),
  verificationStatus: DocumentVerificationStatus,
  reviewNote: t.Nullable(t.String()),
  uploadedAt: t.String({ format: "date-time" }),
});

const HistoryItem = t.Object({
  oldStatus: t.Nullable(LoanStatus),
  newStatus: LoanStatus,
  note: t.Nullable(t.String()),
  by: t.UnionEnum(["you", "staff", "system"]),
  createdAt: t.String({ format: "date-time" }),
});

export const Loan = t.Object({
  reference: t.String(),
  status: LoanStatus,
  loanType: LoanType,
  currency: Currency,
  requestedAmountMinor: t.Number(),
  tenureMonths: t.Number(),
  purpose: t.Nullable(t.String()),
  applicant: Applicant,
  employment: Employment,
  submittedAt: t.Nullable(t.String({ format: "date-time" })),
  editable: t.Boolean({ description: "True only while the application is a draft" }),
  documents: t.Array(DocumentItem),
  history: t.Array(HistoryItem),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const LoanPost = {
  Body: t.Object({
    loanType: Fields.loanType,
    requestedAmountMinor: Fields.requestedAmountMinor,
    tenureMonths: Fields.tenureMonths,
    currency: t.Optional(Fields.currency),
    purpose: t.Optional(Fields.purpose),
    fullName: t.Optional(Fields.fullName),
    mobile: t.Optional(Fields.mobile),
    email: t.Optional(Fields.email),
    dateOfBirth: t.Optional(Fields.dateOfBirth),
    nationality: t.Optional(Fields.nationality),
    currentCity: t.Optional(Fields.currentCity),
    residenceStatus: t.Optional(Fields.residenceStatus),
    employmentType: t.Optional(Fields.employmentType),
    employerName: t.Optional(Fields.employerName),
    jobTitle: t.Optional(Fields.jobTitle),
    monthlyIncomeMinor: t.Optional(Fields.monthlyIncomeMinor),
    workExperienceMonths: t.Optional(Fields.workExperienceMonths),
    hasActiveBankAccount: t.Optional(Fields.hasActiveBankAccount),
  }, { additionalProperties: false }),
  Response: Envelope(Loan),
};

export const LoanPatch = {
  Params: LoanReferenceParams,
  Body: t.Object({ ...t.Partial(t.Object(Fields)).properties }, { additionalProperties: false }),
  Response: Envelope(Loan),
};

export const LoansGet = {
  Query: t.Object({ ...PaginationQuery.properties, status: t.Optional(LoanStatus) }),
  Response: Envelope(t.Array(Loan)),
};

export const LoanByReferenceGet = { Params: LoanReferenceParams, Response: Envelope(Loan) };

export const LoanSubmitPost = {
  Params: LoanReferenceParams,
  Headers: t.Object({ "idempotency-key": t.Optional(t.String({ minLength: 8, maxLength: 128 })) }),
  Response: Envelope(Loan),
};

export const LoanResubmitPost = { Params: LoanReferenceParams, Response: Envelope(Loan) };

export type LoanView = UnwrapSchema<typeof Loan>;
export type LoanPost = UnwrapModels<typeof LoanPost>;
export type LoanPatch = UnwrapModels<typeof LoanPatch>;
export type LoansGet = UnwrapModels<typeof LoansGet>;
