import { beforeEach, describe, expect, test } from "bun:test";
import { db } from "../src/libs/db";
import { banners } from "../src/libs/db/schema";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";

const HOUR = 3_600_000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

type Seed = Partial<typeof banners.$inferInsert>;

const insert = async (seed: Seed = {}) =>
  (
    await db
      .insert(banners)
      .values({ title: "Banner", imageStorageKey: `banners/${crypto.randomUUID()}.jpg`, placement: "home_hero", ...seed })
      .returning()
  )[0]!;

const publicList = async (query = "") => (await json(await request(`/api/v1/banners${query}`))).data as { id: string; title: string; placement: string; displayOrder: number }[];
const titles = (list: { title: string }[]) => list.map((b) => b.title);

const payload = (overrides: Record<string, unknown> = {}) => ({ title: "Summer rides", imageStorageKey: "banners/summer.jpg", placement: "home_hero", ...overrides });
const create = (cookie: string, overrides: Record<string, unknown> = {}) => postJson("/api/v1/admin/banners", payload(overrides), { cookie });

beforeEach(async () => {
  await db.delete(banners);
});

describe("public banners", () => {
  test("an active banner is returned, with the fields apps need", async () => {
    await insert({ title: "Welcome", subtitle: "Ride", imageUrl: "https://cdn.example.com/a.jpg", ctaLabel: "Browse", ctaUrl: "/bikes" });
    const response = await request("/api/v1/banners");
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ title: "Welcome", subtitle: "Ride", imageUrl: "https://cdn.example.com/a.jpg", ctaLabel: "Browse", ctaUrl: "/bikes", placement: "home_hero", displayOrder: 0 });
  });

  test("inactive banners are hidden, even inside their date window", async () => {
    await insert({ title: "Off", status: "inactive", startAt: new Date(Date.now() - HOUR), endAt: new Date(Date.now() + HOUR) });
    await insert({ title: "On" });
    expect(titles(await publicList())).toEqual(["On"]);
  });

  test("a scheduled banner stays hidden until its start, then appears", async () => {
    await insert({ title: "Soon", status: "scheduled", startAt: new Date(Date.now() + HOUR) });
    await insert({ title: "Started", status: "scheduled", startAt: new Date(Date.now() - HOUR) });
    expect(titles(await publicList())).toEqual(["Started"]);
  });

  test("a banner past its end is hidden even if its stored status is still active", async () => {
    await insert({ title: "Over", status: "active", startAt: new Date(Date.now() - 2 * HOUR), endAt: new Date(Date.now() - HOUR) });
    await insert({ title: "Marked expired", status: "expired" });
    await insert({ title: "Running", status: "active", startAt: new Date(Date.now() - HOUR), endAt: new Date(Date.now() + HOUR) });
    expect(titles(await publicList())).toEqual(["Running"]);
  });

  test("a future start hides an active banner too: dates are respected, not only the stored status", async () => {
    await insert({ title: "Early", status: "active", startAt: new Date(Date.now() + HOUR) });
    expect(await publicList()).toEqual([]);
  });

  test("the placement filter only returns that placement", async () => {
    await insert({ title: "Hero", placement: "home_hero" });
    await insert({ title: "Promo", placement: "home_promo" });
    await insert({ title: "Vehicles", placement: "vehicles" });
    await insert({ title: "Loan", placement: "expat_loan" });
    expect(titles(await publicList("?placement=vehicles"))).toEqual(["Vehicles"]);
    expect(titles(await publicList("?placement=expat_loan"))).toEqual(["Loan"]);
    expect(await publicList()).toHaveLength(4);
    expect((await request("/api/v1/banners?placement=sidebar")).status).toBe(422);
  });

  test("banners are ordered by display order, then by when they were created", async () => {
    await insert({ title: "C", displayOrder: 2 });
    await insert({ title: "A", displayOrder: 0 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await insert({ title: "B1", displayOrder: 1 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await insert({ title: "B2", displayOrder: 1 });
    expect(titles(await publicList())).toEqual(["A", "B1", "B2", "C"]);
  });

  test("the internal storage key never appears in a public response", async () => {
    await insert({ title: "Secret", imageStorageKey: "banners/internal-key-12345.jpg" });
    const text = await (await request("/api/v1/banners")).text();
    expect(text).not.toContain("internal-key-12345");
    expect(text.toLowerCase()).not.toContain("storagekey");
    expect(text).not.toContain("image_storage_key");
  });
});

describe("admin banner access", () => {
  test("anonymous callers get 401 and customers get 403 on every banner route", async () => {
    const { cookie } = await signInCustomer();
    const row = await insert();
    const calls: [string, string, unknown?][] = [
      ["GET", "/api/v1/admin/banners"],
      ["GET", `/api/v1/admin/banners/${row.id}`],
      ["POST", "/api/v1/admin/banners", payload()],
      ["PATCH", `/api/v1/admin/banners/${row.id}`, { title: "x" }],
      ["DELETE", `/api/v1/admin/banners/${row.id}`],
    ];
    for (const [method, path, body] of calls) {
      const init = { method, ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } } : {}) };
      expect({ method, path, status: (await request(path, init)).status }).toEqual({ method, path, status: 401 });
      expect({ method, path, status: (await request(path, { ...init, cookie })).status }).toEqual({ method, path, status: 403 });
    }
    expect(await publicList()).toHaveLength(1);
  });
});

