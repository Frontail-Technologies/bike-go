"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { BookingStatusBadge } from "@/components/customer/booking-status-badge";
import { InteractiveCard } from "@/components/motion/interactive-card";
import { BikeImage } from "@/components/shared/bike-image";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { toast } from "@/components/ui/toast";
import type { Motorcycle } from "@/features/mock/data";
import { formatMoney } from "@/lib/format";
import { formatRange } from "./dates";
import type { CustomerBooking } from "./types";

/** One contextual action per state: look, extend, or rebook. */
function PrimaryAction({ booking, bike }: { booking: CustomerBooking; bike: Motorcycle }) {
  if (booking.status === "upcoming") {
    return (
      <ButtonLink href={`/bookings/${booking.reference}`} size="sm" className="relative z-10">
        View details
      </ButtonLink>
    );
  }
  if (booking.status === "ongoing") {
    return (
      <Button
        size="sm"
        className="relative z-10"
        onPress={() => toast.success("Extension requested", { description: "We will confirm within 15 minutes." })}
      >
        Extend rental
      </Button>
    );
  }
  return (
    <ButtonLink href={`/bikes/${bike.id}`} size="sm" variant="secondary" className="relative z-10">
      Book again
    </ButtonLink>
  );
}

export function BookingCard({ booking, bike }: { booking: CustomerBooking; bike: Motorcycle }) {
  return (
    <InteractiveCard as="article" className="flex flex-col gap-3 p-3">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-control bg-canvas">
          <BikeImage bike={bike} decorative sizes="80px" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/bookings/${booking.reference}`}
              className="min-w-0 outline-none after:absolute after:inset-0 focus-visible:after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ink"
            >
              <h3 className="truncate text-sm font-bold">{bike.name}</h3>
            </Link>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="tabular text-xs text-subtle">Booking {booking.reference}</p>
          <p className="flex items-center gap-1.5 text-xs text-subtle">
            <CalendarBlankIcon size={16} className="shrink-0" />
            {formatRange(booking.startDate, booking.endDate)}
            <span aria-hidden>·</span>
            {booking.quote.days} {booking.quote.days === 1 ? "day" : "days"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <div>
          <p className="text-[11px] text-subtle">{booking.status === "cancelled" ? "Refunded" : "Total paid"}</p>
          <p className="tabular text-base font-extrabold">{formatMoney(booking.quote.payable)}</p>
        </div>
        <PrimaryAction booking={booking} bike={bike} />
      </div>
    </InteractiveCard>
  );
}
