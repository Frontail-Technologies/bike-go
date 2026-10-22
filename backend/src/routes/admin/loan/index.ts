import { Elysia } from "elysia";
import { ok } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as DocumentModel from "@/routes/document/model";
import { downloadAnyDocument, reviewDocument } from "@/routes/document/service";
import * as LoanModel from "./model";
import { adminGetLoan, adminListLoans, changeLoanStatus } from "./service";

const security = [{ sessionCookie: [] }];

export const adminLoanRoutes = new Elysia({ name: "RideGo.Admin.Loan", prefix: "/loans", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: LoanModel.LoansGet.Query, response: { 200: LoanModel.LoansGet.Response }, detail: { summary: "Loan applications, with search, filters and sorting", security } }, async ({ query }) => {
    const { data, meta } = await adminListLoans(query);
    return ok(data, meta);
  })
  .get("/:reference", { admin: true, params: LoanModel.LoanByReferenceGet.Params, response: { 200: LoanModel.LoanByReferenceGet.Response }, detail: { summary: "One application with the full audit trail", security } }, async ({ params }) => ok(await adminGetLoan(params.reference)))
  .patch(
    "/:reference/status",
    {
      admin: true,
      params: LoanModel.LoanStatusPatch.Params,
      body: LoanModel.LoanStatusPatch.Body,
      response: { 200: LoanModel.LoanStatusPatch.Response },
      detail: {
        summary: "Move an application to a new status",
        description:
          "Only staff can do this, and only along the allowed transitions (see `allowedNextStatuses` on the application). Approval and rejection are manual decisions: there is no automatic scoring. A note is required for `rejected` and `additional_documents_required`.",
        security,
      },
    },
    async ({ params, body, user }) => ok(await changeLoanStatus(params.reference, user.id, body.status as never, body.note)),
  )
  .patch(
    "/:reference/documents/:documentId/review",
    {
      admin: true,
      params: DocumentModel.DocumentReviewPatch.Params,
      body: DocumentModel.DocumentReviewPatch.Body,
      response: { 200: DocumentModel.DocumentReviewPatch.Response },
      detail: { summary: "Review a document", description: "Mark it verified, needs_review or rejected. A note is required for the last two and is shown to the applicant. Reviewing does not itself change the application's status.", security },
    },
    async ({ params, body, user }) => ok(await reviewDocument(params.reference, user.id, params.documentId, body)),
  )
  .get(
    "/:reference/documents/:documentId/file",
    { admin: true, params: DocumentModel.DocumentByIdParams, detail: { summary: "Download any application's document", description: "Sent as a private, uncacheable attachment.", security } },
    async ({ params }) => downloadAnyDocument(params.reference, params.documentId),
  );
