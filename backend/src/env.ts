import { z } from "zod";

const rawEnv = z.object({
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
  STORAGE_ROOT: z.string().default("./storage"),
  PLATFORM_FEE_MINOR: z.coerce.number().int().nonnegative().default(100),
  TAX_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(1800)
}).parse(process.env);

if (rawEnv.NODE_ENV === "production") {
  if (rawEnv.BETTER_AUTH_SECRET === "development-secret-change-before-production") {
    throw new Error("BETTER_AUTH_SECRET must be configured in production");
  }
  if (!rawEnv.GOOGLE_CLIENT_ID || !rawEnv.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials must be configured in production");
  }
  if (!rawEnv.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN must be configured in production");
}

export const env = {
  ...rawEnv,
  FRONTEND_ORIGINS: rawEnv.FRONTEND_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
};
