"use client";

import { CheckIcon, ClockIcon, IdentificationCardIcon, MapPinIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { BookingSummary } from "@/components/customer/booking-summary";
import { AppBar } from "@/components/shared/app-bar";
import { BikeImage } from "@/components/shared/bike-image";
import { Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { type City, pickupHubs } from "@/features/mock/data";
import { quoteLines } from "@/features/bookings/pricing";
import { duration, ease } from "@/design-system/motion";
import { formatDay } from "./dates";
import { useBooking } from "./use-booking";

export function ConfirmationView({ reference }: { reference: string }) {
  const router = useRouter();
  const found = useBooking(reference);
  // The flow is finished: Back goes Home rather than into the payment steps.
  const goHome = () => router.replace("/");

  if (!found) {
    return (
      <>
        <AppBar leading="back" onBack={goHome} />
        <Screen enter="slide">
      <EmptyState
        icon={<MapPinIcon size={24} />}
        title="Booking not found"
        description="This confirmation is no longer available on this device."
        action={<ButtonLink href="/bookings" size="sm">My bookings</ButtonLink>}
      />
        </Screen>
      </>
    );
  }

  const { booking, bike } = found;
  const hub = pickupHubs[(booking.city as City) in pickupHubs ? (booking.city as City) : "Jaipur"];

  return (
    <>
      <AppBar leading="back" onBack={goHome} />
      <Screen enter="slide" className="max-w-xl">
      <div className="flex w-full flex-col gap-5">
      <section aria-labelledby="done-title" className="flex flex-col items-center gap-3 pt-2 text-center">
        {/* One short scale-in. Collapses to a plain fade under reduced motion. */}
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.reveal, ease }}
          className="flex size-16 items-center justify-center rounded-full bg-brand text-ink"
        >
          <CheckIcon size={32} weight="bold" />
        </motion.span>
        <h1 id="done-title" className="text-2xl font-extrabold tracking-tight">
          Booking confirmed
        </h1>
        <p className="text-sm text-subtle">
          Reference <span data-testid="booking-ref" className="tabular font-bold text-ink">{booking.reference}</span>
        </p>
      </section>

      <section aria-label="Your ride" className="flex gap-3 rounded-card border border-line bg-surface p-3 shadow-card">
        <div className="size-20 shrink-0 overflow-hidden rounded-control bg-canvas">
          <BikeImage bike={bike} decorative sizes="80px" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <p className="truncate text-sm font-bold">{bike.name}</p>
          <p className="tabular text-xs text-subtle">
            {formatDay(booking.startDate, false)} {booking.pickupTime} to {formatDay(booking.endDate, false)} {booking.dropTime}
          </p>
          <p className="text-xs text-subtle">
            {booking.quote.days} {booking.quote.days === 1 ? "day" : "days"}
          </p>
        </div>
      </section>

      <section aria-label="Pickup" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm">
        <p className="flex items-start gap-3">
          <MapPinIcon size={20} weight="fill" className="mt-0.5 shrink-0" />
          <span>
            <span className="block font-bold">{hub.name}</span>
            <span className="block text-subtle">{hub.address}</span>
          </span>
        </p>
        <p className="flex items-center gap-3 text-subtle">
          <ClockIcon size={20} className="shrink-0 text-ink" />
          Arrive 15 minutes early. Open {hub.hours}.
        </p>
        <p className="flex items-center gap-3 text-subtle">
          <IdentificationCardIcon size={20} className="shrink-0 text-ink" />
          Bring your original driving licence.
        </p>
      </section>

      <BookingSummary lines={quoteLines(booking.quote)} totalLabel="Total paid" />

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/" variant="outline" size="lg">
          Back home
        </ButtonLink>
        <ButtonLink href={`/bookings/${booking.reference}`} size="lg">
          View booking
        </ButtonLink>
      </div>
      </div>
      </Screen>
    </>
  );
}
