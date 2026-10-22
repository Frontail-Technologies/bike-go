import { Elysia } from "elysia";
import { ok } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
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
  );
