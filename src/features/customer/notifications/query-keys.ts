import type { NotificationListParams } from "./types";

export const customerNotificationKeys = {
  root: () => ["customer", "notifications"] as const,
  list: (params: NotificationListParams) => [...customerNotificationKeys.root(), "list", params] as const,
} as const;
