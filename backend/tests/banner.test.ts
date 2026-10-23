import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { banners } from "../src/libs/db/schema";
import { storage } from "../src/providers/storage";
import { fakeS3 } from "./helpers/fake-s3";
import { json } from "./helpers/http";
import { patchJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { asFile, EXE, formOf, jpeg, png, storedBytes, storedKeys, TEXT, webp } from "./helpers/files";

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

const publicList = async (query = "") => (await json(await request(`/api/v1/banners${query}`))).data as { id: string; title: string; placement: string; displayOrder: number; imageUrl: string }[];
const titles = (list: { title: string }[]) => list.map((b) => b.title);

type Fields = Record<string, string | number | File | undefined>;
const fieldsOf = (overrides: Fields = {}): Fields => ({ title: "Summer rides", placement: "home_hero", image: asFile(png(), "summer.png"), ...overrides });
const create = (cookie: string, overrides: Fields = {}) => request("/api/v1/admin/banners", { method: "POST", body: formOf(fieldsOf(overrides)), cookie });
const update = (cookie: string, id: string, values: Fields) => request(`/api/v1/admin/banners/${id}`, { method: "PATCH", body: formOf(values), cookie });
const imageOf = (path: string, init: { cookie?: string } = {}) => request(new URL(path).pathname, init);

beforeEach(async () => {
  await db.delete(banners);
  for (const key of storedKeys("banners/")) fakeS3().objects.delete(key);
});

describe("public banners", () => {
  test("an active banner is returned, with the fields apps need and an image address", async () => {
    const row = await insert({ title: "Welcome", subtitle: "Ride", ctaLabel: "Browse", ctaUrl: "/bikes" });
    const response = await request("/api/v1/banners");
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ id: row.id, title: "Welcome", subtitle: "Ride", ctaLabel: "Browse", ctaUrl: "/bikes", placement: "home_hero", displayOrder: 0 });
    expect(new URL(body.data[0].imageUrl).pathname).toBe(`/api/v1/banners/${row.id}/image`);
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
    const calls: [string, string, FormData | undefined][] = [
      ["GET", "/api/v1/admin/banners", undefined],
      ["GET", `/api/v1/admin/banners/${row.id}`, undefined],
      ["GET", `/api/v1/admin/banners/${row.id}/image`, undefined],
      ["POST", "/api/v1/admin/banners", formOf(fieldsOf())],
      ["PATCH", `/api/v1/admin/banners/${row.id}`, formOf({ title: "x" })],
      ["DELETE", `/api/v1/admin/banners/${row.id}`, undefined],
    ];
    const before = storedKeys("banners/").length;
    for (const [method, path, body] of calls) {
      const init = { method, ...(body ? { body } : {}) };
      expect({ method, path, status: (await request(path, init)).status }).toEqual({ method, path, status: 401 });
      expect({ method, path, status: (await request(path, { ...init, cookie })).status }).toEqual({ method, path, status: 403 });
    }
    expect(await publicList()).toHaveLength(1);
    expect(storedKeys("banners/").length).toBe(before);
  });
});

