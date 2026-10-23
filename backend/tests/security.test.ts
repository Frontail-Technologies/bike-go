import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { Elysia } from "elysia";
import { app } from "../src/app";
import { db } from "../src/libs/db";
import { eq } from "drizzle-orm";
import { auditLog, locations } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { errorPlugin } from "../src/plugins/error";
import { createRateLimit, DEFAULT_RATE_RULES, WindowCounter } from "../src/plugins/rate-limit";
import { cleanupExtraVehicles } from "./helpers/db";
import { asFile, formOf, png } from "./helpers/files";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer, telegramPayload } from "./helpers/auth";

beforeAll(async () => {
  await seedCatalog();
  seeded = (await db.select({ id: locations.id, name: locations.name }).from(locations).orderBy(locations.createdAt).limit(1))[0];
});
let seeded: { id: string; name: string } | undefined;
afterAll(async () => {
  await cleanupExtraVehicles();
  if (seeded) await db.update(locations).set({ name: seeded.name }).where(eq(locations.id, seeded.id));
});

const ORIGIN = "http://localhost:3000";

const raw = (path: string, init: RequestInit & { cookie?: string } = {}) => {
  const { cookie, headers, ...rest } = init;
  return app.handle(new Request(`http://localhost${path}`, { ...rest, headers: { ...(cookie ? { cookie } : {}), ...(headers as Record<string, string> | undefined) } }));
};

