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
import { placeholderEmail } from "@/libs/identity";

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
            email: placeholderEmail(identity.telegramId),
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
      role: { type: "string", required: false, defaultValue: "customer", input: false },
    },
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  socialProviders: googleConfigured
    ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! } }
    : {},
  plugins: [telegram(), openAPI({ disableDefaultReference: true })],
});
