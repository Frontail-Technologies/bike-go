export {};
// Must run before `src/env.ts` is imported anywhere: it decides which database driver loads.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "pglite://memory";
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.TELEGRAM_BOT_TOKEN = "123456:TEST-TELEGRAM-BOT-TOKEN";

const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
process.env.STORAGE_ROOT = join(tmpdir(), `ridego-test-storage-${process.pid}`);

const { runMigrations } = await import("../src/libs/db/migrate");
await runMigrations();
