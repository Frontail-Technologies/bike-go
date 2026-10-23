import { describe, expect, spyOn, test } from "bun:test";
import { AppError } from "../src/libs/api";
import { sanitizeFilename } from "../src/libs/uploads/filenames";
import { inspectDocument, inspectImage } from "../src/libs/uploads/inspect";
import { commitOrDiscard, discardQuietly, uploadAll } from "../src/libs/uploads/storage";
import { storage } from "../src/providers/storage";
import { request } from "./helpers/auth";
import { asFile, EXE, jpeg, PDF, png, storedBytes, storedKeys, TEXT, webp } from "./helpers/files";

const failure = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    return error as AppError;
  }
  throw new Error("expected a failure");
};

describe("content inspection", () => {
  test("images are recognised by their content, not by name or declared type", async () => {
    expect(await inspectImage(asFile(png(), "a.txt", "text/plain"), "image")).toMatchObject({ contentType: "image/png", extension: "png" });
    expect(await inspectImage(asFile(jpeg(), "a.png", "image/png"), "image")).toMatchObject({ contentType: "image/jpeg", extension: "jpg" });
    expect(await inspectImage(asFile(webp(), "a.jpg", "image/jpeg"), "image")).toMatchObject({ contentType: "image/webp", extension: "webp" });
  });

  test("wrong content is refused whatever the declared type", async () => {
    for (const [bytes, name, type] of [
      [EXE, "photo.png", "image/png"],
      [TEXT, "photo.jpg", "image/jpeg"],
      [PDF, "photo.png", "image/png"],
    ] as const) {
      const error = await failure(() => inspectImage(asFile(bytes, name, type), "image"));
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: "FILE_TYPE_INVALID", httpStatus: 422 });
    }
    const document = await failure(() => inspectDocument(asFile(EXE, "scan.pdf", "application/pdf")));
    expect(document).toMatchObject({ code: "DOCUMENT_TYPE_INVALID", httpStatus: 422 });
    expect(await inspectDocument(asFile(PDF, "x.bin"))).toMatchObject({ contentType: "application/pdf" });
    expect((await failure(() => inspectDocument(asFile(webp(), "x.webp")))).code).toBe("DOCUMENT_TYPE_INVALID");
  });

  test("empty and oversized files are refused, and the limit is configurable per resource", async () => {
    expect(await failure(() => inspectImage(asFile(new Uint8Array(0), "e.png"), "image"))).toMatchObject({ code: "VALIDATION_ERROR", httpStatus: 422 });
    const big = asFile(new Uint8Array(5 * 1024 * 1024 + 1).fill(1), "big.png");
    expect(await failure(() => inspectImage(big, "image"))).toMatchObject({ code: "FILE_TOO_LARGE", httpStatus: 413 });
    expect(await failure(() => inspectDocument(big))).toMatchObject({ code: "FILE_TOO_LARGE", httpStatus: 413 });
    expect(await failure(() => inspectImage(asFile(png(), "small.png"), "image", 10))).toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  test("filenames lose paths and control characters", () => {
    expect(sanitizeFilename("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFilename("....", "image")).toBe("image");
  });
});

describe("storage compensation", () => {
  test("uploadAll removes what it already stored when a later upload fails", async () => {
    const original = storage.put.bind(storage);
    let calls = 0;
    const spy = spyOn(storage, "put").mockImplementation(async (key, data, options) => {
      calls += 1;
      if (calls === 2) throw new Error("storage is down");
      return original(key, data, options);
    });
    const prefix = `uploads-test/${crypto.randomUUID()}/`;
    const item = async (name: string) => ({ key: `${prefix}${name}.png`, upload: await inspectImage(asFile(png(), `${name}.png`), "image") });
    try {
      await expect(uploadAll([await item("a"), await item("b"), await item("c")])).rejects.toThrow("storage is down");
    } finally {
      spy.mockRestore();
    }
    expect(storedKeys(prefix)).toEqual([]);
  });

  test("commitOrDiscard keeps the files when the change succeeds and removes them when it fails", async () => {
    const prefix = `uploads-test/${crypto.randomUUID()}/`;
    const stage = async (name: string) => uploadAll([{ key: `${prefix}${name}.png`, upload: await inspectImage(asFile(png(), `${name}.png`), "image") }]);
    const kept = await stage("kept");
    expect(await commitOrDiscard(kept, async () => "saved")).toBe("saved");
    expect(storedBytes(kept[0]!)).toBeDefined();

    const lost = await stage("lost");
    await expect(commitOrDiscard(lost, () => Promise.reject(new Error("database is down")))).rejects.toThrow("database is down");
    expect(storedBytes(lost[0]!)).toBeUndefined();
  });

  test("a cleanup that cannot delete is logged without the key and never throws", async () => {
    const key = `uploads-test/${crypto.randomUUID()}/secret-name.png`;
    const logged: string[] = [];
    const log = spyOn(console, "error").mockImplementation((...args: unknown[]) => void logged.push(args.map(String).join(" ")));
    const spy = spyOn(storage, "delete").mockRejectedValue(new Error("storage is down"));
    try {
      await expect(discardQuietly([key])).resolves.toBeUndefined();
    } finally {
      spy.mockRestore();
      log.mockRestore();
    }
    expect(logged.join("\n")).toContain("1 of 1");
    expect(logged.join("\n")).not.toContain("secret-name");
  });
});

describe("OpenAPI documents the multipart contracts", () => {
  type Schema = { properties?: Record<string, { type?: string; format?: string; items?: { type?: string; format?: string } }> };
  type Spec = { paths: Record<string, Record<string, { requestBody?: { content: Record<string, { schema: Schema }> } }>> };
  const spec = async () => (await (await request("/api/v1/docs/json")).json()) as Spec;
  const form = (doc: Spec, path: string, method: string) => doc.paths[path]?.[method]?.requestBody?.content["multipart/form-data"]?.schema;

  test("banner, vehicle and loan document uploads are multipart with binary file fields", async () => {
    const doc = await spec();
    expect(form(doc, "/api/v1/admin/banners", "post")?.properties?.image).toMatchObject({ type: "string", format: "binary" });
    expect(form(doc, "/api/v1/admin/banners/{id}", "patch")?.properties?.image).toMatchObject({ type: "string", format: "binary" });
    expect(form(doc, "/api/v1/admin/vehicles", "post")?.properties?.images).toMatchObject({ type: "array", items: { type: "string", format: "binary" } });
    expect(form(doc, "/api/v1/admin/vehicles/{id}", "patch")?.properties?.images).toMatchObject({ type: "array", items: { type: "string", format: "binary" } });
    expect(form(doc, "/api/v1/loans/{reference}/documents", "post")?.properties?.file).toMatchObject({ type: "string", format: "binary" });
    expect(form(doc, "/api/v1/loans/{reference}/documents/{documentId}", "patch")?.properties?.file).toMatchObject({ type: "string", format: "binary" });
  });

  test("the vehicle contract names the image instructions and exposes no storage key field", async () => {
    const doc = await spec();
    const patch = form(doc, "/api/v1/admin/vehicles/{id}", "patch");
    for (const field of ["removeImageIds", "imageOrder", "primaryImageId", "primaryImageIndex"]) expect(patch?.properties).toHaveProperty(field);
    expect(form(doc, "/api/v1/admin/vehicles", "post")?.properties).toHaveProperty("primaryImageIndex");
    const text = JSON.stringify(doc);
    expect(text).not.toContain("storageKey");
    expect(text).not.toContain("imageStorageKey");
    expect(text).not.toContain("~kind");
  });
});
