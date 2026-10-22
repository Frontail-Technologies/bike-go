import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { env } from "@/env";
import { closeDb, db, type Db } from "./index";

const migrationsFolder = new URL("../../../drizzle", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/** Applies every pending migration in ./drizzle. Safe to run repeatedly. */
export async function runMigrations(database: Db = db) {
  if (env.DATABASE_URL.startsWith("pglite:")) await migratePglite(database as never, { migrationsFolder });
  else await migratePostgres(database as never, { migrationsFolder });
}

if (import.meta.main) {
  try {
    await runMigrations();
    console.log("Migrations applied.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
