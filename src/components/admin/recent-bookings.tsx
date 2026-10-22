"use client";

import { BookingStatusBadge } from "@/components/customer/booking-status-badge";
import { AnimatedActivityList } from "@/components/motion/animated-activity-list";
import { bookings } from "@/features/mock/data";
import { formatDate, formatPrice } from "@/lib/format";

export function RecentBookings() {
  return (
    <section aria-labelledby="recent" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id="recent" className="mb-1 text-base font-bold">
        Recent bookings
      </h2>
      <AnimatedActivityList
        aria-label="Recent bookings"
        items={bookings.slice(0, 5)}
        getKey={(booking) => booking.id}
        className="divide-y divide-line"
        renderItem={(booking) => (
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{booking.customer}</p>
              <p className="truncate text-xs text-subtle">
                {booking.bike} · {formatDate(booking.startDate, { year: undefined })}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="tabular text-sm font-semibold">{formatPrice(booking.total)}</span>
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
        )}
      />
    </section>
  );
}
