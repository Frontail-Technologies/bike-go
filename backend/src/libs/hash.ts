import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const sha256Hex = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export const requestHash = (payload: unknown) => sha256Hex(stableStringify(payload));

export function hmacSha256Hex(key: string | Buffer, data: string) {
  return createHmac("sha256", key).update(data).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
