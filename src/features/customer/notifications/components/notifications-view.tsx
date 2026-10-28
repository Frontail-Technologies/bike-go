"use client";

import { BellIcon, CalendarCheckIcon, ClockCountdownIcon, MotorcycleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { BrandLoader } from "@/components/customer/brand-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/selection-controls";
import { useBookingsQuery } from "@/features/customer/bookings/hooks/use-bookings";
import type { ApiBooking, ApiBookingStatus } from "@/features/customer/bookings/types";
import { profileStore } from "@/features/customer/profile/stores/preferences-store";
import { browserNotificationPermission, enableBrowserNotifications } from "../lib/browser-notifications";

type CustomerNotice = { id: string; title: string; detail: string; occurredAt: string; href: string; kind: "booking" | "reminder" | "trip" };

const statusLabels: Record<ApiBookingStatus, string> = {
  pending: "Booking pending",
  confirmed: "Booking confirmed",
  ready_for_pickup: "Ready for pickup",
  active: "Your rental is active",
  returned: "Vehicle returned",
  completed: "Booking completed",
  cancelled: "Booking cancelled",
  expired: "Booking expired",
  no_show: "Marked as no show",
};

function cambodiaDateTime(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }).format(value);
}

function noticesFor(bookings: ApiBooking[]): CustomerNotice[] {
  const now = Date.now();
  const notices = bookings.flatMap((booking) => {
    const href = `/bookings/${booking.reference}`;
    const standard: CustomerNotice = {
      id: `booking-${booking.reference}-${booking.bookingStatus}`,
      title: statusLabels[booking.bookingStatus],
      detail: `${booking.vehicle.name} · ${booking.reference}`,
      occurredAt: booking.createdAt,
      href,
      kind: "booking",
    };
    const pickupMs = new Date(booking.pickupAt).getTime();
    const returnMs = new Date(booking.returnAt).getTime();
    const reminder: CustomerNotice[] = [];

    if (["pending", "confirmed", "ready_for_pickup"].includes(booking.bookingStatus) && pickupMs >= now && pickupMs - now <= 86_400_000) {
      reminder.push({ id: `pickup-${booking.reference}`, title: "Pickup reminder", detail: `${booking.vehicle.name} pickup at ${cambodiaDateTime(booking.pickupAt)} ICT`, occurredAt: booking.pickupAt, href, kind: "reminder" });
    }
    if (booking.bookingStatus === "active" && returnMs >= now && returnMs - now <= 86_400_000) {
      reminder.push({ id: `return-${booking.reference}`, title: "Return reminder", detail: `${booking.vehicle.name} return at ${cambodiaDateTime(booking.returnAt)} ICT`, occurredAt: booking.returnAt, href, kind: "reminder" });
    }
    return [standard, ...reminder];
  });
  return notices.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
}

function NoticeIcon({ kind }: { kind: CustomerNotice["kind"] }) {
  if (kind === "reminder") return <ClockCountdownIcon size={20} />;
  if (kind === "trip") return <MotorcycleIcon size={20} />;
  return <CalendarCheckIcon size={20} />;
}

export function NotificationsView() {
  const preferences = profileStore.useValue().notifications;
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => browserNotificationPermission());
  const bookings = useBookingsQuery({ page: 1, pageSize: 100 });
  const notices = useMemo(() => noticesFor(bookings.data?.data ?? []), [bookings.data?.data]);

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
          {bookings.isPending ? <BrandLoader className="min-h-64" /> : null}
          {bookings.isError ? <p className="px-5 py-10 text-center text-sm text-subtle">Notifications could not be loaded. Please try again.</p> : null}
          {!bookings.isPending && !bookings.isError && notices.length === 0 ? <EmptyState icon={<BellIcon size={24} />} title="You have no notifications yet." /> : null}
          {!bookings.isPending && !bookings.isError && notices.length > 0 ? (
            <ul className="divide-y divide-line">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <Link href={notice.href} className="flex min-h-20 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-ink"><NoticeIcon kind={notice.kind} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{notice.title}</span><span className="mt-0.5 block truncate text-sm text-subtle">{notice.detail}</span></span>
                    <time dateTime={notice.occurredAt} className="shrink-0 text-right text-xs text-subtle">{cambodiaDateTime(notice.occurredAt)}<br />ICT</time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </Screen>
    </>
  );
}
