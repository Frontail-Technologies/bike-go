import { and, count, desc, eq, lte } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db, type Executor } from "@/libs/db";
import { PG, pgErrorCode } from "@/libs/db/errors";
import { fxRates } from "@/libs/db/schema";
import { parseRate } from "@/libs/fx";
import type { Currency } from "@/libs/money";
import { pageMeta, pageOf } from "@/libs/pagination";
import type { FxRateView } from "./model";

const view = (row: typeof fxRates.$inferSelect): FxRateView => ({
  id: row.id,
  baseCurrency: row.baseCurrency,
  quoteCurrency: row.quoteCurrency,
  rate: row.rate,
  source: row.source,
  effectiveAt: row.effectiveAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
});

export async function currentRate(executor: Executor, base: Currency, quote: Currency, at: Date = new Date()) {
  const [row] = await executor
    .select()
    .from(fxRates)
    .where(and(eq(fxRates.baseCurrency, base), eq(fxRates.quoteCurrency, quote), lte(fxRates.effectiveAt, at)))
    .orderBy(desc(fxRates.effectiveAt))
    .limit(1);
  return row ?? null;
}

export async function getCurrentRate(base: Currency, quote: Currency) {
  const row = await currentRate(db, base, quote);
  if (!row) throw new AppError("NOT_FOUND", 404, `No ${base} to ${quote} exchange rate is on file.`);
  return view(row);
}

export async function listRates(query: { page?: number | undefined; pageSize?: number | undefined; base?: Currency | undefined; quote?: Currency | undefined }) {
  const paging = pageOf(query);
  const where = and(query.base ? eq(fxRates.baseCurrency, query.base) : undefined, query.quote ? eq(fxRates.quoteCurrency, query.quote) : undefined);
  const [rows, [total]] = await Promise.all([
    db.select().from(fxRates).where(where).orderBy(desc(fxRates.effectiveAt)).limit(paging.limit).offset(paging.offset),
    db.select({ n: count() }).from(fxRates).where(where),
  ]);
  return { data: rows.map(view), meta: pageMeta(paging, total?.n ?? 0) };
}

export async function createRate(staffUserId: string, input: { baseCurrency: Currency; quoteCurrency: Currency; rate: string; source: string; effectiveAt: string }) {
  if (input.baseCurrency === input.quoteCurrency) {
    throw new AppError("VALIDATION_ERROR", 422, "The base and quote currencies must differ.", [{ path: "quoteCurrency", message: "Must differ from the base currency." }]);
  }
  try {
    parseRate(input.rate);
  } catch {
    throw new AppError("VALIDATION_ERROR", 422, "The rate must be greater than zero.", [{ path: "rate", message: "Must be greater than zero." }]);
  }
  try {
    const [created] = await db
      .insert(fxRates)
      .values({ baseCurrency: input.baseCurrency, quoteCurrency: input.quoteCurrency, rate: input.rate, source: input.source.trim(), effectiveAt: new Date(input.effectiveAt), createdBy: staffUserId })
      .returning();
    return view(created!);
  } catch (error) {
    if (pgErrorCode(error) === PG.uniqueViolation) {
      throw new AppError("VALIDATION_ERROR", 422, "A rate for that pair and instant already exists. Rates are append-only: record a new one with a later effective time.", [
        { path: "effectiveAt", message: "Already recorded." },
      ]);
    }
    throw error;
  }
}
