"use client";

import { CalendarXIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useTranslations } from "@/i18n/hooks";
import { BookingCard } from "./booking-card";
import type { CustomerBooking } from "../types";
import { useBookingsQuery } from "../hooks/use-bookings";
import { apiBookingToView } from "../lib/booking-mapper";

const tabs = [
  { id: "upcoming", label: "tabUpcoming", empty: "emptyUpcoming" },
  { id: "active", label: "tabActive", empty: "emptyActive" },
  { id: "completed", label: "tabCompleted", empty: "emptyCompleted" },
  { id: "cancelled", label: "tabCancelled", empty: "emptyCancelled" },
] as const;

function sortByStart(list: CustomerBooking[], desc: boolean) {
  return [...list].sort((a, b) => (desc ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate)));
}

export function BookingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = tabs.some((tab) => tab.id === params.get("tab")) ? params.get("tab") as typeof tabs[number]["id"] : "upcoming";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = 12;
  const bookings = useBookingsQuery({ page, pageSize, group: selected });
  const all = (bookings.data?.data ?? []).map((item) => apiBookingToView(item));
  const t = useTranslations("booking");
  const navigate = (tab: typeof selected, nextPage = 1) => {
    const query = new URLSearchParams(params.toString());
    if (tab === "upcoming") query.delete("tab"); else query.set("tab", tab);
    if (nextPage <= 1) query.delete("page"); else query.set("page", String(nextPage));
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
  };
  const list = sortByStart(all.map((item) => item.booking), selected !== "upcoming");
  const total = bookings.data?.meta.total ?? 0;
  const content = bookings.isPending ? (
    <p className="py-12 text-center text-sm text-subtle" role="status">Loading bookings…</p>
  ) : list.length === 0 ? (
    <EmptyState icon={<CalendarXIcon size={24} />} title={t(tabs.find((tab) => tab.id === selected)!.empty)} description={t("emptyText")} action={<ButtonLink href="/bikes" size="sm">{t("browseBikes")}</ButtonLink>} />
  ) : (
    <div className="flex flex-col gap-5">
      <AnimatedGrid className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {list.map((booking) => {
          const bike = all.find((item) => item.booking.reference === booking.reference)?.bike;
          return bike ? <BookingCard key={booking.reference} booking={booking} bike={bike} /> : null;
        })}
      </AnimatedGrid>
      {total > pageSize ? <Pagination page={page} pageCount={Math.ceil(total / pageSize)} onPageChange={(next) => navigate(selected, next)} summary={`${total} bookings`} /> : null}
    </div>
  );

  return (
    <>
      <AppBar title={t("myBookings")} />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title={t("myBookings")} />
      <Tabs
        aria-label={t("bookingStatusAria")}
        selectedKey={selected}
        onSelectionChange={(key) => navigate(key as typeof selected)}
        items={tabs.map((tab) => {
          return {
            id: tab.id,
            label: t(tab.label),
            content: tab.id === selected ? content : null,
          };
        })}
      />
      </Screen>
    </>
  );
}
