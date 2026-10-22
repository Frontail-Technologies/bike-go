import type { UnwrapModels, UnwrapSchema } from "elysia";
import type * as Model from "./model";

export type AdminLoanView = UnwrapSchema<typeof Model.AdminLoan>;
export type LoansGet = UnwrapModels<typeof Model.LoansGet>;
export type LoanStatusPatch = UnwrapModels<typeof Model.LoanStatusPatch>;
