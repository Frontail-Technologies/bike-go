import { apiClient } from "@/lib/api/client";
import { unwrapData, type ApiEnvelope } from "@/lib/api/contracts";
import type { HomeData } from "../types";

export async function getHome(signal?: AbortSignal): Promise<HomeData> {
  const response = await apiClient.request<ApiEnvelope<HomeData>>({ method: "GET", url: "/home", signal });
  return unwrapData(response.data);
}
