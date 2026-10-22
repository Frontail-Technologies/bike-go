import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as relations from "./relations";
import * as schema from "./schema";

export const fullSchema = { ...schema, ...relations };

/** Driver-independent database type: the postgres.js driver in production, PGlite in tests. */
export type Db = PgDatabase<PgQueryResultHKT, typeof fullSchema>;
/** What `db.transaction` hands its callback. Services accept `Executor` so they work inside or outside one. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Executor = Db | Tx;

const isPglite = env.DATABASE_URL.startsWith("pglite:");

async function connect(): Promise<{ db: Db; close: () => Promise<void> }> {
  if (isPglite) {
    // PGlite is a dev dependency: an in-process Postgres used by the test suite. Never loaded in production.
    const [{ PGlite }, { btree_gist }, { drizzle }] = await Promise.all([
      import("@electric-sql/pglite"),
      import("@electric-sql/pglite/contrib/btree_gist"),
      import("drizzle-orm/pglite"),
    ]);
    const client = new PGlite({ extensions: { btree_gist } });
    return { db: drizzle(client, { schema: fullSchema }) as unknown as Db, close: () => client.close() };
  }

  const client = postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 20 : 10,
    // Timestamps are timestamptz; keep Date <-> UTC conversion to the driver.
    connection: { timezone: "UTC" },
  });
  return { db: drizzlePostgres(client, { schema: fullSchema }) as unknown as Db, close: () => client.end({ timeout: 5 }) };
}

const connection = await connect();

export const db = connection.db;
export const closeDb = connection.close;
export { schema };

/** `db.execute` returns `{ rows }` on PGlite and a bare array on postgres.js. This hides the difference. */
export function rowsOf<T>(result: unknown): T[] {
  return Array.isArray(result) ? (result as T[]) : ((result as { rows: T[] }).rows ?? []);
}
