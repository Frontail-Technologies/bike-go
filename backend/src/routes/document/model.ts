import { t } from "elysia";
import { Envelope } from "@/libs/api";
import { DocumentItem, DocumentVerificationStatus, LoanReferenceParams } from "@/routes/loan/model";

const DocumentParams = t.Object({ ...LoanReferenceParams.properties, documentId: t.String({ format: "uuid" }) });

export const DocumentsGet = { Params: LoanReferenceParams, Response: Envelope(t.Array(DocumentItem)) };

export const DocumentPost = {
  Params: LoanReferenceParams,
  Body: t.Object({
    file: t.File({ description: "PDF, JPG or PNG, up to 5 MB. The real file type is checked, not the extension." }),
    type: t.String({ description: "passport, visa_or_residence_permit, employment_proof, salary_or_income_proof, address_proof, bank_statement or other" }),
  }),
  Response: Envelope(DocumentItem),
};

export const DocumentByIdParams = DocumentParams;

export const DocumentPatch = {
  Params: DocumentParams,
  Body: t.Object(
    {
      file: t.Optional(t.File({ description: "Replacement file: PDF, JPG or PNG, up to 5 MB. The real file type is checked, not the extension." })),
      type: t.Optional(t.String({ description: "A new document type, if the file was filed under the wrong one" })),
    },
    { additionalProperties: false },
  ),
  Response: Envelope(DocumentItem),
};
export const DocumentDelete = { Params: DocumentParams, Response: Envelope(t.Object({ id: t.String({ format: "uuid" }) })) };

export const DocumentReviewPatch = {
  Params: DocumentParams,
  Body: t.Object(
    {
      verificationStatus: t.UnionEnum(["verified", "needs_review", "rejected"]),
      note: t.Optional(t.String({ minLength: 2, maxLength: 1000, description: "Shown to the applicant. Required for needs_review and rejected" })),
    },
    { additionalProperties: false },
  ),
  Response: Envelope(DocumentItem),
};
export { DocumentVerificationStatus };