describe("admin banner CRUD", () => {
  test("create, read, update and delete", async () => {
    const { cookie } = await signInAdmin();
    const created = await create(cookie, { subtitle: "Sun", ctaLabel: "Book", ctaUrl: "https://example.com/book", displayOrder: 3, imageUrl: "https://cdn.example.com/s.jpg" });
    expect(created.status).toBe(200);
    const banner = (await json(created)).data;
    expect(banner).toMatchObject({ title: "Summer rides", imageStorageKey: "banners/summer.jpg", placement: "home_hero", status: "active", effectiveStatus: "active", displayOrder: 3 });

    const read = await request(`/api/v1/admin/banners/${banner.id}`, { cookie });
    expect((await json(read)).data.id).toBe(banner.id);

    const patched = await patchJson(`/api/v1/admin/banners/${banner.id}`, { title: "Winter rides", status: "inactive", subtitle: null }, { cookie });
    expect(patched.status).toBe(200);
    expect((await json(patched)).data).toMatchObject({ title: "Winter rides", status: "inactive", effectiveStatus: "inactive", subtitle: null, imageStorageKey: "banners/summer.jpg" });
    expect(await publicList()).toEqual([]);

    const removed = await request(`/api/v1/admin/banners/${banner.id}`, { cookie, method: "DELETE" });
    expect(removed.status).toBe(200);
    expect((await json(removed)).data.id).toBe(banner.id);
    expect((await request(`/api/v1/admin/banners/${banner.id}`, { cookie })).status).toBe(404);
    expect((await request(`/api/v1/admin/banners/${banner.id}`, { cookie, method: "DELETE" })).status).toBe(404);
  });

  test("the admin view includes the storage key and the effective status", async () => {
    const { cookie } = await signInAdmin();
    await insert({ title: "Over", status: "active", startAt: new Date(Date.now() - 2 * HOUR), endAt: new Date(Date.now() - HOUR) });
    const list = (await json(await request("/api/v1/admin/banners", { cookie }))).data;
    expect(list[0]).toMatchObject({ status: "active", effectiveStatus: "expired" });
    expect(list[0].imageStorageKey).toStartWith("banners/");
  });

  test("the list supports pagination, filters, search and sorting", async () => {
    const { cookie } = await signInAdmin();
    await insert({ title: "Alpha sale", placement: "home_hero", displayOrder: 2 });
    await insert({ title: "Beta sale", placement: "home_promo", displayOrder: 1, subtitle: "weekend offer" });
    await insert({ title: "Gamma", placement: "home_promo", displayOrder: 0, status: "inactive" });
    await insert({ title: "Delta", placement: "vehicles", status: "scheduled", startAt: new Date(Date.now() + HOUR) });
    await insert({ title: "Epsilon", placement: "vehicles", status: "active", endAt: new Date(Date.now() - HOUR) });

    const get = async (query: string) => json(await request(`/api/v1/admin/banners?${query}`, { cookie }));

    const all = await get("sort=displayOrder");
    expect(all.meta).toMatchObject({ page: 1, total: 5 });
    expect(all.data.map((b: { displayOrder: number }) => b.displayOrder)).toEqual([0, 0, 0, 1, 2]);

    const page = await get("pageSize=2&page=3&sort=title");
    expect(page.meta).toMatchObject({ page: 3, pageSize: 2, total: 5, totalPages: 3 });
    expect(titles(page.data)).toEqual(["Gamma"]);

    expect(titles((await get("placement=home_promo&sort=title")).data)).toEqual(["Beta sale", "Gamma"]);
    expect(titles((await get("status=inactive")).data)).toEqual(["Gamma"]);
    expect(titles((await get("status=scheduled")).data)).toEqual(["Delta"]);
    expect(titles((await get("status=expired")).data)).toEqual(["Epsilon"]);
    expect(titles((await get("status=active&sort=title")).data)).toEqual(["Alpha sale", "Beta sale"]);
    expect(titles((await get("q=sale&sort=title")).data)).toEqual(["Alpha sale", "Beta sale"]);
    expect(titles((await get("q=weekend")).data)).toEqual(["Beta sale"]);
    expect(titles((await get("sort=newest")).data)[0]).toBe("Epsilon");
    expect(titles((await get("sort=oldest")).data)[0]).toBe("Alpha sale");
    expect((await request("/api/v1/admin/banners?status=bogus", { cookie })).status).toBe(422);
  });
});

