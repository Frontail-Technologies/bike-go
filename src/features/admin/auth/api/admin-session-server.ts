import "server-only";

import { cookies } from "next/headers";
import type { AdminSession } from "../types/session";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

type AdminSessionEnvelope = { data: AdminSession };

/** Reads the safe admin session view on the server without exposing the cookie token. */
export async function getAdminSessionServer(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  if (!cookieStore.has("ridego_admin_session")) return null;

  try {
    const response = await fetch(`${apiBaseUrl}/admin/me`, {
      headers: { cookie: cookieStore.toString(), accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return ((await response.json()) as AdminSessionEnvelope).data;
  } catch {
    return null;
  }
}
