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
import { BlockSkeleton } from "@/components/ui/skeleton";
import { quoteLines } from "@/features/customer/bookings/lib/pricing";
import { duration, ease } from "@/design-system/motion";
import { useTranslations } from "@/i18n/hooks";
import { PaywayCheckout } from "@/features/customer/payments/components/payway-checkout";
import { formatDay } from "../lib/dates";
import { useBooking } from "../hooks/use-booking";

export function ConfirmationView({ reference }: { reference: string }) {
  const router = useRouter();
  const { data: found, isPending } = useBooking(reference);
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const goHome = () => router.replace("/");

  if (isPending) {
    return (
      <>
        <AppBar leading="back" onBack={goHome} />
        <Screen enter="slide" className="max-w-xl">
          <BlockSkeleton className="h-96 w-full" />
        </Screen>
      </>
    );
  }

  if (!found) {
    return (
      <>
        <AppBar leading="back" onBack={goHome} />
        <Screen enter="slide">
      <EmptyState
        icon={<MapPinIcon size={24} />}
        title={t("notFound")}
        action={<ButtonLink href="/bookings" variant="outline" size="sm">{t("myBookings")}</ButtonLink>}
      />
        </Screen>
      </>
    );
  }

  const { booking, bike } = found;

  return (
    <>
      <AppBar leading="back" onBack={goHome} />
      <Screen enter="slide" className="max-w-xl">
      <div className="flex w-full flex-col gap-5">
      <section aria-labelledby="done-title" className="flex flex-col items-center gap-3 pt-2 text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.reveal, ease }}
          className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground"
        >
          <CheckIcon size={32} weight="bold" />
        </motion.span>
        <h1 id="done-title" className="text-2xl font-extrabold tracking-tight">
          {t("confirmed")}
        </h1>
        <p className="text-sm text-subtle">
          {t("reference")} <span data-testid="booking-ref" className="tabular font-bold text-ink">{booking.reference}</span>
        </p>
      </section>

      <section aria-label={t("yourRide")} className="flex gap-3 rounded-card border border-line bg-surface p-3 shadow-card">
        <div className="size-20 shrink-0 overflow-hidden rounded-control bg-canvas">
          <BikeImage bike={bike} decorative sizes="80px" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <p className="truncate text-sm font-bold">{bike.name}</p>
          <p className="tabular text-xs text-subtle">
            {t("dateRange", { from: `${formatDay(booking.startDate, false)} ${booking.pickupTime}`, to: `${formatDay(booking.endDate, false)} ${booking.dropTime}` })}
          </p>
          <p className="text-xs text-subtle">
            {common("days", { count: booking.quote.days })}
          </p>
        </div>
      </section>

      <section aria-label={t("pickup")} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm">
        <p className="flex items-start gap-3">
          <MapPinIcon size={20} weight="fill" className="mt-0.5 shrink-0" />
          <span>
            <span className="block font-bold">{booking.pickupPlace.name}</span>
            <span className="block text-subtle">{booking.pickupPlace.address}</span>
          </span>
        </p>
        <p className="flex items-center gap-3 text-subtle">
          <ClockIcon size={20} className="shrink-0 text-ink" />
          {t("arriveEarly", { hours: "07:00–21:00 ICT" })}
        </p>
        <p className="flex items-center gap-3 text-subtle">
          <IdentificationCardIcon size={20} className="shrink-0 text-ink" />
          {t("bringLicence")}
        </p>
      </section>

      <BookingSummary lines={quoteLines(booking.quote)} totalLabel="totalPaid" totalAmount={booking.quote.payable} />
      {found.paymentStatus !== "paid" ? <PaywayCheckout reference={booking.reference} /> : null}

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/" variant="outline" size="lg">
          {t("backHome")}
        </ButtonLink>
        <ButtonLink href={`/bookings/${booking.reference}`} size="lg">
          {t("viewBooking")}
        </ButtonLink>
      </div>
      </div>
      </Screen>
    </>
  );
}
