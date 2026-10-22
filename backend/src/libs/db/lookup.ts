import { eq } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { AppError } from "@/libs/api";
import { db } from "./index";

export async function idByReference(table: PgTable & { id: AnyPgColumn; reference: AnyPgColumn }, reference: string, what: string) {
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.reference, reference)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, `${what} not found.`);
  return row.id as string;
}
