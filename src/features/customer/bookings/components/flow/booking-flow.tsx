"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BookingSummary } from "@/components/customer/booking-summary";
import { BrandLoader } from "@/components/customer/brand-loader";
import { AppBar } from "@/components/shared/app-bar";
import { BikeImage } from "@/components/shared/bike-image";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { LoadingRegion } from "@/components/ui/loading-region";
import { toast } from "@/components/ui/toast";
import { useBookingQuoteQuery } from "@/features/customer/bookings/hooks/use-booking-quote";
import { useBookingAddonsQuery, useCreateBookingMutation } from "@/features/customer/bookings/hooks/use-bookings";
import { bookingQuoteToView } from "@/features/customer/bookings/lib/booking-mapper";
import { rentalDaysBetween } from "@/features/customer/bookings/lib/dates";
import { quoteLines, type Quote } from "@/features/customer/bookings/lib/pricing";
import { draftStore, justBookedStore } from "@/features/customer/bookings/stores/booking-draft-store";
import type { BookingDraft } from "@/features/customer/bookings/types";
import { showBrowserNotification } from "@/features/customer/notifications/lib/browser-notifications";
import { useCustomerProfileQuery, useUpdateCustomerProfileMutation } from "@/features/customer/profile/hooks/use-profile";
import { profileStore } from "@/features/customer/profile/stores/preferences-store";
import type { Motorcycle } from "@/features/customer/vehicles/lib/view-model";
import type { Vehicle } from "@/features/customer/vehicles/types";
import { useTranslations } from "@/i18n/hooks";
import { cambodiaRentalDateTime } from "@/lib/cambodia-time";
import { LicenceNote, RiderDetails, TripSection, type RiderValues } from "./checkout-sections";
import { FlowFooter } from "./flow-footer";

export type BookingTarget =
  | { kind: "vehicle"; vehicle: Vehicle }
  | { kind: "group"; group: { brand: string; model: string; locationId: string } };

