"use client";

import { BellIcon, CalendarXIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { BrandLoader } from "@/components/customer/brand-loader";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { useTranslations } from "@/i18n/hooks";
import { BOOKING_TABS, useBookingTabParams, type BookingTab } from "../hooks/use-booking-tab-params";
import { useBookingTabList, usePrefetchBookingTabs } from "../hooks/use-booking-tab-queries";
import { BookingCard } from "./booking-card";

const tabText = {
  upcoming: { label: "tabUpcoming", empty: "emptyUpcoming" },
  active: { label: "tabActive", empty: "emptyActive" },
  completed: { label: "tabCompleted", empty: "emptyCompleted" },
  cancelled: { label: "tabCancelled", empty: "emptyCancelled" },
} as const satisfies Record<BookingTab, { label: string; empty: string }>;

export function BookingsView() {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const tabs = useBookingTabParams();
  const list = useBookingTabList(tabs.selected, tabs.page);
  usePrefetchBookingTabs(tabs.selected, list.isLoaded);

  const content = list.isLoading ? (
    <BrandLoader className="min-h-64" />
  ) : list.items.length === 0 ? (
    <EmptyState icon={<CalendarXIcon size={24} />} title={t(tabText[tabs.selected].empty)} action={<ButtonLink href="/bikes" variant="outline" size="sm">{t("browseBikes")}</ButtonLink>} />
  ) : (
    <div className="flex flex-col gap-5">
      <AnimatedGrid className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {list.items.map(({ booking, bike }) => <BookingCard key={booking.reference} booking={booking} bike={bike} />)}
      </AnimatedGrid>
      {list.pageCount > 1 ? <Pagination page={tabs.page} pageCount={list.pageCount} onPageChange={tabs.goToPage} summary={`${list.total} bookings`} /> : null}
    </div>
  );

  return (
    <>
      <AppBar
        title={t("myBookings")}
        actions={
          <Link href="/notifications" aria-label={common("notifications")} className="flex size-11 items-center justify-center rounded-control outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ink">
            <BellIcon size={22} />
          </Link>
        }
      />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title={t("myBookings")} />
        <Tabs
          aria-label={t("bookingStatusAria")}
          selectedKey={tabs.selected}
          onSelectionChange={(key) => tabs.selectTab(key as BookingTab)}
          items={BOOKING_TABS.map((tab) => ({ id: tab, label: t(tabText[tab].label), content: tab === tabs.selected ? content : null }))}
        />
      </Screen>
    </>
  );
}
