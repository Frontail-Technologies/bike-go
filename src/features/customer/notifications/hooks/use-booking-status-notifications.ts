"use client";

import { useEffect, useRef } from "react";
import { useCustomerSessionQuery } from "@/features/customer/auth/hooks/use-customer-session-query";
import { profileStore } from "@/features/customer/profile/stores/preferences-store";
import { showBrowserNotification } from "../lib/browser-notifications";
import { notificationText } from "../lib/notification-text";
import { useNotificationsQuery } from "./use-notifications";

const WATCH_PARAMS = { page: 1, pageSize: 30 } as const;

export function useBookingStatusNotifications() {
  const session = useCustomerSessionQuery();
  const preferences = profileStore.useValue().notifications;
  const previous = useRef<Set<string> | null>(null);
  const notifications = useNotificationsQuery(WATCH_PARAMS, { enabled: Boolean(session.data && preferences.updates), refetchInterval: 30_000 });

  useEffect(() => {
    if (!notifications.data) return;
    const next = new Set(notifications.data.data.map((notice) => notice.id));
    if (previous.current && preferences.updates) {
      for (const notice of notifications.data.data) {
        if (!previous.current.has(notice.id)) {
          const text = notificationText(notice);
          void showBrowserNotification(text.title, { body: text.detail, tag: notice.id, data: { url: notice.href } });
        }
      }
    }
    previous.current = next;
  }, [notifications.data, preferences.updates]);
}
