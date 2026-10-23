type CacheContext = {
  request: Request;
  set: { headers: Record<string, unknown>; status?: unknown };
  responseValue: unknown;
  query: Record<string, unknown>;
};

type CacheOptions = { staleWhileRevalidate?: number; skip?: (query: Record<string, unknown>) => boolean };

const etagOf = (value: unknown) => `W/"${Bun.hash(JSON.stringify(value)).toString(36)}"`;

export const publicCache = (maxAgeSeconds: number, options: CacheOptions = {}) =>
  (({ request, set, responseValue, query }: CacheContext) => {
    if (request.method !== "GET" || responseValue instanceof Response || options.skip?.(query)) return;
    if (typeof set.status === "number" && set.status >= 400) return;

    const etag = etagOf(responseValue);
    const cacheControl = `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${options.staleWhileRevalidate ?? maxAgeSeconds * 2}`;
    set.headers["cache-control"] = cacheControl;
    set.headers["etag"] = etag;

    const supplied = request.headers.get("if-none-match");
    if (supplied && supplied.split(",").some((tag) => tag.trim() === etag)) {
      const headers = new Headers();
      for (const [name, value] of Object.entries(set.headers)) if (value !== undefined) headers.set(name, String(value));
      headers.delete("content-type");
      headers.delete("content-length");
      return new Response(null, { status: 304, headers });
    }
  }) as never;
