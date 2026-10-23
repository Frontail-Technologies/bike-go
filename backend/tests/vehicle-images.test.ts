import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { vehicleImages, vehicles } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { storage } from "../src/providers/storage";
import { json } from "./helpers/http";
import { request, signInAdmin, signInCustomer } from "./helpers/auth";
import { cleanupExtraVehicles } from "./helpers/db";
import { asFile, EXE, formOf, jpeg, png, storedBytes, storedKeys, webp } from "./helpers/files";

beforeAll(async () => {
  await seedCatalog();
});
afterAll(cleanupExtraVehicles);

type Image = { id: string; url: string | null; sortOrder: number; isPrimary: boolean };

const locationId = async () => ((await json(await request("/api/v1/locations"))).data[0] as { id: string }).id;

const fields = async (overrides: Record<string, string | number | File | (string | File)[] | undefined> = {}) => ({
  slug: `img-bike-${Math.random().toString(36).slice(2, 9)}`,
  vehicleType: "motorcycle",
  name: "Image Bike",
  brand: "Honda",
  model: "CB250",
  category: "commuter",
  dailyRentalPriceMinor: 1800,
  securityDepositMinor: 20000,
  currency: "USD",
  registrationNumber: `IMG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  locationId: await locationId(),
  ...overrides,
});

const post = async (cookie: string, overrides: Parameters<typeof fields>[0] = {}) => request("/api/v1/admin/vehicles", { method: "POST", body: formOf(await fields(overrides)), cookie });
const patch = (cookie: string, id: string, values: Record<string, string | number | File | (string | File)[] | undefined>) => request(`/api/v1/admin/vehicles/${id}`, { method: "PATCH", body: formOf(values), cookie });
const create = async (cookie: string, files: File[], overrides: Parameters<typeof fields>[0] = {}) => {
  const response = await post(cookie, { images: files, ...overrides });
  expect(response.status).toBe(200);
  return (await json(response)).data as { id: string; slug: string; images: Image[] };
};

const bytesAt = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());
const served = async (url: string) => new Uint8Array(await (await request(new URL(url).pathname)).arrayBuffer());
const keysOf = async (vehicleId: string) => (await db.select({ key: vehicleImages.storageKey }).from(vehicleImages).where(eq(vehicleImages.vehicleId, vehicleId))).map((r) => r.key);
void bytesAt;

describe("creating a vehicle with its images in one request", () => {
  test("several images are stored, ordered as sent, and the first is primary", async () => {
    const { cookie } = await signInAdmin();
    const [a, b, c] = [png(), jpeg(), webp()];
    const vehicle = await create(cookie, [asFile(a, "front.png"), asFile(b, "side.jpg"), asFile(c, "back.webp")]);

    expect(vehicle.images.map((i) => i.sortOrder)).toEqual([0, 1, 2]);
    expect(vehicle.images.map((i) => i.isPrimary)).toEqual([true, false, false]);
    expect(await served(vehicle.images[0]!.url!)).toEqual(a);
    expect(await served(vehicle.images[1]!.url!)).toEqual(b);
    expect(await served(vehicle.images[2]!.url!)).toEqual(c);
    const keys = await keysOf(vehicle.id);
    expect(keys).toHaveLength(3);
    expect(keys.every((key) => key.startsWith(`vehicles/${vehicle.id}/`))).toBe(true);
    expect(keys.map((key) => storedBytes(key)?.byteLength)).toEqual(expect.arrayContaining([a.byteLength, b.byteLength, c.byteLength]));
  });

  test("primaryImageIndex chooses which file becomes the primary image", async () => {
    const { cookie } = await signInAdmin();
    const [a, b, c] = [png(), jpeg(), webp()];
    const vehicle = await create(cookie, [asFile(a, "a.png"), asFile(b, "b.jpg"), asFile(c, "c.webp")], { primaryImageIndex: 2 });
    expect(vehicle.images.map((i) => i.isPrimary)).toEqual([true, false, false]);
    expect(await served(vehicle.images[0]!.url!)).toEqual(c);
    expect(await served(vehicle.images[1]!.url!)).toEqual(a);
    expect(await served(vehicle.images[2]!.url!)).toEqual(b);
  });

  test("a single image in the field works, and so does no image at all", async () => {
    const { cookie } = await signInAdmin();
    const one = await create(cookie, [asFile(png(), "only.png")]);
    expect(one.images).toHaveLength(1);
    const none = await post(cookie);
    expect(none.status).toBe(200);
    expect((await json(none)).data.images).toEqual([]);
  });

  test("bad input is refused before anything is stored", async () => {
    const { cookie } = await signInAdmin();
    const before = storedKeys("vehicles/").length;

    const exe = await post(cookie, { images: [asFile(png(), "ok.png"), asFile(EXE, "photo.png", "image/png")] });
    expect(exe.status).toBe(422);
    expect((await json(exe)).error.code).toBe("FILE_TYPE_INVALID");

    const pdf = await post(cookie, { images: [asFile(new TextEncoder().encode("%PDF-1.4\n"), "doc.pdf", "application/pdf")] });
    expect((await json(pdf)).error.code).toBe("FILE_TYPE_INVALID");

    const big = await post(cookie, { images: [asFile(new Uint8Array(5 * 1024 * 1024 + 1).fill(1), "big.png", "image/png")] });
    expect(big.status).toBe(413);
    expect((await json(big)).error.code).toBe("FILE_TOO_LARGE");

    const tooMany = await post(cookie, { images: Array.from({ length: 11 }, () => asFile(png(), "x.png")) });
    expect(tooMany.status).toBe(422);

    const badIndex = await post(cookie, { images: [asFile(png(), "x.png")], primaryImageIndex: 3 });
    expect(badIndex.status).toBe(422);

    expect(storedKeys("vehicles/").length).toBe(before);
  });

  test("customers cannot create vehicles, even with valid images", async () => {
    const { cookie } = await signInCustomer();
    expect((await post(cookie, { images: [asFile(png(), "x.png")] })).status).toBe(403);
  });
});

describe("updating a vehicle", () => {
  test("changing fields without images keeps the existing images", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg")]);
    const before = storedKeys(`vehicles/${vehicle.id}/`);

    const response = await patch(cookie, vehicle.id, { dailyRentalPriceMinor: 2500, name: "Renamed" });
    expect(response.status).toBe(200);
    const updated = (await json(response)).data;
    expect(updated).toMatchObject({ dailyRentalPriceMinor: 2500, name: "Renamed" });
    expect(updated.images.map((i: Image) => i.id)).toEqual(vehicle.images.map((i) => i.id));
    expect(storedKeys(`vehicles/${vehicle.id}/`).sort()).toEqual(before.sort());
  });

  test("new images are added after the existing ones", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png")]);
    const extra = jpeg();
    const updated = (await json(await patch(cookie, vehicle.id, { images: [asFile(extra, "b.jpg")] }))).data;
    expect(updated.images).toHaveLength(2);
    expect(updated.images[0].id).toBe(vehicle.images[0]!.id);
    expect(await served(updated.images[1].url)).toEqual(extra);
    expect(updated.images.map((i: Image) => i.sortOrder)).toEqual([0, 1]);
  });

  test("an image can be removed, and its file goes after the change is saved", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg"), asFile(webp(), "c.webp")]);
    const [keep, drop] = [vehicle.images[0]!, vehicle.images[1]!];
    const dropKey = (await db.select({ key: vehicleImages.storageKey }).from(vehicleImages).where(eq(vehicleImages.id, drop.id)))[0]!.key;
    expect(storedBytes(dropKey)).toBeDefined();

    const updated = (await json(await patch(cookie, vehicle.id, { removeImageIds: JSON.stringify([drop.id]) }))).data;
    expect(updated.images.map((i: Image) => i.id)).not.toContain(drop.id);
    expect(updated.images).toHaveLength(2);
    expect(updated.images[0].id).toBe(keep.id);
    expect(updated.images.map((i: Image) => i.sortOrder)).toEqual([0, 1]);
    expect(storedBytes(dropKey)).toBeUndefined();
    expect((await request(new URL(drop.url!).pathname)).status).toBe(404);
  });

  test("images can be reordered with a JSON list or a comma list", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg"), asFile(webp(), "c.webp")]);
    const [a, b, c] = vehicle.images.map((i) => i.id);

    const json1 = (await json(await patch(cookie, vehicle.id, { imageOrder: JSON.stringify([c, a, b]) }))).data;
    expect(json1.images.map((i: Image) => i.id)).toEqual([c, a, b]);
    expect(json1.images.map((i: Image) => i.isPrimary)).toEqual([true, false, false]);

    const comma = (await json(await patch(cookie, vehicle.id, { imageOrder: `${b},${c}` }))).data;
    expect(comma.images.map((i: Image) => i.id)).toEqual([b, c, a]);
  });

  test("the primary image can be changed to an existing image or to a new one", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg")]);
    const second = vehicle.images[1]!.id;

    const existing = (await json(await patch(cookie, vehicle.id, { primaryImageId: second }))).data;
    expect(existing.images[0].id).toBe(second);
    expect(existing.images[0].isPrimary).toBe(true);

    const fresh = webp();
    const withNew = (await json(await patch(cookie, vehicle.id, { images: [asFile(png(), "x.png"), asFile(fresh, "y.webp")], primaryImageIndex: 1 }))).data;
    expect(withNew.images).toHaveLength(4);
    expect(await served(withNew.images[0].url)).toEqual(fresh);
  });

  test("references to images of another vehicle or conflicting instructions are refused", async () => {
    const { cookie } = await signInAdmin();
    const one = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg")]);
    const other = await create(cookie, [asFile(png(), "c.png")]);
    const before = storedKeys("vehicles/").length;

    expect((await patch(cookie, one.id, { removeImageIds: other.images[0]!.id })).status).toBe(422);
    expect((await patch(cookie, one.id, { imageOrder: other.images[0]!.id })).status).toBe(422);
    expect((await patch(cookie, one.id, { primaryImageId: other.images[0]!.id })).status).toBe(422);
    expect((await patch(cookie, one.id, { removeImageIds: one.images[0]!.id, primaryImageId: one.images[0]!.id })).status).toBe(422);
    expect((await patch(cookie, one.id, { primaryImageId: one.images[0]!.id, primaryImageIndex: 0, images: [asFile(png(), "n.png")] })).status).toBe(422);
    expect((await patch(cookie, one.id, { removeImageIds: "not-an-id" })).status).toBe(422);
    expect((await patch(cookie, one.id, { primaryImageIndex: 0 })).status).toBe(422);
    expect((await patch(cookie, one.id, { images: Array.from({ length: 9 }, () => asFile(png(), "n.png")) })).status).toBe(422);
    expect((await patch(cookie, one.id, { images: [asFile(EXE, "bad.png", "image/png")] })).status).toBe(422);
    expect(storedKeys("vehicles/").length).toBe(before);
    expect((await json(await request(`/api/v1/admin/vehicles/${one.id}`, { cookie }))).data.images).toHaveLength(2);
  });
});

describe("failures never leave stray files, and never lose old ones", () => {
  test("a storage failure part-way through a create removes the files already uploaded", async () => {
    const { cookie } = await signInAdmin();
    const original = storage.put.bind(storage);
    let calls = 0;
    const spy = spyOn(storage, "put").mockImplementation(async (key, data, options) => {
      calls += 1;
      if (calls === 3) throw new Error("storage is down");
      return original(key, data, options);
    });
    const before = storedKeys("vehicles/").length;
    const slug = `failing-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const response = await post(cookie, { slug, images: [asFile(png(), "1.png"), asFile(png(), "2.png"), asFile(png(), "3.png"), asFile(png(), "4.png")] });
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).not.toContain("storage is down");
      expect(text).not.toContain("vehicles/");
    } finally {
      spy.mockRestore();
    }
    expect(calls).toBe(3);
    expect(storedKeys("vehicles/").length).toBe(before);
    expect((await db.select().from(vehicles).where(eq(vehicles.slug, slug))).length).toBe(0);
  });

  test("a database failure after uploading removes the new files (duplicate slug)", async () => {
    const { cookie } = await signInAdmin();
    const first = await create(cookie, [asFile(png(), "a.png")]);
    const before = storedKeys("vehicles/").length;
    const clash = await post(cookie, { slug: first.slug, images: [asFile(png(), "b.png"), asFile(jpeg(), "c.jpg")] });
    expect(clash.status).toBe(422);
    expect(storedKeys("vehicles/").length).toBe(before);
  });

  test("a failed update removes the new uploads and keeps the images it meant to remove", async () => {
    const { cookie } = await signInAdmin();
    const taken = await create(cookie, []);
    const vehicle = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg")]);
    const before = storedKeys("vehicles/").sort();
    const victim = vehicle.images[1]!.id;

    const response = await patch(cookie, vehicle.id, { slug: taken.slug, images: [asFile(webp(), "new.webp")], removeImageIds: victim });
    expect(response.status).toBe(422);
    expect(storedKeys("vehicles/").sort()).toEqual(before);
    const after = (await json(await request(`/api/v1/admin/vehicles/${vehicle.id}`, { cookie }))).data;
    expect(after.images.map((i: Image) => i.id)).toEqual(vehicle.images.map((i) => i.id));
    expect(await served(after.images[1].url)).toBeDefined();
  });

  test("a storage failure during an update changes nothing", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png")]);
    const before = storedKeys("vehicles/").sort();
    const spy = spyOn(storage, "put").mockRejectedValue(new Error("storage is down"));
    try {
      const response = await patch(cookie, vehicle.id, { name: "Never saved", images: [asFile(jpeg(), "b.jpg")] });
      expect(response.status).toBe(500);
    } finally {
      spy.mockRestore();
    }
    expect(storedKeys("vehicles/").sort()).toEqual(before);
    expect((await json(await request(`/api/v1/admin/vehicles/${vehicle.id}`, { cookie }))).data.name).toBe("Image Bike");
  });

  test("deleting a vehicle removes its image files", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg")]);
    expect(storedKeys(`vehicles/${vehicle.id}/`)).toHaveLength(2);
    const removed = await request(`/api/v1/admin/vehicles/${vehicle.id}`, { cookie, method: "DELETE" });
    expect((await json(removed)).data).toMatchObject({ deleted: true });
    expect(storedKeys(`vehicles/${vehicle.id}/`)).toHaveLength(0);
  });
});

