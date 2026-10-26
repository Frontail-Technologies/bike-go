"use client";

import { ChatCircleDotsIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { BookingStatusBadge } from "@/components/customer/booking-status-badge";
import { BookingSummary } from "@/components/customer/booking-summary";
import { BikeImage } from "@/components/shared/bike-image";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast";
import { Reveal } from "@/components/motion/reveal";
import { useTranslations } from "@/i18n/hooks";
import { quoteLines } from "@/features/customer/bookings/lib/pricing";
import { BookingTimeline } from "./booking-timeline";
import { formatDay } from "../lib/dates";
import type { CustomerBooking } from "../types";
import { maskLicence, useBooking } from "../hooks/use-booking";
import { useCancelBookingMutation } from "../hooks/use-bookings";
import { useCustomerProfileQuery } from "@/features/customer/profile/hooks/use-profile";

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

type T = ReturnType<typeof useTranslations<"booking">>;

function statusHeadline(b: CustomerBooking, hubName: string, t: T) {
  switch (b.status) {
    case "upcoming":
      return t("headlineUpcoming", { date: formatDay(b.startDate, false), time: b.pickupTime, hub: hubName });
    case "ongoing":
      return t("headlineOngoing", { date: formatDay(b.endDate, false), time: b.dropTime });
    case "completed":
      return t("headlineCompleted");
    case "cancelled":
      return t("headlineCancelled");
  }
}

const depositNote = {
  upcoming: "depositUpcoming",
  ongoing: "depositOngoing",
  completed: "depositCompleted",
  cancelled: "depositCancelled",
} as const;

export function BookingDetailsView({ reference }: { reference: string }) {
  const found = useBooking(reference);
  const t = useTranslations("booking");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancel = useCancelBookingMutation();
  const profile = useCustomerProfileQuery();

  if (!found) {
    return (
      <>
        <AppBar leading="back" backFallback="/bookings" title={t("details")} />
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

  const { bike } = found;
  const booking = { ...found.booking, rider: { name: profile.data?.fullName ?? "", phone: profile.data?.phone ?? "", email: profile.data?.email ?? "" } };
  const hub = { name: found.booking.city, address: "RideGo pickup location" };

  return (
    <>
      <AppBar leading="back" backFallback="/bookings" title={t("details")} subtitle={<span className="tabular">{booking.reference}</span>} />
      <Screen enter="slide" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title={t("details")} subtitle={<span className="tabular">{booking.reference}</span>} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <Reveal y={8} blur={0}>
            <section aria-label={t("statusAria")} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <BookingStatusBadge status={booking.status} />
                <span className="tabular text-xs text-subtle">{t("booked", { date: formatDay(booking.createdAt.slice(0, 10)) })}</span>
              </div>
              <p className="text-sm font-semibold" data-testid="status-message">{statusHeadline(booking, hub.name, t)}</p>
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

          <Card id="timeline-title" title={t("progress")}>
            <BookingTimeline booking={booking} />
          </Card>

          <Card id="trip-title" title={t("pickupAndReturn")}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-subtle uppercase">{t("pickup")}</dt>
                <dd className="mt-1 text-sm">
                  <span className="tabular block font-bold">{formatDay(booking.startDate)} · {booking.pickupTime}</span>
                  <span className="block text-subtle">{hub.name}</span>
                  <span className="block text-subtle">{hub.address}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-subtle uppercase">{t("return")}</dt>
                <dd className="mt-1 text-sm">
                  <span className="tabular block font-bold">{formatDay(booking.endDate)} · {booking.dropTime}</span>
                  <span className="block text-subtle">{hub.name}</span>
                  <span className="block text-subtle">{t("sameHub")}</span>
                </dd>
              </div>
            </dl>
          </Card>

          <Card id="rider-title" title={t("rider")}>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">{t("name")}</dt>
                <dd className="font-semibold">{booking.rider.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">{t("phone")}</dt>
                <dd className="tabular font-semibold">{booking.rider.phone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-subtle">{t("email")}</dt>
                <dd className="truncate font-semibold">{booking.rider.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-subtle">{t("licence")}</dt>
                <dd className="tabular font-semibold">{maskLicence(booking.licenceNumber, t("showAtPickup"))}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <section aria-label={t("paymentAria")} className="flex flex-col gap-3">
            <BookingSummary lines={quoteLines(booking.quote)} totalLabel="totalPaid" />
            <div className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 text-sm">
              <ShieldCheckIcon size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">{t("securityDeposit")} <StatusBadge tone="success" className="ml-1">{t("refundable")}</StatusBadge></p>
                <p className="text-subtle">{t(depositNote[booking.status])}</p>
              </div>
            </div>
            <p className="text-xs text-subtle">{t("paidWith", { method: booking.paymentMethod })}</p>
          </section>

          <section aria-label={t("actionsAria")} className="flex flex-col gap-2">
            <Button
              variant="secondary"
              fullWidth
              onPress={() => toast.info(t("supportToast"), { description: t("supportToastDesc") })}
            >
              <ChatCircleDotsIcon size={20} />
              {t("chatSupport")}
            </Button>
            <ButtonLink href="tel:+911800000000" variant="outline" fullWidth>
              <PhoneIcon size={20} />
              {t("callSupport")}
            </ButtonLink>
            {booking.status === "upcoming" ? (
              <Button variant="danger" fullWidth onPress={() => setConfirmOpen(true)}>
                {t("cancelBooking")}
              </Button>
            ) : null}
          </section>
        </div>
      </div>

      <ModalDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("cancelTitle")}
        footer={
          <>
            <Button variant="secondary" slot="close">
              {t("keepBooking")}
            </Button>
            <Button
              variant="danger"
              slot="close"
              onPress={() => {
                void cancel.mutateAsync({ reference: booking.reference, input: {} }).then(() => {
                  toast.danger(t("cancelledToast"), { description: t("cancelledToastDesc") });
                }).catch((error) => toast.danger(error instanceof Error ? error.message : "The booking could not be cancelled."));
              }}
            >
              {t("cancelBooking")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-subtle">
          {t("cancelBody", { bike: bike.name, from: formatDay(booking.startDate, false), to: formatDay(booking.endDate, false) })}
        </p>
      </ModalDialog>
      </Screen>
    </>
  );
}
