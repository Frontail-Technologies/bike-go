import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { db, rowsOf } from "../src/libs/db";

describe("database", () => {
  test("migrations created every domain table", async () => {
    const rows = rowsOf<{ table_name: string }>(await db.execute(sql`select table_name from information_schema.tables where table_schema = 'public'`));
    const names = new Set(rows.map((row) => row.table_name));
    for (const table of [
      "user", "session", "account", "verification", "customer_profiles", "locations", "vehicles", "vehicle_images",
      "vehicle_blocks", "booking_addons", "bookings", "booking_addon_items", "loan_applications", "loan_documents",
      "loan_status_history", "idempotency_keys",
    ]) {
      expect(names.has(table)).toBe(true);
    }
  });

  test("the booking exclusion constraint exists", async () => {
    const rows = rowsOf<{ conname: string }>(await db.execute(sql`select conname from pg_constraint where conname = 'bookings_no_overlap'`));
    expect(rows.length).toBe(1);
  });
});
