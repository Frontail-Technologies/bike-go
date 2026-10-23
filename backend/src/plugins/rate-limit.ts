import { Elysia } from "elysia";
import { env } from "@/env";
import { AppError } from "@/libs/api";
import { clientIp } from "@/libs/client-ip";
import { uploadRouteFor } from "@/libs/upload-routes";

export type RateRule = { name: string; limit: number; windowSeconds: number; applies: (method: string, path: string) => boolean };

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const DEFAULT_RATE_RULES: RateRule[] = [
  { name: "auth", limit: 30, windowSeconds: 60, applies: (method, path) => UNSAFE.has(method) && path.startsWith("/api/v1/auth/") },
  { name: "upload", limit: 30, windowSeconds: 60, applies: (method, path) => uploadRouteFor(method, path) !== undefined },
  { name: "callback", limit: 120, windowSeconds: 60, applies: (_method, path) => path === "/api/v1/payments/payway/callback" },
  { name: "write", limit: 120, windowSeconds: 60, applies: (method) => UNSAFE.has(method) },
  { name: "read", limit: 900, windowSeconds: 60, applies: (method, path) => (method === "GET" || method === "HEAD") && path !== "/api/v1/health" },
];

export class WindowCounter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  hit(key: string, windowMs: number, now = Date.now()) {
    if (this.hits.size > 20_000) this.prune(now);
    const current = this.hits.get(key);
    if (!current || current.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.hits.set(key, fresh);
      return fresh;
    }
    current.count += 1;
    return current;
  }

  prune(now = Date.now()) {
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
  }

  clear() {
    this.hits.clear();
  }
}

export const rateLimitCounter = new WindowCounter();

export function createRateLimit(options: { rules: RateRule[]; enabled: boolean; counter?: WindowCounter; name?: string }) {
  const counter = options.counter ?? rateLimitCounter;

  return new Elysia({ name: options.name ?? "RideGo.RateLimit" })
    .onRequest(({ request, set, server }) => {
      if (!options.enabled || request.method === "OPTIONS") return;
      const path = new URL(request.url).pathname;
      const rule = options.rules.find((candidate) => candidate.applies(request.method, path));
      if (!rule) return;

      const entry = counter.hit(`${rule.name}:${clientIp(request, server)}`, rule.windowSeconds * 1000);
      const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000));
      set.headers["ratelimit-limit"] = String(rule.limit);
      set.headers["ratelimit-remaining"] = String(Math.max(0, rule.limit - entry.count));
      set.headers["ratelimit-reset"] = String(resetSeconds);
      if (entry.count > rule.limit) {
        set.headers["retry-after"] = String(resetSeconds);
        throw new AppError("RATE_LIMITED", 429, "Too many requests. Please wait a moment and try again.", { retryAfterSeconds: resetSeconds });
      }
    })
    .as("global");
}

export const rateLimit = createRateLimit({ rules: DEFAULT_RATE_RULES, enabled: env.RATE_LIMIT_ENABLED });
