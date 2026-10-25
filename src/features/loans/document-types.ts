import type { DocumentId } from "./data";

/** Maps customer-facing document slots to the API's stable document codes. */
export const loanDocumentType = (type: DocumentId): string => {
  switch (type) {
    case "residence": return "visa_or_residence_permit";
    case "employment": return "employment_proof";
    case "income": return "salary_or_income_proof";
    case "address": return "address_proof";
    case "bank": return "bank_statement";
    default: return "passport";
  }
};

export const customerDocumentId = (type: string): DocumentId | undefined => ({
  passport: "passport",
  visa_or_residence_permit: "residence",
  employment_proof: "employment",
  salary_or_income_proof: "income",
  address_proof: "address",
  bank_statement: "bank",
}[type] as DocumentId | undefined);