describe("banner validation", () => {
  test("a title is required and must not be blank", async () => {
    const { cookie } = await signInAdmin();
    const missing = await postJson("/api/v1/admin/banners", { imageStorageKey: "banners/a.jpg", placement: "home_hero" }, { cookie });
    expect(missing.status).toBe(422);
    expect((await json(missing)).error.code).toBe("VALIDATION_ERROR");
    expect((await create(cookie, { title: "   " })).status).toBe(422);
    expect((await create(cookie, { title: "" })).status).toBe(422);
  });

  test("placement, status and display order are validated", async () => {
    const { cookie } = await signInAdmin();
    expect((await create(cookie, { placement: "footer" })).status).toBe(422);
    expect((await create(cookie, { status: "draft" })).status).toBe(422);
    expect((await create(cookie, { displayOrder: 1.5 })).status).toBe(422);
    expect((await create(cookie, { displayOrder: -1 })).status).toBe(422);
    expect((await create(cookie, { displayOrder: "first" })).status).toBe(422);
    expect((await create(cookie, { unknownField: true })).status).toBe(422);
  });

  test("a CTA URL must be an http(s) address or an in-app path", async () => {
    const { cookie } = await signInAdmin();
    for (const bad of ["javascript:alert(1)", "ftp://example.com", "example.com/page", "//evil.example.com", "https://has space.com", "data:text/html,x"]) {
      expect({ url: bad, status: (await create(cookie, { ctaUrl: bad })).status }).toEqual({ url: bad, status: 422 });
    }
    for (const good of ["https://example.com/x?y=1", "http://example.com", "/bikes", "/"]) {
      expect({ url: good, status: (await create(cookie, { ctaUrl: good })).status }).toEqual({ url: good, status: 200 });
    }
    expect((await create(cookie, { imageUrl: "javascript:alert(1)" })).status).toBe(422);
  });

  test("start and end must be real dates and the end must come after the start", async () => {
    const { cookie } = await signInAdmin();
    expect((await create(cookie, { startAt: "next week" })).status).toBe(422);
    expect((await create(cookie, { endAt: "2026-13-45T00:00:00Z" })).status).toBe(422);
    const backwards = await create(cookie, { startAt: at(2 * HOUR), endAt: at(HOUR) });
    expect(backwards.status).toBe(422);
    expect((await json(backwards)).error.details[0].path).toBe("endAt");
    expect((await create(cookie, { startAt: at(HOUR), endAt: at(HOUR) })).status).toBe(422);
    expect((await create(cookie, { startAt: at(HOUR), endAt: at(2 * HOUR) })).status).toBe(200);
    expect((await create(cookie, { startAt: at(HOUR) })).status).toBe(200);
    expect((await create(cookie, { endAt: at(HOUR) })).status).toBe(200);
  });

  test("an update is checked against the dates already stored", async () => {
    const { cookie } = await signInAdmin();
    const banner = (await json(await create(cookie, { startAt: at(HOUR), endAt: at(3 * HOUR) }))).data;
    expect((await patchJson(`/api/v1/admin/banners/${banner.id}`, { endAt: at(0) }, { cookie })).status).toBe(422);
    expect((await patchJson(`/api/v1/admin/banners/${banner.id}`, { startAt: at(4 * HOUR) }, { cookie })).status).toBe(422);
    expect((await patchJson(`/api/v1/admin/banners/${banner.id}`, { startAt: null }, { cookie })).status).toBe(200);
    expect((await patchJson(`/api/v1/admin/banners/${banner.id}`, { endAt: null }, { cookie })).status).toBe(200);
  });

  test("the image key must be a safe storage key", async () => {
    const { cookie } = await signInAdmin();
    for (const bad of ["../escape.jpg", "a/../b.jpg", "/absolute.jpg", "has space.jpg", "a//b.jpg", "", "-leading.jpg"]) {
      expect({ key: bad, status: (await create(cookie, { imageStorageKey: bad })).status }).toEqual({ key: bad, status: 422 });
    }
    expect((await create(cookie, { imageStorageKey: "banners/2026/home-hero_1.webp" })).status).toBe(200);
    const banner = (await json(await create(cookie))).data;
    expect((await patchJson(`/api/v1/admin/banners/${banner.id}`, { imageStorageKey: "../x.jpg" }, { cookie })).status).toBe(422);
  });

  test("an unknown banner id is a 404 and a malformed id is a 422", async () => {
    const { cookie } = await signInAdmin();
    expect((await request(`/api/v1/admin/banners/${crypto.randomUUID()}`, { cookie })).status).toBe(404);
    expect((await patchJson(`/api/v1/admin/banners/${crypto.randomUUID()}`, { title: "x" }, { cookie })).status).toBe(404);
    expect((await request("/api/v1/admin/banners/not-a-uuid", { cookie })).status).toBe(422);
  });

  test("the database rejects a backwards window even if the API were bypassed", async () => {
    await expect(insert({ startAt: new Date(Date.now() + HOUR), endAt: new Date(Date.now() - HOUR) })).rejects.toThrow();
  });
});
