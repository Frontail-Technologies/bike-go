export {};

process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.TELEGRAM_BOT_TOKEN = "123456:TEST-TELEGRAM-BOT-TOKEN";
process.env.VAT_RATE_BPS = "1000";
process.env.PLATFORM_FEE_USD_MINOR = "0";
process.env.PLATFORM_FEE_KHR_MINOR = "0";
process.env.BOOKING_HOLD_MINUTES = "15";
process.env.DASHBOARD_CACHE_SECONDS = "0";

const { startFakeS3, registerFakeS3 } = await import("./helpers/fake-s3");
const fake = startFakeS3("ridego-test");
registerFakeS3(fake);
process.env.STORAGE_DRIVER = "r2";
process.env.R2_ENDPOINT = fake.url;
process.env.R2_BUCKET = fake.bucket;
process.env.R2_ACCESS_KEY_ID = "test-access-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";

const { startFakePayway, registerFakePayway } = await import("./helpers/fake-payway");
const payway = startFakePayway("test-merchant", "test-payway-api-key");
registerFakePayway(payway);
process.env.PAYMENT_DRIVER = "payway";
process.env.PAYWAY_MERCHANT_ID = payway.merchantId;
process.env.PAYWAY_API_KEY = payway.apiKey;
process.env.PAYWAY_CHECK_URL = `${payway.url}/check-transaction-2`;
process.env.PAYWAY_CHECKOUT_URL = `${payway.url}/purchase`;

const realDatabase = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL = realDatabase ?? "pglite://memory";

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
