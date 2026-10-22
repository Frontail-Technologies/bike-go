type StoredObject = { bytes: Uint8Array; contentType: string };

export type FakeS3 = {
  url: string;
  bucket: string;
  objects: Map<string, StoredObject>;
  requests: { method: string; key: string; authorization: string | null }[];
  stop: () => void;
};

const notFound = (key: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message><Key>${key}</Key></Error>`, {
    status: 404,
    headers: { "content-type": "application/xml" },
  });

export function startFakeS3(bucket: string): FakeS3 {
  const objects = new Map<string, StoredObject>();
  const requests: FakeS3["requests"] = [];

  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      const prefix = `/${bucket}/`;
      if (!url.pathname.startsWith(prefix)) return new Response("wrong bucket", { status: 404 });
      const key = decodeURIComponent(url.pathname.slice(prefix.length));
      requests.push({ method: request.method, key, authorization: request.headers.get("authorization") });

      if (request.method === "PUT") {
        objects.set(key, { bytes: new Uint8Array(await request.arrayBuffer()), contentType: request.headers.get("content-type") ?? "application/octet-stream" });
        return new Response(null, { status: 200, headers: { etag: '"fake"' } });
      }
      if (request.method === "GET" || request.method === "HEAD") {
        const found = objects.get(key);
        if (!found) return notFound(key);
        return new Response(request.method === "HEAD" ? null : (found.bytes as BodyInit), { headers: { "content-type": found.contentType, "content-length": String(found.bytes.byteLength) } });
      }
      if (request.method === "DELETE") {
        objects.delete(key);
        return new Response(null, { status: 204 });
      }
      return new Response("unsupported", { status: 405 });
    },
  });

  return { url: `http://localhost:${server.port}`, bucket, objects, requests, stop: () => server.stop(true) };
}

type Holder = { __fakeS3?: FakeS3 };

export const fakeS3 = (): FakeS3 => {
  const found = (globalThis as Holder).__fakeS3;
  if (!found) throw new Error("The fake R2 endpoint is started by tests/setup.ts");
  return found;
};

export const registerFakeS3 = (instance: FakeS3) => {
  (globalThis as Holder).__fakeS3 = instance;
};
