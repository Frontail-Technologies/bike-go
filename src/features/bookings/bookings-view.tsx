"use client";

import { CalendarXIcon } from "@phosphor-icons/react";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { getBike } from "@/features/mock/data";
import { BookingCard } from "./booking-card";
import { bookingsStore } from "./store";
import type { CustomerBooking } from "./types";

const tabs = [
  { id: "upcoming", label: "Upcoming", statuses: ["upcoming"], empty: "No upcoming bookings" },
  { id: "active", label: "Active", statuses: ["ongoing"], empty: "No active rentals" },
  { id: "completed", label: "Completed", statuses: ["completed"], empty: "No completed rides yet" },
  { id: "cancelled", label: "Cancelled", statuses: ["cancelled"], empty: "No cancelled bookings" },
] as const;

function sortByStart(list: CustomerBooking[], desc: boolean) {
  return [...list].sort((a, b) => (desc ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate)));
}

export function BookingsView() {
  const all = bookingsStore.useValue();

  return (
    <>
      <AppBar title="My bookings" />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title="My bookings" />
      <Tabs
        aria-label="Booking status"
        items={tabs.map((tab) => {
          const list = sortByStart(
            all.filter((b) => (tab.statuses as readonly string[]).includes(b.status)),
            tab.id !== "upcoming",
          );
          return {
            id: tab.id,
            label: tab.label,
            content:
              list.length === 0 ? (
                <EmptyState
                  icon={<CalendarXIcon size={24} />}
                  title={tab.empty}
                  description="Pick a bike and your rides will show up here."
                  action={<ButtonLink href="/bikes" size="sm">Browse bikes</ButtonLink>}
                />
              ) : (
                <AnimatedGrid className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  {list.map((booking) => {
                    const bike = getBike(booking.bikeId);
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
