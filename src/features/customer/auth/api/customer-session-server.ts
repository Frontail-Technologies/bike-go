import "server-only";

import { cookies } from "next/headers";
import type { CustomerSession } from "../types";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

export async function getCustomerSessionServer(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.toString();
  if (!cookie) return null;

  try {
    const response = await fetch(`${apiBaseUrl}/auth/get-session`, {
      headers: { cookie, accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json() as CustomerSession | null;
  } catch {
    return null;
  }
}
