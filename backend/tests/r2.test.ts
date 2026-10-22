import { describe, expect, test } from "bun:test";
import { storage } from "../src/providers/storage";
import { LocalStorageProvider } from "../src/providers/storage/local";
import { R2StorageProvider } from "../src/providers/storage/r2";
import { fakeS3 } from "./helpers/fake-s3";

const bytes = (text: string) => new TextEncoder().encode(text);
const unsafeKeys = ["../outside.pdf", "a/../../b.pdf", "/etc/passwd", "C:/windows/x", "a b.pdf", "a//b.pdf", ""];

describe("the configured storage is Cloudflare R2", () => {
  test("the app is wired to the R2 provider in this environment", () => {
    expect(storage).toBeInstanceOf(R2StorageProvider);
  });

  test("put and get round-trip the exact bytes, signed with the access key and the auto region", async () => {
    const key = `loans/test/${crypto.randomUUID()}.pdf`;
    await storage.put(key, bytes("%PDF-1.4 hello r2"), { contentType: "application/pdf" });

    expect(await storage.get(key)).toEqual(bytes("%PDF-1.4 hello r2"));
    const s3 = fakeS3();
    expect(s3.objects.get(key)?.contentType).toBe("application/pdf");
    const put = s3.requests.find((r) => r.method === "PUT" && r.key === key);
    expect(put?.authorization).toStartWith("AWS4-HMAC-SHA256 Credential=test-access-key/");
    expect(put?.authorization).toContain("/auto/s3/aws4_request");
  });

  test("a missing key is null, and deleting a missing key is harmless", async () => {
    expect(await storage.get("loans/test/missing.pdf")).toBeNull();
    await storage.delete("loans/test/missing.pdf");
  });

  test("delete removes the object", async () => {
    const key = `loans/test/${crypto.randomUUID()}.png`;
    await storage.put(key, bytes("png"), { contentType: "image/png" });
    await storage.delete(key);
    expect(fakeS3().objects.has(key)).toBe(false);
    expect(await storage.get(key)).toBeNull();
  });

  test("unsafe keys are refused before any request is made", async () => {
    const before = fakeS3().requests.length;
    for (const key of unsafeKeys) {
      await expect(storage.put(key, bytes("x"), { contentType: "text/plain" })).rejects.toThrow();
      await expect(storage.get(key)).rejects.toThrow();
      await expect(storage.delete(key)).rejects.toThrow();
      await expect(storage.getDownloadUrl(key, { expiresInSeconds: 60 })).rejects.toThrow();
    }
    expect(fakeS3().requests.length).toBe(before);
  });

  test("local and R2 apply the same key rules", async () => {
    const local = new LocalStorageProvider("./.pglite/storage-key-rules");
    for (const key of unsafeKeys) {
      await expect(local.put(key, bytes("x"), { contentType: "text/plain" })).rejects.toThrow();
    }
  });

  test("download URLs are short-lived presigned links, and direct uploads are not offered", async () => {
    const key = `loans/test/${crypto.randomUUID()}.pdf`;
    const link = await storage.getDownloadUrl(key, { expiresInSeconds: 300 });
    const url = new URL(link!);
    expect(url.origin).toBe(fakeS3().url);
    expect(url.pathname).toBe(`/ridego-test/${key}`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.get("X-Amz-Credential")).toStartWith("test-access-key/");
    expect(await storage.createUploadTarget(key, { contentType: "application/pdf", maxBytes: 1 })).toBeNull();
  });
});

describe("storage configuration", () => {
  const run = async (env: Record<string, string>) => {
    const child = Bun.spawn(["bun", "-e", 'await import("./src/env"); console.log("ENV OK")'], {
      cwd: new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
      env: { PATH: process.env.PATH ?? "", ...env },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
    await child.exited;
    return out + err;
  };

  test("r2 without its settings refuses to start and names what is missing", async () => {
    const output = await run({ STORAGE_DRIVER: "r2" });
    expect(output).toContain("STORAGE_DRIVER=r2 needs");
    expect(output).toContain("R2_BUCKET");
    expect(output).toContain("R2_ACCESS_KEY_ID");
    expect(output).toContain("R2_SECRET_ACCESS_KEY");
    expect(output).toContain("R2_ACCOUNT_ID or R2_ENDPOINT");
  });

  test("r2 with an account id is complete, and empty values count as unset", async () => {
    const complete = await run({ STORAGE_DRIVER: "r2", R2_ACCOUNT_ID: "abc123", R2_BUCKET: "docs", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s", R2_ENDPOINT: "" });
    expect(complete).toContain("ENV OK");
    const emptyBucket = await run({ STORAGE_DRIVER: "r2", R2_ACCOUNT_ID: "abc123", R2_BUCKET: "", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s" });
    expect(emptyBucket).toContain("R2_BUCKET");
  });

  test("production will not use local disk storage", async () => {
    const production = {
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "prod-verification-secret-0123456789abcdef-xyz",
      GOOGLE_CLIENT_ID: "g",
      GOOGLE_CLIENT_SECRET: "g",
      TELEGRAM_BOT_TOKEN: "1:t",
    };
    expect(await run({ ...production, STORAGE_DRIVER: "local" })).toContain("STORAGE_DRIVER must be r2 in production");
    expect(await run({ ...production, STORAGE_DRIVER: "r2", R2_ACCOUNT_ID: "a", R2_BUCKET: "b", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s" })).toContain("ENV OK");
  });
});
