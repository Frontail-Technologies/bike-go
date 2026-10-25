"use client";

import { CalendarXIcon } from "@phosphor-icons/react";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { useTranslations } from "@/i18n/hooks";
import { BookingCard } from "./booking-card";
import type { CustomerBooking } from "./types";
import { useBookingsQuery } from "./hooks/generated";
import { apiBookingToView } from "./booking-mapper";

const tabs = [
  { id: "upcoming", label: "tabUpcoming", statuses: ["upcoming"], empty: "emptyUpcoming" },
  { id: "active", label: "tabActive", statuses: ["ongoing"], empty: "emptyActive" },
  { id: "completed", label: "tabCompleted", statuses: ["completed"], empty: "emptyCompleted" },
  { id: "cancelled", label: "tabCancelled", statuses: ["cancelled"], empty: "emptyCancelled" },
] as const;

function sortByStart(list: CustomerBooking[], desc: boolean) {
  return [...list].sort((a, b) => (desc ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate)));
}

export function BookingsView() {
  const bookings = useBookingsQuery({ page: 1, pageSize: 100 });
  const all = (bookings.data?.data ?? []).map((item) => apiBookingToView(item));
  const t = useTranslations("booking");

  return (
    <>
      <AppBar title={t("myBookings")} />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title={t("myBookings")} />
      <Tabs
        aria-label={t("bookingStatusAria")}
        items={tabs.map((tab) => {
          const list = sortByStart(
            all.map((item) => item.booking).filter((b) => (tab.statuses as readonly string[]).includes(b.status)),
            tab.id !== "upcoming",
          );
          return {
            id: tab.id,
            label: t(tab.label),
            content:
              list.length === 0 ? (
                <EmptyState
                  icon={<CalendarXIcon size={24} />}
                  title={t(tab.empty)}
                  description={t("emptyText")}
                  action={<ButtonLink href="/bikes" size="sm">{t("browseBikes")}</ButtonLink>}
                />
              ) : (
                <AnimatedGrid className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  {list.map((booking) => {
                    const bike = all.find((item) => item.booking.reference === booking.reference)?.bike;
                    return bike ? <BookingCard key={booking.reference} booking={booking} bike={bike} /> : null;
                  })}
                </AnimatedGrid>
              ),
          };
        })}
      />
      </Screen>
    </>
  );
}
