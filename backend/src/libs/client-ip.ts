import { env } from "@/env";

type ServerLike = { requestIP?: (request: Request) => { address: string } | null } | null | undefined;

export function clientIp(request: Request, server?: ServerLike) {
  if (env.TRUST_PROXY) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
    const real = request.headers.get("x-real-ip")?.trim();
    if (real) return real;
  }
  return server?.requestIP?.(request)?.address ?? "unknown";
}
