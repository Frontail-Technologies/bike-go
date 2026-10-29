import { apiClient } from "@/lib/api/client";
import { unwrapPage, type ApiEnvelope, type ApiPage } from "@/lib/api/contracts";
import type { CustomerNotification, NotificationListParams } from "../types";

export async function listNotifications(params: NotificationListParams, signal?: AbortSignal): Promise<ApiPage<CustomerNotification>> {
  const response = await apiClient.request<ApiEnvelope<CustomerNotification[]>>({ method: "GET", url: "/me/notifications", params, signal });
  return unwrapPage(response.data);
}
