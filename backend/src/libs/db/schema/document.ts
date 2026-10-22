import { index, integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { id, timestamptz } from "./columns";
import { loanApplications } from "./loan";

export const loanDocumentType = pgEnum("loan_document_type", [
  "passport",
  "visa_or_residence_permit",
  "employment_proof",
  "salary_or_income_proof",
  "address_proof",
  "bank_statement",
  "other",
]);

export const documentVerificationStatus = pgEnum("document_verification_status", ["uploaded", "verified", "needs_review", "rejected"]);

/**
 * Metadata for a document file. The bytes live in the storage provider under `storageKey`, which is internal:
 * API responses never include it.
 */
export const loanDocuments = pgTable(
  "loan_documents",
  {
    id: id(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => loanApplications.id, { onDelete: "cascade" }),
    type: loanDocumentType("type").notNull(),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    verificationStatus: documentVerificationStatus("verification_status").notNull().default("uploaded"),
    reviewNote: text("review_note"),
    uploadedAt: timestamptz("uploaded_at").notNull().defaultNow(),
    reviewedAt: timestamptz("reviewed_at"),
    reviewedBy: uuid("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [index("loan_documents_application_idx").on(table.applicationId)],
);
