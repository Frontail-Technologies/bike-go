import { Elysia } from "elysia";
import { customerErrors, ok, okPage, sessionSecurity } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as LoanModel from "./model";
import { createLoan, getMyLoan, listMyLoans, resubmitDocuments, submitLoan, updateLoan } from "./service";

export const loanRoutes = new Elysia({ name: "RideGo.Loan", prefix: "/api/v1/loans", tags: ["Loans"] })
  .use(authPlugin)
  .get(
    "",
    { auth: true, query: LoanModel.LoansGet.Query, response: { 200: LoanModel.LoansGet.Response, ...customerErrors }, detail: { summary: "My loan applications, newest first", security: sessionSecurity } },
    async ({ user, query }) => okPage(await listMyLoans(user.id, query)),
  )
  .post(
    "",
    {
      auth: true,
      body: LoanModel.LoanPost.Body,
      response: { 201: LoanModel.LoanPost.Response, ...customerErrors },
      detail: { summary: "Start a loan application (draft)", description: "Creates a draft you can keep editing until you submit it. Money is integer minor units.", security: sessionSecurity },
    },
    async ({ user, body, status }) => status(201, ok(await createLoan(user.id, body))),
  )
  .get(
    "/:reference",
    { auth: true, params: LoanModel.LoanByReferenceGet.Params, response: { 200: LoanModel.LoanByReferenceGet.Response, ...customerErrors }, detail: { summary: "One of my applications, with documents and status history", security: sessionSecurity } },
    async ({ user, params }) => ok(await getMyLoan(user.id, params.reference)),
  )
  .patch(
    "/:reference",
    {
      auth: true,
      params: LoanModel.LoanPatch.Params,
      body: LoanModel.LoanPatch.Body,
      response: { 200: LoanModel.LoanPatch.Response, ...customerErrors },
      detail: { summary: "Edit a draft application", description: "Only drafts can be edited (`LOAN_NOT_EDITABLE` otherwise). Status can never be set here.", security: sessionSecurity },
    },
    async ({ user, params, body }) => ok(await updateLoan(user.id, params.reference, body)),
  )
  .post(
    "/:reference/submit",
    {
      auth: true,
      params: LoanModel.LoanSubmitPost.Params,
      headers: LoanModel.LoanSubmitPost.Headers,
      response: { 200: LoanModel.LoanSubmitPost.Response, ...customerErrors },
      detail: {
        summary: "Submit a draft",
        description: "Requires every personal and employment field and all required documents. Send an `Idempotency-Key` to make retries safe.",
        security: sessionSecurity,
      },
    },
    async ({ user, params, headers, set }) => {
      const result = await submitLoan(user.id, params.reference, headers["idempotency-key"]);
      if (result.replayed) set.headers["idempotent-replayed"] = "true";
      return ok(result.body);
    },
  )
  .post(
    "/:reference/resubmit",
    {
      auth: true,
      params: LoanModel.LoanResubmitPost.Params,
      response: { 200: LoanModel.LoanResubmitPost.Response, ...customerErrors },
      detail: { summary: "Send back requested documents", description: "Moves `additional_documents_required` back to `documents_under_review` once the requested files are uploaded.", security: sessionSecurity },
    },
    async ({ user, params }) => ok(await resubmitDocuments(user.id, params.reference)),
  );