describe("what the API exposes", () => {
  test("no response carries a storage key, bucket or file path", async () => {
    const { cookie } = await signInAdmin();
    const vehicle = await create(cookie, [asFile(png(), "a.png"), asFile(jpeg(), "b.jpg")]);
    const keys = storedKeys(`vehicles/${vehicle.id}/`);
    expect(keys).toHaveLength(2);

    const responses = [
      JSON.stringify(vehicle),
      await (await request(`/api/v1/admin/vehicles/${vehicle.id}`, { cookie })).text(),
      await (await request("/api/v1/admin/vehicles?pageSize=100", { cookie })).text(),
      await (await request(`/api/v1/vehicles/${vehicle.slug}`)).text(),
      await (await request("/api/v1/vehicles?pageSize=100")).text(),
    ];
    for (const text of responses) {
      for (const key of keys) expect(text).not.toContain(key);
      expect(text).not.toContain("storageKey");
      expect(text).not.toContain("storage_key");
      expect(text).not.toContain("ridego-test");
    }
  });

  test("public vehicle data shows the images with their primary flag, served from the API", async () => {
    const { cookie } = await signInAdmin();
    const bytes = png();
    const vehicle = await create(cookie, [asFile(bytes, "a.png")]);
    const publicVehicle = (await json(await request(`/api/v1/vehicles/${vehicle.slug}`))).data;
    expect(publicVehicle.images).toHaveLength(1);
    expect(publicVehicle.images[0]).toMatchObject({ isPrimary: true, sortOrder: 0 });
    const response = await request(new URL(publicVehicle.images[0].url).pathname);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect((await request(`/api/v1/vehicles/images/${crypto.randomUUID()}`)).status).toBe(404);
  });
});
