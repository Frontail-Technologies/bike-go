import { eq } from "drizzle-orm";
import { app } from "../../src/app";
import { db } from "../../src/libs/db";
import { user } from "../../src/libs/db/schema";
import { signTelegramLogin } from "../../src/libs/telegram";
import { json } from "./http";

const ORIGIN = "http://localhost:3000";
let counter = 100_000;

type Init = RequestInit & { cookie?: string };

export const botToken = () => process.env.TELEGRAM_BOT_TOKEN!;

export const request = (path: string, init: Init = {}) => {
  const { cookie, headers, ...rest } = init;
  return app.handle(
    new Request(`http://localhost${path}`, {
      ...rest,
      headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}), ...(headers as Record<string, string> | undefined) },
    }),
  );
};

const withBody = (method: string, path: string, body: unknown, init: Init) =>
  request(path, { ...init, method, body: JSON.stringify(body), headers: { "content-type": "application/json", ...(init.headers as Record<string, string> | undefined) } });

export const postJson = (path: string, body: unknown, init: Init = {}) => withBody("POST", path, body, init);
export const patchJson = (path: string, body: unknown, init: Init = {}) => withBody("PATCH", path, body, init);
export const putJson = (path: string, body: unknown, init: Init = {}) => withBody("PUT", path, body, init);

export function cookieFrom(response: Response) {
  return response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

export function telegramPayload(overrides: Record<string, string | number> = {}, token = botToken()) {
  counter += 1;
  return signTelegramLogin({ id: counter, first_name: "Sokha", last_name: "Chan", username: `sokha${counter}`, auth_date: Math.floor(Date.now() / 1000), ...overrides }, token);
}

export async function signInCustomer(overrides: Record<string, string | number> = {}) {
  const response = await postJson("/api/v1/auth/telegram/login", telegramPayload(overrides));
  if (response.status !== 200) throw new Error(`sign-in failed: ${response.status} ${await response.text()}`);
  const body = await json(response);
  return { cookie: cookieFrom(response), userId: body.user.id as string };
}

export async function signInAdmin(role: "admin" | "super_admin" = "admin") {
  const session = await signInCustomer();
  await db.update(user).set({ role }).where(eq(user.id, session.userId));
  return session;
}