const EMPTY_QUOTE: Quote = { days: 0, rental: 0, helmet: 0, jacket: 0, tax: 0, fee: 0, deposit: 0, payable: 0, taxRate: 0 };
const CHECKOUT_FORM = "checkout-form";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function BookingFlow({ bike, target, detailsHref }: { bike: Motorcycle; target: BookingTarget; detailsHref: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const profile = useCustomerProfileQuery();
  const updateProfile = useUpdateCustomerProfileMutation();
  const createBooking = useCreateBookingMutation();
  const addonsQuery = useBookingAddonsQuery();
  const stored = draftStore.useValue();
  const [completing, setCompleting] = useState(false);

  const draft: BookingDraft = stored?.bikeId === bike.id
    ? stored
    : {
        bikeId: bike.id,
        start: params.get("start"),
        end: params.get("end"),
        pickupTime: params.get("pt") ?? "10:00 AM",
        dropTime: params.get("dt") ?? "10:00 AM",
        addOns: {},
      };
  const patch = (partial: Partial<BookingDraft>) => draftStore.set({ ...draft, ...partial });

  const hasDates = Boolean(draft.start && draft.end);
  const days = hasDates ? rentalDaysBetween(draft.start!, draft.end!) : 0;
  const locationId = target.kind === "vehicle" ? target.vehicle.location.id : target.group.locationId;
  const bookingRequest = useMemo(() => !hasDates ? null : ({
    ...(target.kind === "vehicle" ? { vehicle: target.vehicle.slug } : { group: target.group }),
    pickupLocationId: locationId,
    returnLocationId: locationId,
    pickupAt: cambodiaRentalDateTime(draft.start!, draft.pickupTime),
    returnAt: cambodiaRentalDateTime(draft.end!, draft.dropTime),
    addons: Object.entries(draft.addOns).filter(([, selected]) => selected).map(([code]) => ({ code, quantity: 1 })),
  }), [draft.addOns, draft.dropTime, draft.end, draft.pickupTime, draft.start, hasDates, locationId, target]);
  const quoteQuery = useBookingQuoteQuery(bookingRequest);
  const quote = quoteQuery.data ? bookingQuoteToView(quoteQuery.data) : { ...EMPTY_QUOTE, days };
  const overlaps = quoteQuery.isError;

  const rider: RiderValues = { name: profile.data?.fullName ?? "", phone: profile.data?.phone ?? "" };

  async function confirm(values: RiderValues) {
    if (!bookingRequest) return;
    const idempotencyKey = draft.idempotencyKey ?? crypto.randomUUID();
    if (!draft.idempotencyKey) patch({ idempotencyKey });
    try {
      if (values.name.trim() !== rider.name.trim() || values.phone.trim() !== rider.phone.trim()) {
        await updateProfile.mutateAsync({ input: { fullName: values.name.trim(), phone: values.phone.trim() } });
      }
      const booking = await createBooking.mutateAsync({ input: bookingRequest, idempotencyKey });
      if (profileStore.get().notifications.reminders) {
        void showBrowserNotification("Booking created", { body: `${bike.name} · ${booking.reference}`, tag: `booking-${booking.reference}`, data: { url: `/bookings/${booking.reference}` } });
      }
      setCompleting(true);
      draftStore.set(null);
      justBookedStore.set(booking.reference);
      router.replace(`/bookings/${booking.reference}/confirmation`);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "The booking could not be created.");
    }
  }

  if (completing) {
    return (
      <LoadingRegion className="flex min-h-[60dvh] items-center justify-center">
        <BrandLoader className="min-h-0" />
      </LoadingRegion>
    );
  }

  const footer = (
    <FlowFooter
      label={t("confirmBooking")}
      amount={quote.payable}
      formId={CHECKOUT_FORM}
      isPending={createBooking.isPending || updateProfile.isPending}
      isDisabled={!hasDates || overlaps || !quoteQuery.data || profile.isPending}
    />
  );

  const bikeCard = (
    <div className="flex gap-3 rounded-card border border-line bg-surface p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-control bg-canvas">
        <BikeImage bike={bike} decorative sizes="64px" />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <p className="truncate text-sm font-bold">{bike.name}</p>
        <p className="text-xs text-subtle">{hasDates ? common("days", { count: days }) : t("chooseDates")}</p>
      </div>
    </div>
  );

  return (
    <>
      <AppBar leading="back" backFallback={detailsHref} title={t("bookThisBike")} subtitle={bike.name} />

      <Screen enter="slide" bottom="footer" className="flex flex-col gap-5 lg:pb-12">
        <DesktopTitle title={t("bookNamed", { name: bike.name })} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-6">
            <div className="lg:hidden">{bikeCard}</div>

            <Section title={t("sectionTrip")}>
              <TripSection draft={draft} patch={patch} addons={addonsQuery.data ?? []} addonsPending={addonsQuery.isPending} />
              {overlaps ? <p className="text-sm text-danger" role="alert">{t("conflict")}</p> : null}
            </Section>

            <Section title={t("sectionDetails")}>
              {profile.isPending ? null : <RiderDetails formId={CHECKOUT_FORM} initial={rider} onSubmit={(values) => void confirm(values)} />}
            </Section>

            <Section title={t("reviewLicence")}>
              <LicenceNote licence={profile.data?.licence ?? null} />
            </Section>

            <div className="lg:hidden">
              <BookingSummary lines={quoteLines(quote)} totalLabel="totalPayable" totalAmount={quote.payable} />
            </div>

            <p className="text-xs text-subtle">{t("termsNote")}</p>
            <div className="hidden lg:block">{footer}</div>
          </div>

          <aside aria-label={t("priceSummary")} className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4">
              {bikeCard}
              <BookingSummary lines={quoteLines(quote)} totalLabel="totalPayable" totalAmount={quote.payable} />
            </div>
          </aside>
        </div>
      </Screen>

      <div className="lg:hidden">{footer}</div>
    </>
  );
}
