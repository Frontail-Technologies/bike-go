import type { UnwrapSchema } from "elysia";
import type { fxRates } from "@/libs/db/schema";
import type { Currency, PageParams } from "@/libs/types";
import type * as Model from "./model";

export type FxRateView = UnwrapSchema<typeof Model.FxRateItem>;
export type FxRateRow = typeof fxRates.$inferSelect;
export type FxRateInput = { baseCurrency: Currency; quoteCurrency: Currency; rate: string; source: string; effectiveAt: string };
export type FxListQuery = PageParams & { base?: Currency | undefined; quote?: Currency | undefined };
