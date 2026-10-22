export {};

process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.TELEGRAM_BOT_TOKEN = "123456:TEST-TELEGRAM-BOT-TOKEN";
process.env.VAT_RATE_BPS = "1000";
process.env.PLATFORM_FEE_USD_MINOR = "0";
process.env.PLATFORM_FEE_KHR_MINOR = "0";
process.env.BOOKING_HOLD_MINUTES = "15";

const realDatabase = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL = realDatabase ?? "pglite://memory";

const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
process.env.STORAGE_ROOT = join(tmpdir(), `ridego-test-storage-${process.pid}`);

if (realDatabase) {
  const name = new URL(realDatabase).pathname.replace(/^\//, "");
  if (!/test/i.test(name)) throw new Error(`Refusing to reset database "${name}": TEST_DATABASE_URL must point at a database whose name contains "test".`);
  const { default: postgres } = await import("postgres");
  const admin = postgres(realDatabase, { max: 1 });
  await admin.unsafe("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
  await admin.end();
}

const { runMigrations } = await import("../src/libs/db/migrate");
await runMigrations();
