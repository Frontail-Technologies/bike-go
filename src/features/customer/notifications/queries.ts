import { queryOptions } from "@tanstack/react-query";
import { listNotifications } from "./api/notifications-api";
import { customerNotificationKeys } from "./query-keys";
import type { NotificationListParams } from "./types";

export function listNotificationsQuery(params: NotificationListParams) {
  return queryOptions({ queryKey: customerNotificationKeys.list(params), queryFn: ({ signal }) => listNotifications(params, signal) });
}
