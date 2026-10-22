import type { SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Executor } from "./types";

export async function lockRows(executor: Executor, table: PgTable & { id: AnyPgColumn }, where: SQL) {
  return executor.select({ id: table.id }).from(table).where(where).for("update");
}
