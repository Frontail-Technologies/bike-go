"use client";

import { Button } from "@heroui/react";
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { type Booking, fmtDate, fmtShort, money } from "./booking-data";
import { BookingActions, type BookingHandlers, BookingOperationalStatus, PaymentStatusBadge } from "./booking-parts";

export function AdminBookingCard({ booking, handlers }: { booking: Booking; handlers: BookingHandlers }) {
  const sameLocation = booking.pickupLocation === booking.returnLocation;
  return (
    <article className="adminSurface adminLift flex flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-extrabold leading-tight">{booking.reference}</h3>
          <p className="text-xs text-[var(--admin-muted)]">Booked {fmtDate(booking.createdAt)}</p>
        </div>
        <BookingOperationalStatus booking={booking} />
        <BookingActions booking={booking} handlers={handlers} className="-mr-2 -mt-1.5" />
      </header>
      <div className="flex items-center gap-3">
        <VehiclePhoto vehicle={booking.vehicle} className="h-14 w-20 shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="80px" />
        <div className="min-w-0"><p className="truncate text-sm font-bold">{booking.vehicle.name}</p><p className="text-xs text-[var(--admin-muted)]">{booking.vehicle.registrationNumber}</p></div>
      </div>
      <div className="flex items-center gap-2.5">
        <CustomerAvatar name={booking.customer.name} size="sm" className="size-8 text-[11px]" />
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{booking.customer.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{booking.customer.phone}</p></div>
      </div>
      <div className="adminTile space-y-1.5 rounded-xl p-3 text-xs">
        <p className="flex flex-wrap items-center gap-x-2 font-semibold">{fmtShort(booking.pickupAt)}<ArrowRightIcon size={12} className="text-[var(--admin-muted)]" aria-hidden />{fmtShort(booking.returnAt)}</p>
        <p className="flex items-center gap-1.5 text-[var(--admin-muted)]"><MapPinIcon size={13} aria-hidden />{sameLocation ? booking.pickupLocation : `${booking.pickupLocation} → ${booking.returnLocation}`}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3">
        <div><MoneyDisplay amount={money(booking).total} className="text-base font-extrabold" /><div className="mt-1"><PaymentStatusBadge status={booking.paymentStatus} /></div></div>
        <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" onPress={() => handlers.onView(booking)}>View Booking</Button>
      </div>
    </article>
  );
}
