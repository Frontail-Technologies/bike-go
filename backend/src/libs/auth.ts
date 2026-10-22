import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { openAPI } from "better-auth/plugins";
import type { BetterAuthPlugin } from "better-auth";
import * as z from "zod";
import { env } from "@/env";
import { db, schema } from "@/libs/db";
import { verifyTelegramLogin } from "@/libs/telegram";

/**
 * Sign in with Telegram (Login Widget). The browser posts the widget's payload; the server verifies the
 * signature with the bot token and only then finds or creates the user, so a forged identity can never get
 * a session. Telegram gives no email, so a reserved-domain placeholder (never routable) fills the required
 * column. The Telegram id is the account's `accountId`, which is what identifies the person from then on.
 */
const telegram = (): BetterAuthPlugin => ({
  id: "telegram",
  endpoints: {
    telegramLogin: createAuthEndpoint(
      "/telegram/login",
      {
        method: "POST",
        body: z.record(z.string(), z.union([z.string(), z.number()])),
        metadata: { openapi: { description: "Sign in with a Telegram Login Widget payload. The signature is verified server-side." } },
      },
      async (ctx) => {
        if (!env.TELEGRAM_BOT_TOKEN) throw APIError.from("SERVICE_UNAVAILABLE", { code: "TELEGRAM_NOT_CONFIGURED", message: "Telegram sign-in is not configured." });

        const verified = verifyTelegramLogin(ctx.body, { botToken: env.TELEGRAM_BOT_TOKEN, maxAgeSeconds: env.TELEGRAM_AUTH_MAX_AGE_SECONDS });
        if (!verified.ok) throw APIError.from("UNAUTHORIZED", { code: "TELEGRAM_AUTH_INVALID", message: "Telegram sign-in could not be verified." });
        const { identity } = verified;

        const adapter = ctx.context.internalAdapter;
        const existing = await adapter.findAccountByKey({ providerId: "telegram", accountId: identity.telegramId });
        let user = existing ? await adapter.findUserById(existing.userId) : null;

        if (!user) {
          const name = [identity.firstName, identity.lastName].filter(Boolean).join(" ");
          user = await adapter.createUser({
            name,
            email: `telegram-${identity.telegramId}@users.ridego.invalid`,
            emailVerified: false,
            image: identity.photoUrl,
          }, { method: "telegram" });
          await adapter.createAccount({ userId: user.id, providerId: "telegram", accountId: identity.telegramId });
        }

        const session = await adapter.createSession(user.id);
        await setSessionCookie(ctx, { session, user });
        return ctx.json({ user: { id: user.id, name: user.name, image: user.image ?? null } });
      },
    ),
  },
});

export const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  appName: "RideGo",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  trustedOrigins: env.FRONTEND_ORIGINS,
  advanced: {
    database: { generateId: "uuid" },
    useSecureCookies: env.NODE_ENV === "production",
  },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: env.NODE_ENV !== "test" },
  user: {
    additionalFields: {
      // Never writable from a client: only the database (seed script, admin tooling) assigns roles.
      role: { type: "string", required: false, defaultValue: "customer", input: false },
    },
  },
  account: {
    // A Google account whose verified email matches an existing user (for example a pre-created admin) is linked to it.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  socialProviders: googleConfigured
    ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! } }
    : {},
  // Generates the OpenAPI description of the auth endpoints; the docs page itself is served by our own OpenAPI plugin.
  plugins: [telegram(), openAPI({ disableDefaultReference: true })],
});

export type Session = typeof auth.$Infer.Session;
