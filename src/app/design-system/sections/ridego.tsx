"use client";

import { CalendarCheckIcon, CurrencyDollarIcon, MotorcycleIcon, UsersIcon } from "@phosphor-icons/react";
import { CalendarDate } from "@internationalized/date";
import { useState } from "react";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { BookingStatusBadge } from "@/components/customer/booking-status-badge";
import { BookingSummary } from "@/components/customer/booking-summary";
import { MotorcycleCard } from "@/components/customer/motorcycle-card";
import { MotorcycleGallery } from "@/components/customer/motorcycle-gallery";
import { PriceDisplay } from "@/components/customer/price-display";
import { RentalDateSelector, rentalDays, type RentalSelection } from "@/components/customer/rental-date-selector";
import { StickyBookingBar } from "@/components/customer/sticky-booking-bar";
import { toast } from "@/components/ui/toast";
import { dashboardStats, motorcycles } from "@/features/mock/data";
import { Demo, Section } from "../section";

const statIcons = {
  revenue: <CurrencyDollarIcon size={20} />,
  bookings: <CalendarCheckIcon size={20} />,
  active: <MotorcycleIcon size={20} />,
  customers: <UsersIcon size={20} />,
} as const;

const bike = motorcycles[0];

const booked = [new CalendarDate(2026, 10, 28), new CalendarDate(2026, 10, 29)];

export function RideGoSection() {
  const [selection, setSelection] = useState<RentalSelection>({
    range: { start: new CalendarDate(2026, 10, 23), end: new CalendarDate(2026, 10, 25) },
    pickupTime: "10:00 AM",
    dropTime: "10:00 AM",
  });
  const days = Math.max(1, rentalDays(selection.range));
  const hasRange = Boolean(selection.range);

  return (
    <Section id="ridego" title="RideGo components" description="Booking building blocks composed from the system above, using mock data.">
      <Demo title="MotorcycleCard">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {motorcycles.slice(0, 4).map((item) => (
            <MotorcycleCard key={item.id} bike={item} />
          ))}
        </div>
      </Demo>

      <div className="grid gap-8 lg:grid-cols-2">
        <Demo title="MotorcycleGallery">
          <MotorcycleGallery bike={bike} />
        </Demo>

        <div className="flex flex-col gap-8">
          <Demo title="PriceDisplay">
            <div className="flex flex-wrap items-end gap-6">
              <PriceDisplay amount={15} size="lg" />
              <PriceDisplay amount={15} />
              <PriceDisplay amount={90} unit="week" size="sm" />
              <PriceDisplay amount={118.4} unit={null} size="lg" precise />
            </div>
          </Demo>
          <Demo title="BookingStatusBadge">
            <div className="flex flex-wrap gap-2">
              <BookingStatusBadge status="upcoming" />
              <BookingStatusBadge status="ongoing" />
              <BookingStatusBadge status="completed" />
              <BookingStatusBadge status="cancelled" />
            </div>
          </Demo>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Demo title="RentalDateSelector (28–29 Oct unavailable)">
          <RentalDateSelector
            value={selection}
            onChange={setSelection}
            isDateUnavailable={(date) => booked.some((b) => b.compare(date) === 0)}
          />
        </Demo>

        <div className="flex flex-col gap-8">
          <Demo title="BookingSummary (updates with the dates)">
            <BookingSummary
              lines={[
                { id: "rental", days: hasRange ? days : 0, amount: hasRange ? bike.pricePerDay * days : 0 },
                { id: "helmet", amount: hasRange ? 2 * days : 0 },
              ]}
            />
          </Demo>

          <Demo title="Sticky booking CTA" className="overflow-hidden p-0 md:p-0">
            <div className="h-64 overflow-y-auto bg-canvas">
              <div className="flex h-96 flex-col gap-2 p-4 text-sm text-subtle">
                <p>Scroll this panel. The booking bar stays pinned to the bottom.</p>
                <p>On real pages it sits above the bottom navigation and respects the safe area.</p>
              </div>
              <StickyBookingBar
                inline
                amount={bike.pricePerDay}
                isDisabled={!hasRange}
                onPress={() => toast.success("Dates held", { description: `${days} ${days === 1 ? "day" : "days"} on the ${bike.name}.` })}
              />
            </div>
          </Demo>
        </div>
      </div>

      <Demo title="DashboardStatCard">
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 md:gap-4">
          {dashboardStats.map((stat) => (
            <DashboardStatCard key={stat.id} {...stat} icon={statIcons[stat.id as keyof typeof statIcons]} />
          ))}
        </div>
      </Demo>
    </Section>
  );
}
