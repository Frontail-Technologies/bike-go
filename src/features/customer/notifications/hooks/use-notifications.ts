"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listNotificationsQuery } from "../queries";
import type { NotificationListParams } from "../types";

export function useNotificationsQuery(params: NotificationListParams, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({ ...listNotificationsQuery(params), enabled: options.enabled, refetchInterval: options.refetchInterval, placeholderData: keepPreviousData });
}