describe("rate limiting", () => {
  const limited = (limit: number, windowSeconds = 60, enabled = true) =>
    new Elysia()
      .use(errorPlugin)
      .use(createRateLimit({ rules: [{ name: "all", limit, windowSeconds, applies: (method) => method !== "OPTIONS" }], enabled, counter: new WindowCounter(), name: `limit-${Math.random()}` }))
      .get("/ping", () => ({ ok: true }));

  test("requests over the limit get 429 in the standard envelope with Retry-After and rate limit headers", async () => {
    const server = limited(3);
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < 5; i++) {
      last = await server.handle(new Request("http://localhost/ping"));
      statuses.push(last.status);
      if (i === 0) {
        expect(last.headers.get("ratelimit-limit")).toBe("3");
        expect(last.headers.get("ratelimit-remaining")).toBe("2");
      }
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(last!.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(last!.headers.get("ratelimit-remaining")).toBe("0");
    expect(await json(last!)).toMatchObject({ success: false, error: { code: "RATE_LIMITED", details: { retryAfterSeconds: expect.any(Number) } } });
  });

  test("the window resets, a disabled limiter lets everything through, and preflights are never counted", async () => {
    const server = limited(1, 1);
    expect((await server.handle(new Request("http://localhost/ping"))).status).toBe(200);
    expect((await server.handle(new Request("http://localhost/ping"))).status).toBe(429);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect((await server.handle(new Request("http://localhost/ping"))).status).toBe(200);

    const off = limited(1, 60, false);
    for (let i = 0; i < 5; i++) expect((await off.handle(new Request("http://localhost/ping"))).status).toBe(200);

    const preflight = limited(1);
    for (let i = 0; i < 4; i++) expect((await preflight.handle(new Request("http://localhost/ping", { method: "OPTIONS" }))).status).not.toBe(429);
  });

  test("the counter keeps clients apart and forgets old windows", () => {
    const counter = new WindowCounter();
    expect(counter.hit("a", 1000, 0).count).toBe(1);
    expect(counter.hit("a", 1000, 10).count).toBe(2);
    expect(counter.hit("b", 1000, 10).count).toBe(1);
    expect(counter.hit("a", 1000, 1500).count).toBe(1);
    counter.prune(10_000);
    expect(counter.hit("b", 1000, 10_001).count).toBe(1);
  });

  test("routes fall into the right bucket", () => {
    const bucket = (method: string, path: string) => DEFAULT_RATE_RULES.find((rule) => rule.applies(method, path))?.name;
    expect(bucket("POST", "/api/v1/auth/telegram/login")).toBe("auth");
    expect(bucket("POST", "/api/v1/admin/vehicles")).toBe("upload");
    expect(bucket("PATCH", "/api/v1/loans/LN1/documents/abc")).toBe("upload");
    expect(bucket("POST", "/api/v1/payments/payway/callback")).toBe("callback");
    expect(bucket("POST", "/api/v1/bookings")).toBe("write");
    expect(bucket("DELETE", "/api/v1/admin/banners/x")).toBe("write");
    expect(bucket("GET", "/api/v1/vehicles")).toBe("read");
    expect(bucket("GET", "/api/v1/health")).toBeUndefined();
  });

  test("the real app enforces it when enabled", async () => {
    const child = Bun.spawn(
      [
        "bun",
        "-e",
        `const { app } = await import("./src/app");
         const codes = [];
         for (let i = 0; i < 32; i++) codes.push((await app.handle(new Request("http://localhost/api/v1/auth/telegram/login", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }))).status);
         console.log("CODES " + codes.join(","));
         process.exit(0);`,
      ],
      {
        cwd: new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
        env: { PATH: process.env.PATH ?? "", NODE_ENV: "test", RATE_LIMIT_ENABLED: "true", DATABASE_URL: "pglite://memory", BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123456", TELEGRAM_BOT_TOKEN: "1:t" },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const output = await new Response(child.stdout).text();
    await child.exited;
    const codes = output.match(/CODES ([\d,]+)/)?.[1]?.split(",").map(Number) ?? [];
    expect(codes.length).toBe(32);
    expect(codes.slice(0, 30).every((code) => code !== 429)).toBe(true);
    expect(codes.slice(30)).toEqual([429, 429]);
  });
});

describe("cross-site request guard", () => {
  const post = (path: string, headers: Record<string, string>, cookie?: string) =>
    raw(path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify({}), ...(cookie ? { cookie } : {}) });

  test("a cookie-carrying write from another origin is refused, whatever the method", async () => {
    const { cookie } = await signInCustomer();
    for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
      const response = await raw("/api/v1/bookings/RG00000000", { method, headers: { origin: "https://evil.example", "content-type": "application/json" }, body: method === "DELETE" ? null : "{}", cookie });
      expect({ method, status: response.status }).toEqual({ method, status: 403 });
      if (method === "POST") expect((await json(response)).error.code).toBe("FORBIDDEN");
    }
    expect((await post("/api/v1/bookings/quote", { origin: "null" }, cookie)).status).toBe(403);
    expect((await post("/api/v1/bookings/quote", { origin: "not a url" }, cookie)).status).toBe(403);
  });

  test("the frontend origin, or a referer from it, is accepted", async () => {
    const { cookie } = await signInCustomer();
    expect((await post("/api/v1/bookings/quote", { origin: ORIGIN }, cookie)).status).not.toBe(403);
    expect((await post("/api/v1/bookings/quote", { referer: `${ORIGIN}/bikes/x` }, cookie)).status).not.toBe(403);
    expect((await post("/api/v1/bookings/quote", { referer: "https://evil.example/page" }, cookie)).status).toBe(403);
  });

  test("a cookie with no origin or referer at all is refused", async () => {
    const { cookie } = await signInCustomer();
    expect((await post("/api/v1/bookings/quote", {}, cookie)).status).toBe(403);
  });

  test("requests without a cookie are not affected, nor are safe methods, nor the PayWay callback", async () => {
    expect((await post("/api/v1/bookings/quote", { origin: "https://evil.example" })).status).not.toBe(403);
    const { cookie } = await signInCustomer();
    expect((await raw("/api/v1/vehicles", { headers: { origin: "https://evil.example" }, cookie })).status).toBe(200);
    expect((await raw("/api/v1/me", { headers: { origin: "https://evil.example" }, cookie })).status).toBe(200);
    expect((await post("/api/v1/payments/payway/callback", { origin: "https://evil.example" }, "x=1")).status).not.toBe(403);
  });
});

describe("request size limits", () => {
  const sized = (path: string, length: string, extra: Record<string, string> = {}, cookie?: string) =>
    raw(path, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json", "content-length": length, ...extra }, body: "{}", ...(cookie ? { cookie } : {}) });

  test("ordinary endpoints refuse bodies over the JSON limit before reading them", async () => {
    const { cookie } = await signInCustomer();
    const big = await sized("/api/v1/bookings/quote", String(300 * 1024), {}, cookie);
    expect(big.status).toBe(413);
    expect((await json(big)).error.code).toBe("REQUEST_TOO_LARGE");
    expect((await sized("/api/v1/bookings/quote", "not-a-number", {}, cookie)).status).toBe(413);
    expect((await sized("/api/v1/auth/telegram/login", String(10 * 1024 * 1024))).status).toBe(413);
    expect((await sized("/api/v1/bookings/quote", String(200 * 1024), {}, cookie)).status).not.toBe(413);
  });

  test("a body with no declared length is refused on ordinary endpoints", async () => {
    const { cookie } = await signInCustomer();
    const response = await raw("/api/v1/bookings/quote", { method: "POST", headers: { origin: ORIGIN, "transfer-encoding": "chunked", "content-type": "application/json" }, body: "{}", cookie });
    expect(response.status).toBe(413);
  });

  test("upload endpoints have their own larger limits and need a session before the body is read", async () => {
    const admin = await signInAdmin();
    expect((await sized("/api/v1/admin/banners", String(7 * 1024 * 1024), {}, admin.cookie)).status).toBe(413);
    expect((await sized("/api/v1/admin/banners", String(5 * 1024 * 1024), {}, admin.cookie)).status).not.toBe(413);
    expect((await sized("/api/v1/admin/vehicles", String(56 * 1024 * 1024), {}, admin.cookie)).status).toBe(413);
    expect((await sized("/api/v1/admin/vehicles", String(40 * 1024 * 1024), {}, admin.cookie)).status).not.toBe(413);
    expect((await sized("/api/v1/loans/LN1/documents", String(7 * 1024 * 1024), {}, admin.cookie)).status).toBe(413);

    const anonymous = await sized("/api/v1/admin/vehicles", String(40 * 1024 * 1024));
    expect(anonymous.status).toBe(401);
    expect((await sized("/api/v1/loans/LN1/documents", "100")).status).toBe(401);
  });
});

describe("Telegram sign-in replay", () => {
  test("a signed payload works once; replaying it is refused with no session", async () => {
    const payload = telegramPayload({ id: 990001 });
    const first = await postJson("/api/v1/auth/telegram/login", payload);
    expect(first.status).toBe(200);
    const replay = await postJson("/api/v1/auth/telegram/login", payload);
    expect(replay.status).toBe(401);
    expect(replay.headers.getSetCookie().length).toBe(0);
    const fresh = await postJson("/api/v1/auth/telegram/login", telegramPayload({ id: 990001 }));
    expect(fresh.status).toBe(200);
  });
});

describe("staff action log", () => {
  const entries = async (cookie: string, query = "") => (await json(await request(`/api/v1/admin/audit-log?${query}`, { cookie }))).data as { action: string; resourceType: string; resourceId: string | null; details: Record<string, unknown> | null; actor: { id: string } | null; ip: string | null }[];

  test("only super admins can read it", async () => {
    const customer = await signInCustomer();
    const admin = await signInAdmin("admin");
    const boss = await signInAdmin("super_admin");
    expect((await request("/api/v1/admin/audit-log")).status).toBe(401);
    expect((await request("/api/v1/admin/audit-log", { cookie: customer.cookie })).status).toBe(403);
    expect((await request("/api/v1/admin/audit-log", { cookie: admin.cookie })).status).toBe(403);
    expect((await request("/api/v1/admin/audit-log", { cookie: boss.cookie })).status).toBe(200);
  });

  test("admin changes are recorded with who, what and which fields, not the values", async () => {
    const admin = await signInAdmin("admin");
    const boss = await signInAdmin("super_admin");

    const banner = (await json(await request("/api/v1/admin/banners", { method: "POST", body: formOf({ title: "Secret promo title", placement: "home_hero", image: asFile(png(), "a.png") }), cookie: admin.cookie }))).data;
    await patchJson(`/api/v1/admin/banners/${banner.id}`, { subtitle: "Private text", displayOrder: 4 }, { cookie: admin.cookie });
    await request(`/api/v1/admin/banners/${banner.id}`, { method: "DELETE", cookie: admin.cookie });

    const mine = await entries(boss.cookie, `actorId=${admin.userId}&resourceType=banner&pageSize=100`);
    const actions = mine.filter((e) => e.resourceId === banner.id).map((e) => e.action).sort();
    expect(actions).toEqual(["banner.create", "banner.delete", "banner.update"]);
    const update = mine.find((e) => e.action === "banner.update")!;
    expect(update.details).toEqual({ fields: expect.arrayContaining(["subtitle", "displayOrder"]) });
    expect(update.actor?.id).toBe(admin.userId);
    expect(JSON.stringify(mine)).not.toContain("Private text");
    expect(JSON.stringify(mine)).not.toContain("Secret promo title");
    expect(update.ip).toBeTruthy();
  });

  test("vehicle, location, booking and loan actions are recorded too, and failed actions are not", async () => {
    const admin = await signInAdmin("admin");
    const boss = await signInAdmin("super_admin");
    const location = (await json(await request("/api/v1/locations"))).data[0] as { id: string };

    const vehicle = (
      await json(
        await request("/api/v1/admin/vehicles", {
          method: "POST",
          body: formOf({ slug: `audit-${Math.random().toString(36).slice(2, 8)}`, vehicleType: "scooter", name: "Audit Bike", brand: "Honda", model: "X", category: "city", dailyRentalPriceMinor: 1000, securityDepositMinor: 5000, currency: "USD", registrationNumber: `AUD-${Math.random().toString(36).slice(2, 7)}`, locationId: location.id, images: [asFile(png(), "a.png")] }),
          cookie: admin.cookie,
        }),
      )
    ).data;
    await patchJson(`/api/v1/admin/vehicles/${vehicle.id}`, { dailyRentalPriceMinor: 1500 }, { cookie: admin.cookie });
    await patchJson(`/api/v1/admin/locations/${location.id}`, { name: "Renamed hub" }, { cookie: admin.cookie });
    const before = (await entries(boss.cookie, "pageSize=100")).length;
    await patchJson(`/api/v1/admin/vehicles/${crypto.randomUUID()}`, { name: "Nope" }, { cookie: admin.cookie });
    expect((await entries(boss.cookie, "pageSize=100")).length).toBe(before);

    const vehicleEntries = await entries(boss.cookie, `resourceType=vehicle&resourceId=${vehicle.id}`);
    expect(vehicleEntries.map((e) => e.action).sort()).toEqual(["vehicle.create", "vehicle.update"]);
    expect(vehicleEntries.find((e) => e.action === "vehicle.create")!.details).toEqual({ imageCount: 1 });
    expect((await entries(boss.cookie, "action=location.")).some((e) => e.resourceId === location.id)).toBe(true);
    expect((await entries(boss.cookie, "action=vehicle.")).every((e) => e.action.startsWith("vehicle."))).toBe(true);
    expect((await entries(boss.cookie, "action=vehicle.update")).every((e) => e.action === "vehicle.update")).toBe(true);
  });

  test("the log supports pagination and date filters, newest first", async () => {
    const boss = await signInAdmin("super_admin");
    for (let i = 0; i < 3; i++) await patchJson(`/api/v1/admin/locations/${((await json(await request("/api/v1/locations"))).data[0] as { id: string }).id}`, { name: `Hub ${i}` }, { cookie: boss.cookie });
    const page = await json(await request("/api/v1/admin/audit-log?pageSize=2&page=1", { cookie: boss.cookie }));
    expect(page.data).toHaveLength(2);
    expect(page.meta).toMatchObject({ page: 1, pageSize: 2 });
    expect(page.meta.total).toBeGreaterThanOrEqual(3);
    const times = page.data.map((e: { createdAt: string }) => e.createdAt);
    expect(times[0]! >= times[1]!).toBe(true);
    const future = encodeURIComponent(new Date(Date.now() + 3_600_000).toISOString());
    expect((await json(await request(`/api/v1/admin/audit-log?from=${future}`, { cookie: boss.cookie }))).data).toEqual([]);
    expect((await request("/api/v1/admin/audit-log?actorId=nope", { cookie: boss.cookie })).status).toBe(422);
  });

  test("a failure to write the log never fails the admin action", async () => {
    const admin = await signInAdmin("admin");
    const original = db.insert.bind(db);
    const quiet = spyOn(console, "error").mockImplementation(() => undefined);
    const spy = spyOn(db, "insert").mockImplementation(((table: unknown) => {
      if (table === auditLog) throw new Error("log table is down");
      return original(table as never);
    }) as never);
    try {
      const response = await request("/api/v1/admin/banners", { method: "POST", body: formOf({ title: "Still created", placement: "home_hero", image: asFile(png(), "a.png") }), cookie: admin.cookie });
      expect(response.status).toBe(200);
    } finally {
      spy.mockRestore();
      quiet.mockRestore();
    }
  });
});
