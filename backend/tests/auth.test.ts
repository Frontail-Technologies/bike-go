import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { account, user } from "../src/libs/db/schema";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer, telegramPayload } from "./helpers/auth";

describe("authentication guards", () => {
  test("no session is 401 with the standard envelope", async () => {
    const response = await request("/api/v1/me");
    expect(response.status).toBe(401);
    expect(await json(response)).toMatchObject({ success: false, error: { code: "AUTH_REQUIRED" } });
  });

  test("a made-up session cookie is 401", async () => {
    const response = await request("/api/v1/me", { cookie: "better-auth.session_token=not-a-real-token.abc" });
    expect(response.status).toBe(401);
  });
});

describe("Telegram sign-in", () => {
  test("a correctly signed payload creates a user and a session", async () => {
    const { cookie, userId } = await signInCustomer({ first_name: "Dara", last_name: "Sok" });
    expect(cookie).toContain("better-auth.session_token=");

    const me = await json(await request("/api/v1/me", { cookie }));
    expect(me.success).toBe(true);
    expect(me.data).toMatchObject({ id: userId, role: "customer", fullName: "Dara Sok", providers: ["telegram"], profileComplete: false });
    // The placeholder address Telegram users get is never shown as a real email.
    expect(me.data.email).toBeNull();
    expect(me.data.missingFields).toContain("phone");
  });

  test("signing in again with the same Telegram id reuses the account", async () => {
    const first = await signInCustomer({ id: 777001 });
    const second = await signInCustomer({ id: 777001 });
    expect(second.userId).toBe(first.userId);
    const accounts = await db.select().from(account).where(eq(account.accountId, "777001"));
    expect(accounts.length).toBe(1);
  });

  test("a forged payload is rejected: changed field, wrong bot token, expired, unsigned", async () => {
    const good = telegramPayload({ id: 888001 });
    const tampered = { ...good, id: 888002 };
    const wrongBot = telegramPayload({ id: 888003 }, "999999:SOMEONE-ELSES-BOT-TOKEN");
    const expired = telegramPayload({ id: 888004, auth_date: Math.floor(Date.now() / 1000) - 3600 });
    const unsigned: Record<string, unknown> = { ...good };
    delete unsigned.hash;

    for (const payload of [tampered, wrongBot, expired, unsigned, {}]) {
      const response = await postJson("/api/v1/auth/telegram/login", payload);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.headers.getSetCookie().length).toBe(0);
    }
    // None of the forged ids became users.
    const created = await db.select().from(account).where(eq(account.providerId, "telegram"));
    expect(created.some((a) => ["888001", "888002", "888003", "888004"].includes(a.accountId))).toBe(false);
  });
});

describe("profile", () => {
  test("PATCH /me updates the allowed fields and reports completion", async () => {
    const { cookie } = await signInCustomer();
    const response = await patchJson("/api/v1/me", { phone: "+855 12 345 678", dateOfBirth: "1992-04-18", nationality: "Cambodian", city: "Phnom Penh" }, { cookie });
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.data).toMatchObject({ phone: "+855 12 345 678", dateOfBirth: "1992-04-18", nationality: "Cambodian", city: "Phnom Penh", profileComplete: true, missingFields: [] });
  });

  test("invalid input is a 422 in the error envelope", async () => {
    const { cookie } = await signInCustomer();
    const badPhone = await patchJson("/api/v1/me", { phone: "abc" }, { cookie });
    expect(badPhone.status).toBe(422);
    expect(await json(badPhone)).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
    const underage = await patchJson("/api/v1/me", { dateOfBirth: "2020-01-01" }, { cookie });
    expect(underage.status).toBe(422);
    const notADate = await patchJson("/api/v1/me", { dateOfBirth: "2020-02-31" }, { cookie });
    expect(notADate.status).toBe(422);
  });

  test("a role sent by the client is ignored", async () => {
    const { cookie, userId } = await signInCustomer();
    const viaMe = await patchJson("/api/v1/me", { fullName: "Honest Person", role: "super_admin" }, { cookie });
    expect(viaMe.status).toBe(200);
    expect((await json(viaMe)).data.role).toBe("customer");

    // Better Auth's own update endpoint must not accept it either.
    await postJson("/api/v1/auth/update-user", { name: "Still Honest", role: "super_admin" }, { cookie });
    const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
    expect(row?.role).toBe("customer");
  });
});

describe("roles", () => {
  test("a customer is refused on admin routes with 403", async () => {
    const { cookie } = await signInCustomer();
    const response = await request("/api/v1/admin/me", { cookie });
    expect(response.status).toBe(403);
    expect(await json(response)).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  test("an anonymous caller gets 401 on admin routes", async () => {
    expect((await request("/api/v1/admin/me")).status).toBe(401);
  });

  test("an admin gets through", async () => {
    const { cookie, userId } = await signInAdmin("admin");
    const response = await request("/api/v1/admin/me", { cookie });
    expect(response.status).toBe(200);
    expect((await json(response)).data).toEqual({ id: userId, role: "admin" });
  });
});
