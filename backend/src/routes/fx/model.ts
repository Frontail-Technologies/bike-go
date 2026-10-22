import { t, type UnwrapSchema } from "elysia";
import { Currency, Envelope, PaginationQuery } from "@/libs/api";

export const FxRateItem = t.Object({
  id: t.String({ format: "uuid" }),
  baseCurrency: Currency,
  quoteCurrency: Currency,
  rate: t.String({ description: "Units of the quote currency per one unit of the base currency, up to 8 decimals" }),
  source: t.String({ description: "Where the rate comes from, for example the central bank's published rate" }),
  effectiveAt: t.String({ format: "date-time" }),
  createdAt: t.String({ format: "date-time" }),
});

export const FxCurrentGet = {
  Query: t.Object({ base: Currency, quote: Currency }),
  Response: Envelope(FxRateItem),
};

export const FxListGet = {
  Query: t.Object({ ...PaginationQuery.properties, base: t.Optional(Currency), quote: t.Optional(Currency) }),
  Response: Envelope(t.Array(FxRateItem)),
};

export const FxPost = {
  Body: t.Object(
    {
      baseCurrency: Currency,
      quoteCurrency: Currency,
      rate: t.String({ pattern: "^\\d{1,12}(\\.\\d{1,8})?$", description: "For example 4100 or 4087.5" }),
      source: t.String({ minLength: 2, maxLength: 200 }),
      effectiveAt: t.String({ format: "date-time" }),
    },
    { additionalProperties: false },
  ),
  Response: Envelope(FxRateItem),
};

export type FxRateView = UnwrapSchema<typeof FxRateItem>;
