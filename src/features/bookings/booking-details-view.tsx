"use client";

import { ChatCircleDotsIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { BookingStatusBadge } from "@/components/customer/booking-status-badge";
import { BookingSummary } from "@/components/customer/booking-summary";
import { BikeImage } from "@/components/shared/bike-image";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast";
import { Reveal } from "@/components/motion/reveal";
import { type City, pickupHubs } from "@/features/mock/data";
import { quoteLines } from "@/features/bookings/pricing";
import { BookingTimeline } from "./booking-timeline";
import { formatDay } from "./dates";
import { cancelBooking } from "./store";
import type { CustomerBooking } from "./types";
import { maskLicence, useBooking } from "./use-booking";

function Card({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id={id} className="mb-3 text-base font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function statusHeadline(b: CustomerBooking, hubName: string) {
  switch (b.status) {
    case "upcoming":
      return `Pickup ${formatDay(b.startDate, false)} at ${b.pickupTime}, ${hubName}.`;
    case "ongoing":
      return `On rent. Return by ${formatDay(b.endDate, false)}, ${b.dropTime}.`;
    case "completed":
      return "Ride complete. Your deposit is on its way back.";
    case "cancelled":
      return "This booking was cancelled. Your payment is being refunded.";
  }
}

const depositNote: Record<CustomerBooking["status"], string> = {
  upcoming: "Held. Refunded within 48 hours of return.",
  ongoing: "Held until you return the bike.",
  completed: "Refund processed. Allow up to 48 hours.",
  cancelled: "Refunded with your payment.",
};

export function BookingDetailsView({ reference }: { reference: string }) {
  const found = useBooking(reference);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!found) {
    return (
      <EmptyState
        icon={<MapPinIcon size={24} />}
        title="Booking not found"
        description="Check the reference, or open it from My bookings."
        action={<ButtonLink href="/bookings" size="sm">My bookings</ButtonLink>}
      />
    );
  }

  const { booking, bike } = found;
  const hub = pickupHubs[(booking.city as City) in pickupHubs ? (booking.city as City) : "Jaipur"];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader title="Booking details" subtitle={<span className="tabular">{booking.reference}</span>} showBack backHref="/bookings" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <Reveal y={8} blur={0}>
            <section aria-label="Status" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <BookingStatusBadge status={booking.status} />
                <span className="tabular text-xs text-subtle">Booked {formatDay(booking.createdAt.slice(0, 10))}</span>
              </div>
              <p className="text-sm font-semibold" data-testid="status-message">{statusHeadline(booking, hub.name)}</p>
              <div className="flex gap-3 border-t border-line pt-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-control bg-canvas">
                  <BikeImage bike={bike} decorative sizes="64px" />
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <Link href={`/bikes/${bike.id}`} className="truncate text-sm font-bold underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ink">
                    {bike.name}
                  </Link>
                  <p className="text-xs text-subtle">{bike.model}</p>
                </div>
              </div>
            </section>
          </Reveal>

          <Card id="timeline-title" title="Progress">
            <BookingTimeline booking={booking} />
          </Card>

          <Card id="trip-title" title="Pickup and return">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-subtle uppercase">Pickup</dt>
                <dd className="mt-1 text-sm">
                  <span className="tabular block font-bold">{formatDay(booking.startDate)} · {booking.pickupTime}</span>
                  <span className="block text-subtle">{hub.name}</span>
                  <span className="block text-subtle">{hub.address}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-subtle uppercase">Return</dt>
                <dd className="mt-1 text-sm">
                  <span className="tabular block font-bold">{formatDay(booking.endDate)} · {booking.dropTime}</span>
                  <span className="block text-subtle">{hub.name}</span>
                  <span className="block text-subtle">Same hub as pickup</span>
                </dd>
              </div>
            </dl>
          </Card>

          <Card id="rider-title" title="Rider">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">Name</dt>
                <dd className="font-semibold">{booking.rider.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">Phone</dt>
                <dd className="tabular font-semibold">{booking.rider.phone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">Email</dt>
                <dd className="truncate font-semibold">{booking.rider.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-subtle">Licence</dt>
                <dd className="tabular font-semibold">{maskLicence(booking.licenceNumber)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <section aria-label="Payment" className="flex flex-col gap-3">
            <BookingSummary lines={quoteLines(booking.quote)} totalLabel="Total paid" />
            <div className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 text-sm">
              <ShieldCheckIcon size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Security deposit <StatusBadge tone="success" className="ml-1">Refundable</StatusBadge></p>
                <p className="text-subtle">{depositNote[booking.status]}</p>
              </div>
            </div>
            <p className="text-xs text-subtle">Paid with {booking.paymentMethod}.</p>
          </section>

          <section aria-label="Actions" className="flex flex-col gap-2">
            <Button
              variant="secondary"
              fullWidth
              onPress={() => toast.info("Support will join in a moment", { description: "Typical reply: under 2 minutes." })}
            >
              <ChatCircleDotsIcon size={20} />
              Chat with support
            </Button>
            <ButtonLink href="tel:+911800000000" variant="outline" fullWidth>
              <PhoneIcon size={20} />
              Call support
            </ButtonLink>
            {booking.status === "upcoming" ? (
              <Button variant="danger" fullWidth onPress={() => setConfirmOpen(true)}>
                Cancel booking
              </Button>
            ) : null}
          </section>
        </div>
      </div>

      <ModalDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel this booking?"
        footer={
          <>
            <Button variant="secondary" slot="close">
              Keep booking
            </Button>
            <Button
              variant="danger"
              slot="close"
              onPress={() => {
                cancelBooking(booking.reference);
                toast.danger("Booking cancelled", { description: "Your payment will be refunded." });
              }}
            >
              Cancel booking
            </Button>
          </>
        }
      >
        <p className="text-sm text-subtle">
          {bike.name}, {formatDay(booking.startDate, false)} to {formatDay(booking.endDate, false)}. Free cancellation applies up to 24 hours before pickup.
        </p>
      </ModalDialog>
    </div>
  );
}
