import type { UnwrapModels } from "elysia";
import type { loanDocuments } from "@/libs/db/schema";
import type * as Model from "./model";

export type DocumentReviewPatch = UnwrapModels<typeof Model.DocumentReviewPatch>;
export type DocumentRow = typeof loanDocuments.$inferSelect;
