import { z } from "zod";

/** Validated process environment. Outside production a few secrets get dev-only defaults. */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:4000"),
  WEB_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  STORAGE_DIR: z.string().default("./storage"),
  TAX_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(1000),
});

const parsed = schema.safeParse({
  ...process.env,
  // Treat empty strings from a copied .env.example as unset.
  ...Object.fromEntries(Object.entries(process.env).filter(([, value]) => value === "").map(([key]) => [key, undefined])),
});

if (!parsed.success) {
  console.error("Invalid environment:", z.prettifyError(parsed.error));
  throw new Error("Invalid environment configuration");
}

const value = parsed.data;
const production = value.NODE_ENV === "production";

if (production) {
  const missing = (["DATABASE_URL", "BETTER_AUTH_SECRET"] as const).filter((key) => !value[key]);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
}

export const env = {
  ...value,
  isProduction: production,
  isTest: value.NODE_ENV === "test",
  /** Dev and test fall back to a fixed secret. Production refuses to start without a real one. */
  BETTER_AUTH_SECRET: value.BETTER_AUTH_SECRET ?? "dev-only-secret-that-is-never-used-in-production-0000",
};

export type Env = typeof env;
