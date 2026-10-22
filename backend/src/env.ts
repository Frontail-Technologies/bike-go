import { z } from "zod";

const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());

const rawEnv = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().url().default("postgres://ridego:ridego@localhost:5432/ridego"),
    BETTER_AUTH_SECRET: z.string().min(32).default("development-secret-change-before-production"),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
    FRONTEND_ORIGINS: z.string().default("http://localhost:3000"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_AUTH_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(300),
    STORAGE_DRIVER: z.enum(["local", "r2"]).default("local"),
    STORAGE_ROOT: z.string().default("./storage"),
    R2_ACCOUNT_ID: optionalText,
    R2_ENDPOINT: optionalText,
    R2_BUCKET: optionalText,
    R2_ACCESS_KEY_ID: optionalText,
    R2_SECRET_ACCESS_KEY: optionalText,
    VAT_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(1000),
    PLATFORM_FEE_USD_MINOR: z.coerce.number().int().nonnegative().default(0),
    PLATFORM_FEE_KHR_MINOR: z.coerce.number().int().nonnegative().default(0),
    BOOKING_HOLD_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
    MAX_REQUEST_BODY_BYTES: z.coerce.number().int().positive().default(16 * 1024 * 1024),
  })
  .parse(process.env);

if (rawEnv.NODE_ENV === "production") {
  if (rawEnv.BETTER_AUTH_SECRET === "development-secret-change-before-production") {
    throw new Error("BETTER_AUTH_SECRET must be configured in production");
  }
  if (!rawEnv.GOOGLE_CLIENT_ID || !rawEnv.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials must be configured in production");
  }
  if (!rawEnv.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN must be configured in production");
  if (rawEnv.STORAGE_DRIVER !== "r2") throw new Error("STORAGE_DRIVER must be r2 in production: local disk storage is for development only");
}

if (rawEnv.STORAGE_DRIVER === "r2") {
  const missing = [
    ["R2_BUCKET", rawEnv.R2_BUCKET],
    ["R2_ACCESS_KEY_ID", rawEnv.R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", rawEnv.R2_SECRET_ACCESS_KEY],
    ["R2_ACCOUNT_ID or R2_ENDPOINT", rawEnv.R2_ENDPOINT ?? rawEnv.R2_ACCOUNT_ID],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) throw new Error(`STORAGE_DRIVER=r2 needs: ${missing.join(", ")}`);
}

export const env = {
  ...rawEnv,
  FRONTEND_ORIGINS: rawEnv.FRONTEND_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
