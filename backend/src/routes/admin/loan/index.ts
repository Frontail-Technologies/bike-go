import { Elysia } from "elysia";
import { audit } from "@/libs/audit";
import { ok, okPage, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as DocumentModel from "@/routes/document/model";
import { downloadAnyDocument, reviewDocument } from "@/routes/document/service";
import * as LoanModel from "./model";
import { adminGetLoan, adminListLoans, changeLoanStatus } from "./service";

export const adminLoanRoutes = new Elysia({ name: "RideGo.Admin.Loan", prefix: "/loans", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: LoanModel.LoansGet.Query, response: { 200: LoanModel.LoansGet.Response, ...staffErrors }, detail: { summary: "Loan applications, with search, filters and sorting", security: sessionSecurity } }, async ({ query }) => okPage(await adminListLoans(query)))
  .get("/:reference", { admin: true, params: LoanModel.LoanByReferenceGet.Params, response: { 200: LoanModel.LoanByReferenceGet.Response, ...staffErrors }, detail: { summary: "One application with the full audit trail", security: sessionSecurity } }, async ({ params }) => ok(await adminGetLoan(params.reference)))
  .patch(
    "/:reference/status",
    {
      admin: true,
      params: LoanModel.LoanStatusPatch.Params,
      body: LoanModel.LoanStatusPatch.Body,
      response: { 200: LoanModel.LoanStatusPatch.Response, ...staffErrors },
      detail: {
        summary: "Move an application to a new status",
        description:
          "Only staff can do this, and only along the allowed transitions (see `allowedNextStatuses` on the application). Approval and rejection are manual decisions: there is no automatic scoring. A note is required for `rejected` and `additional_documents_required`.",
        security: sessionSecurity,
      },
    },
    async ({ params, body, user, request, server }) => {
      const changed = await changeLoanStatus(params.reference, user.id, body.status as never, body.note);
      await audit({ user, request, server }, "loan.status", { type: "loan", id: params.reference, details: { status: body.status } });
      return ok(changed);
    },
  )
  .patch(
    "/:reference/documents/:documentId/review",
    {
      admin: true,
      params: DocumentModel.DocumentReviewPatch.Params,
      body: DocumentModel.DocumentReviewPatch.Body,
      response: { 200: DocumentModel.DocumentReviewPatch.Response, ...staffErrors },
      detail: { summary: "Review a document", description: "Mark it verified, needs_review or rejected. A note is required for the last two and is shown to the applicant. Reviewing does not itself change the application's status.", security: sessionSecurity },
    },
    async ({ params, body, user, request, server }) => {
      const reviewed = await reviewDocument(params.reference, user.id, params.documentId, body);
      await audit({ user, request, server }, "loan.document.review", { type: "loan", id: params.reference, details: { documentId: params.documentId, verificationStatus: body.verificationStatus } });
      return ok(reviewed);
    },
  )
  .get(
    "/:reference/documents/:documentId/file",
    { admin: true, params: DocumentModel.DocumentByIdParams, detail: { summary: "Download any application's document", description: "Sent as a private, uncacheable attachment.", security: sessionSecurity } },
    async ({ params }) => downloadAnyDocument(params.reference, params.documentId),
  );
