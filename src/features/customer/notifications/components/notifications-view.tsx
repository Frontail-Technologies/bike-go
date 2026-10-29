"use client";

import { BellIcon, CalendarCheckIcon, ClockCountdownIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { BrandLoader } from "@/components/customer/brand-loader";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/selection-controls";
import { profileStore } from "@/features/customer/profile/stores/preferences-store";
import { formatDateTime } from "@/lib/date";
import { useNotificationsQuery } from "../hooks/use-notifications";
import { browserNotificationPermission, enableBrowserNotifications } from "../lib/browser-notifications";
import { notificationText } from "../lib/notification-text";
import type { CustomerNotification } from "../types";

function NoticeIcon({ kind }: { kind: CustomerNotification["kind"] }) {
  return kind === "reminder" ? <ClockCountdownIcon size={20} /> : <CalendarCheckIcon size={20} />;
}

export function NotificationsView() {
  const preferences = profileStore.useValue().notifications;
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => browserNotificationPermission());
  const notifications = useNotificationsQuery({ page: 1, pageSize: 30 });
  const notices = notifications.data?.data ?? [];

  const toggleBrowserNotifications = async (enabled: boolean) => {
    const allowed = !enabled || await enableBrowserNotifications();
    setPermission(browserNotificationPermission());
    profileStore.update((state) => ({ ...state, notifications: { ...state.notifications, updates: enabled && allowed, reminders: enabled && allowed } }));
  };

  return (
    <>
      <AppBar title="Notifications" leading="back" backFallback="/" />
      <Screen bottom="nav" className="flex max-w-3xl flex-col gap-4 md:gap-6">
        <DesktopTitle title="Notifications" subtitle="Booking and trip updates for your RideGo account." />
        <section className="rounded-card border border-line bg-surface p-4 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-ink"><BellIcon size={20} weight="fill" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">Browser notifications</p>
              <p className="mt-0.5 text-sm text-subtle">Allow RideGo to notify you about booking reminders and trip updates.</p>
            </div>
          </div>
          <div className="mt-3 border-t border-line pt-2">
            <Switch isSelected={preferences.reminders && preferences.updates} onChange={toggleBrowserNotifications} isDisabled={permission === "unsupported" || permission === "denied"}>
              {permission === "denied" ? "Blocked in browser settings" : permission === "unsupported" ? "Not supported by this browser" : "Enable booking reminders and trip updates"}
            </Switch>
          </div>
        </section>
        <section aria-label="Customer notifications" className="rounded-card border border-line bg-surface shadow-card">
          {notifications.isPending ? <BrandLoader className="min-h-64" /> : null}
          {notifications.isError ? <p className="px-5 py-10 text-center text-sm text-subtle">Notifications could not be loaded. Please try again.</p> : null}
          {!notifications.isPending && !notifications.isError && notices.length === 0 ? <EmptyState icon={<BellIcon size={24} />} title="You have no notifications yet." /> : null}
          {!notifications.isPending && !notifications.isError && notices.length > 0 ? (
            <ul className="divide-y divide-line">
              {notices.map((notice) => {
                const text = notificationText(notice);
                return (
                  <li key={notice.id}>
                    <Link href={notice.href} className="flex min-h-20 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-ink"><NoticeIcon kind={notice.kind} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{text.title}</span><span className="mt-0.5 block truncate text-sm text-subtle">{text.detail}</span></span>
                      <time dateTime={notice.occurredAt} className="shrink-0 text-right text-xs text-subtle">{formatDateTime(notice.occurredAt)}<br />ICT</time>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </Screen>
    </>
  );
}