describe("admin banner CRUD with the image in the same request", () => {
  test("create, read, update (with and without a new image) and delete", async () => {
    const { cookie } = await signInAdmin();
    const first = png();
    const created = await create(cookie, { subtitle: "Sun", ctaLabel: "Book", ctaUrl: "https://example.com/book", displayOrder: 3, image: asFile(first, "summer.png") });
    expect(created.status).toBe(200);
    const banner = (await json(created)).data;
    expect(banner).toMatchObject({ title: "Summer rides", placement: "home_hero", status: "active", effectiveStatus: "active", displayOrder: 3 });
    const [row] = await db.select().from(banners).where(eq(banners.id, banner.id));
    expect(row!.imageStorageKey).toStartWith(`banners/${banner.id}/`);
    expect(row!.imageContentType).toBe("image/png");
    expect(storedBytes(row!.imageStorageKey)).toEqual(first);

    const read = await request(`/api/v1/admin/banners/${banner.id}`, { cookie });
    expect((await json(read)).data.id).toBe(banner.id);

    const patched = await patchJson(`/api/v1/admin/banners/${banner.id}`, { title: "Winter rides", status: "inactive", subtitle: null }, { cookie });
    expect(patched.status).toBe(200);
    expect((await json(patched)).data).toMatchObject({ title: "Winter rides", status: "inactive", effectiveStatus: "inactive", subtitle: null });
    expect(await publicList()).toEqual([]);
    expect(storedBytes(row!.imageStorageKey)).toEqual(first);

    const second = webp();
    const replaced = await update(cookie, banner.id, { status: "active", image: asFile(second, "winter.webp") });
    expect(replaced.status).toBe(200);
    const [after] = await db.select().from(banners).where(eq(banners.id, banner.id));
    expect(after!.imageStorageKey).not.toBe(row!.imageStorageKey);
    expect(after!.imageContentType).toBe("image/webp");
    expect(storedBytes(after!.imageStorageKey)).toEqual(second);
    expect(storedBytes(row!.imageStorageKey)).toBeUndefined();

    const removed = await request(`/api/v1/admin/banners/${banner.id}`, { cookie, method: "DELETE" });
    expect(removed.status).toBe(200);
    expect((await json(removed)).data.id).toBe(banner.id);
    expect(storedBytes(after!.imageStorageKey)).toBeUndefined();
    expect((await request(`/api/v1/admin/banners/${banner.id}`, { cookie })).status).toBe(404);
    expect((await request(`/api/v1/admin/banners/${banner.id}`, { cookie, method: "DELETE" })).status).toBe(404);
  });

  test("fields can be cleared by sending them empty", async () => {
    const { cookie } = await signInAdmin();
    const banner = (await json(await create(cookie, { subtitle: "Sun", ctaLabel: "Book", ctaUrl: "/bikes", startAt: at(HOUR), endAt: at(2 * HOUR) }))).data;
    const cleared = (await json(await update(cookie, banner.id, { subtitle: "", ctaLabel: "", ctaUrl: "", startAt: "", endAt: "" }))).data;
    expect(cleared).toMatchObject({ subtitle: null, ctaLabel: null, ctaUrl: null, startAt: null, endAt: null });
  });

  test("the image is served publicly only while the banner is showing, and always to staff", async () => {
    const { cookie } = await signInAdmin();
    const bytes = jpeg();
    const live = (await json(await create(cookie, { image: asFile(bytes, "live.jpg") }))).data;
    const hidden = (await json(await create(cookie, { title: "Hidden", status: "inactive", image: asFile(jpeg(), "hidden.jpg") }))).data;

    const publicBanner = (await publicList())[0]!;
    const response = await imageOf(publicBanner.imageUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);

    expect((await request(`/api/v1/banners/${hidden.id}/image`)).status).toBe(404);
    expect((await request(`/api/v1/admin/banners/${hidden.id}/image`)).status).toBe(401);
    const staff = await request(`/api/v1/admin/banners/${hidden.id}/image`, { cookie });
    expect(staff.status).toBe(200);
    expect(staff.headers.get("cache-control")).toBe("private, no-store");
    expect(new URL(live.imageUrl).pathname).toBe(`/api/v1/admin/banners/${live.id}/image`);
  });

  test("no response carries a storage key", async () => {
    const { cookie } = await signInAdmin();
    const banner = (await json(await create(cookie))).data;
    const keys = storedKeys(`banners/${banner.id}/`);
    expect(keys).toHaveLength(1);
    const texts = [
      JSON.stringify(banner),
      await (await request(`/api/v1/admin/banners/${banner.id}`, { cookie })).text(),
      await (await request("/api/v1/admin/banners", { cookie })).text(),
      await (await request("/api/v1/banners")).text(),
    ];
    for (const text of texts) {
      expect(text).not.toContain(keys[0]!);
      expect(text).not.toContain("storageKey");
      expect(text).not.toContain("storage_key");
    }
  });

  test("the admin view includes the effective status", async () => {
    const { cookie } = await signInAdmin();
    await insert({ title: "Over", status: "active", startAt: new Date(Date.now() - 2 * HOUR), endAt: new Date(Date.now() - HOUR) });
    const list = (await json(await request("/api/v1/admin/banners", { cookie }))).data;
    expect(list[0]).toMatchObject({ status: "active", effectiveStatus: "expired" });
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

describe("banner image validation", () => {
  test("an image is required to create a banner", async () => {
    const { cookie } = await signInAdmin();
    const response = await request("/api/v1/admin/banners", { method: "POST", body: formOf({ title: "No image", placement: "home_hero" }), cookie });
    expect(response.status).toBe(422);
    expect((await json(response)).error.code).toBe("VALIDATION_ERROR");
  });

  test("only real JPEG, PNG and WebP content is accepted, whatever the name or declared type says", async () => {
    const { cookie } = await signInAdmin();
    const before = storedKeys("banners/").length;
    for (const [name, bytes, type] of [
      ["fake.png", EXE, "image/png"],
      ["notes.png", TEXT, "image/png"],
      ["doc.pdf", PDF_BYTES, "application/pdf"],
      ["icon.gif", Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0, 0, 0, 0x3b]), "image/gif"],
    ] as const) {
      const response = await create(cookie, { image: asFile(bytes as Uint8Array, name, type) });
      expect({ name, status: response.status, code: (await json(response)).error.code }).toEqual({ name, status: 422, code: "FILE_TYPE_INVALID" });
    }
    const real = await create(cookie, { image: asFile(png(), "disguised.txt", "text/plain") });
    expect(real.status).toBe(200);
    expect(storedKeys("banners/").length).toBe(before + 1);
  });

  test("an empty or oversized image is refused", async () => {
    const { cookie } = await signInAdmin();
    expect((await create(cookie, { image: asFile(new Uint8Array(0), "empty.png", "image/png") })).status).toBe(422);
    const big = await create(cookie, { image: asFile(new Uint8Array(5 * 1024 * 1024 + 1).fill(7), "big.png", "image/png") });
    expect(big.status).toBe(413);
    expect((await json(big)).error.code).toBe("FILE_TOO_LARGE");
    expect(storedKeys("banners/")).toHaveLength(0);
  });

  test("a bad replacement leaves the banner and its image untouched", async () => {
    const { cookie } = await signInAdmin();
    const banner = (await json(await create(cookie))).data;
    const [row] = await db.select().from(banners).where(eq(banners.id, banner.id));
    const bad = await update(cookie, banner.id, { title: "Changed", image: asFile(EXE, "x.png", "image/png") });
    expect(bad.status).toBe(422);
    const [after] = await db.select().from(banners).where(eq(banners.id, banner.id));
    expect(after!.title).toBe("Summer rides");
    expect(after!.imageStorageKey).toBe(row!.imageStorageKey);
    expect(storedBytes(row!.imageStorageKey)).toBeDefined();
  });
});

describe("failures around the upload", () => {
  test("a storage failure stores nothing and creates no banner", async () => {
    const { cookie } = await signInAdmin();
    const spy = spyOn(storage, "put").mockRejectedValue(new Error("storage is down"));
    try {
      const response = await create(cookie);
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).not.toContain("storage is down");
      expect(text).not.toContain("banners/");
    } finally {
      spy.mockRestore();
    }
    expect(await db.select().from(banners)).toHaveLength(0);
    expect(storedKeys("banners/")).toHaveLength(0);
  });

  test("a database failure after the upload removes the new file", async () => {
    const { cookie } = await signInAdmin();
    const spy = spyOn(db, "insert").mockImplementationOnce(() => {
      throw new Error("database is down");
    });
    try {
      expect((await create(cookie)).status).toBe(500);
    } finally {
      spy.mockRestore();
    }
    expect(await db.select().from(banners)).toHaveLength(0);
    expect(storedKeys("banners/")).toHaveLength(0);
  });

  test("a database failure while replacing keeps the old image and removes the new one", async () => {
    const { cookie } = await signInAdmin();
    const banner = (await json(await create(cookie))).data;
    const [row] = await db.select().from(banners).where(eq(banners.id, banner.id));
    const before = storedKeys("banners/").sort();

    const spy = spyOn(db, "update").mockImplementationOnce(() => {
      throw new Error("database is down");
    });
    try {
      expect((await update(cookie, banner.id, { image: asFile(jpeg(), "new.jpg") })).status).toBe(500);
    } finally {
      spy.mockRestore();
    }
    expect(storedKeys("banners/").sort()).toEqual(before);
    expect((await db.select().from(banners).where(eq(banners.id, banner.id)))[0]!.imageStorageKey).toBe(row!.imageStorageKey);
  });
});

describe("banner validation", () => {
  test("a title is required and must not be blank", async () => {
    const { cookie } = await signInAdmin();
    const missing = await request("/api/v1/admin/banners", { method: "POST", body: formOf({ placement: "home_hero", image: asFile(png(), "a.png") }), cookie });
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
    expect((await create(cookie, { unknownField: "x" })).status).toBe(422);
    expect((await create(cookie, { displayOrder: 4 })).status).toBe(200);
    expect(storedKeys("banners/")).toHaveLength(1);
  });

  test("a CTA URL must be an http(s) address or an in-app path", async () => {
    const { cookie } = await signInAdmin();
    for (const bad of ["javascript:alert(1)", "ftp://example.com", "example.com/page", "//evil.example.com", "https://has space.com", "data:text/html,x"]) {
      expect({ url: bad, status: (await create(cookie, { ctaUrl: bad })).status }).toEqual({ url: bad, status: 422 });
    }
    for (const good of ["https://example.com/x?y=1", "http://example.com", "/bikes", "/"]) {
      expect({ url: good, status: (await create(cookie, { ctaUrl: good })).status }).toEqual({ url: good, status: 200 });
    }
  });

  test("start and end must be real dates and the end must come after the start", async () => {
    const { cookie } = await signInAdmin();
    expect((await create(cookie, { startAt: "next week" })).status).toBe(422);
    expect((await create(cookie, { endAt: "2026-13-45T00:00:00Z" })).status).toBe(422);
    const backwards = await create(cookie, { startAt: at(2 * HOUR), endAt: at(HOUR) });
    expect(backwards.status).toBe(422);
    expect((await json(backwards)).error.details[0].path).toBe("endAt");
    const same = at(HOUR);
    expect((await create(cookie, { startAt: same, endAt: same })).status).toBe(422);
    expect((await create(cookie, { startAt: at(HOUR), endAt: at(2 * HOUR) })).status).toBe(200);
    expect((await create(cookie, { startAt: at(HOUR) })).status).toBe(200);
    expect((await create(cookie, { endAt: at(HOUR) })).status).toBe(200);
  });

  test("an update is checked against the dates already stored", async () => {
    const { cookie } = await signInAdmin();
    const banner = (await json(await create(cookie, { startAt: at(HOUR), endAt: at(3 * HOUR) }))).data;
    expect((await update(cookie, banner.id, { endAt: at(0) })).status).toBe(422);
    expect((await update(cookie, banner.id, { startAt: at(4 * HOUR) })).status).toBe(422);
    expect((await update(cookie, banner.id, { startAt: "" })).status).toBe(200);
    expect((await update(cookie, banner.id, { endAt: "" })).status).toBe(200);
  });

  test("an unknown banner id is a 404 and a malformed id is a 422", async () => {
    const { cookie } = await signInAdmin();
    expect((await request(`/api/v1/admin/banners/${crypto.randomUUID()}`, { cookie })).status).toBe(404);
    expect((await update(cookie, crypto.randomUUID(), { title: "x" })).status).toBe(404);
    expect((await request("/api/v1/admin/banners/not-a-uuid", { cookie })).status).toBe(422);
  });

  test("the database rejects a backwards window even if the API were bypassed", async () => {
    await expect(insert({ startAt: new Date(Date.now() + HOUR), endAt: new Date(Date.now() - HOUR) })).rejects.toThrow();
  });
});

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
