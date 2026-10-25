"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@heroui/react";
import { BookingSummary } from "@/components/customer/booking-summary";
import { LoadingRegion } from "@/components/ui/loading-region";
import { AppBar } from "@/components/shared/app-bar";
import { BikeImage } from "@/components/shared/bike-image";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { rentalDaysBetween } from "@/features/bookings/dates";
import { quoteLines, type Quote } from "@/features/bookings/pricing";
import { formatMoney } from "@/lib/format";
import { draftStore, justBookedStore } from "@/features/bookings/store";
import type { BookingDraft } from "@/features/bookings/types";
import type { Motorcycle } from "@/features/vehicles/view-model";
import type { Vehicle } from "@/features/vehicles/types";
import { useCustomerProfileQuery } from "@/features/profile/hooks/generated";
import { useBookingAddonsQuery, useCreateBookingMutation } from "@/features/bookings/hooks/generated";
import { useBookingQuoteQuery } from "@/features/bookings/hooks/use-booking-quote";
import { bookingQuoteToView } from "@/features/bookings/booking-mapper";
import { cambodiaRentalDateTime } from "@/lib/cambodia-time";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTranslations } from "@/i18n/hooks";
import { BookingProgress, flowSteps } from "./booking-progress";
import { FlowFooter } from "./flow-footer";
import { DatesStep, LicenceStep, PaymentStep, RiderStep, ReviewStep, licenceStepValid, riderStepValid } from "./steps";

const LAST_STEP = flowSteps.length;
const EMPTY_QUOTE: Quote = { days: 0, rental: 0, helmet: 0, jacket: 0, tax: 0, fee: 0, deposit: 0, payable: 0, taxRate: 0 };

const clampStep = (n: number) => Math.max(1, Math.min(LAST_STEP, Number.isFinite(n) ? n : 1));

export function BookingFlow({ bike, vehicle }: { bike: Motorcycle; vehicle: Vehicle }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const profile = useCustomerProfileQuery();
  const createBooking = useCreateBookingMutation();
  const addonsQuery = useBookingAddonsQuery();
  const stored = draftStore.useValue();
  const justBooked = justBookedStore.useValue();
  const [agreed, setAgreed] = useState(false);
  const [completing, setCompleting] = useState(false);
  const paid = useRef(false);

  const hasStored = stored?.bikeId === bike.id;
  const draft: BookingDraft = hasStored
    ? stored!
    : {
        bikeId: bike.id,
        start: params.get("start"),
        end: params.get("end"),
        pickupTime: params.get("pt") ?? "10:00 AM",
        dropTime: params.get("dt") ?? "10:00 AM",
        addOns: {},
        rider: { name: profile.data?.fullName ?? "", phone: profile.data?.phone ?? "", email: profile.data?.email ?? "" },
        licenceNumber: "",
        licenceLater: false,
        payment: "aba-khqr",
      };

  const patch = (partial: Partial<BookingDraft>) => draftStore.set({ ...draft, ...partial });
  const hasDates = Boolean(draft.start && draft.end);
  const days = hasDates ? rentalDaysBetween(draft.start!, draft.end!) : 0;
  const bookingRequest = useMemo(() => !hasDates ? null : ({
    vehicle: vehicle.slug,
    pickupLocationId: vehicle.location.id,
    returnLocationId: vehicle.location.id,
    pickupAt: cambodiaRentalDateTime(draft.start!, draft.pickupTime),
    returnAt: cambodiaRentalDateTime(draft.end!, draft.dropTime),
    addons: Object.entries(draft.addOns).filter(([, selected]) => selected).map(([code]) => ({ code, quantity: 1 })),
  }), [draft.addOns, draft.dropTime, draft.end, draft.pickupTime, draft.start, hasDates, vehicle.location.id, vehicle.slug]);
  const quoteQuery = useBookingQuoteQuery(bookingRequest);
  const quote = quoteQuery.data ? bookingQuoteToView(quoteQuery.data) : { ...EMPTY_QUOTE, days };
  const overlaps = quoteQuery.isError;

  const maxStep = !hasDates || overlaps || !hasStored ? 1 : !riderStepValid(draft) ? 2 : !licenceStepValid(draft) ? 3 : agreed ? LAST_STEP : 4;
  const requested = clampStep(Number(params.get("step") ?? 1));
  const step = Math.min(requested, maxStep);

  const withStep = (n: number) => {
    const qs = new URLSearchParams(params.toString());
    qs.set("step", String(n));
    return `?${qs}`;
  };

  const flowPath = `/bikes/${bike.id}/book`;
  useEffect(() => {
    if (pathname !== flowPath) paid.current = false;
  }, [pathname, flowPath]);

  useEffect(() => {
    if (!hydrated || pathname !== flowPath || paid.current || step === requested) return;
    if (!hasStored && justBooked) router.replace(`/bookings/${justBooked}`);
    else router.replace(withStep(step), { scroll: false });
  }, [hydrated, pathname, step, requested, hasStored, justBooked]);

  function go(next: number) {
    if (!hasStored) {
      draftStore.set(draft);
      justBookedStore.set(null);
    }
    router.push(withStep(next), { scroll: false });
  }

  async function pay() {
    if (!bookingRequest) return;
    const idempotencyKey = draft.idempotencyKey ?? crypto.randomUUID();
    if (!draft.idempotencyKey) patch({ idempotencyKey });
    try {
      const booking = await createBooking.mutateAsync({ input: bookingRequest, idempotencyKey });
      paid.current = true;
      setCompleting(true);
      draftStore.set(null);
      justBookedStore.set(booking.reference);
      router.replace(`/bookings/${booking.reference}/confirmation`);
    } catch {
      setCompleting(false);
    }
  }

  if (completing) {
    return (
      <LoadingRegion className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size="lg" />
      </LoadingRegion>
    );
  }

  const footer =
    step === 1 ? (
      <FlowFooter label={t("continue")} amount={quote.payable} onPress={() => go(2)} isDisabled={!hasDates || overlaps || quoteQuery.isPending} />
    ) : step === 2 ? (
      <FlowFooter label={t("continue")} amount={quote.payable} formId="rider-form" />
    ) : step === 3 ? (
      <FlowFooter
        label={t("continue")}
        amount={quote.payable}
        formId={draft.licenceLater ? undefined : "licence-form"}
        onPress={draft.licenceLater ? () => go(4) : undefined}
      />
    ) : step === 4 ? (
      <FlowFooter label={t("continueToPayment")} amount={quote.payable} onPress={() => go(5)} isDisabled={!agreed} />
    ) : (
      <FlowFooter label={`Create booking · ${formatMoney(quote.payable)}`} amount={quote.payable} onPress={() => void pay()} isPending={createBooking.isPending} isDisabled={!quoteQuery.data} />
    );

  return (
    <>
      <AppBar
        leading="back"
        backFallback={`/bikes/${bike.id}`}
        onBack={step > 1 ? () => router.back() : undefined}
        title={t("bookThisBike")}
        subtitle={bike.name}
      />

      <Screen enter="slide" bottom="footer" className="flex flex-col gap-5 lg:pb-12">
        <DesktopTitle title={t("bookNamed", { name: bike.name })} />
        <BookingProgress step={step - 1} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <section aria-label={t(flowSteps[step - 1]!)} className="min-w-0">
            <div key={step} className="rgo-page-in flex flex-col gap-5">
              {step === 1 ? (
                <>
                  <DatesStep bike={bike} draft={draft} patch={patch} addons={addonsQuery.data ?? []} addonsPending={addonsQuery.isPending} />
                  {overlaps ? (
                    <p className="text-sm text-danger" role="alert">
                      {t("conflict")}
                    </p>
                  ) : null}
                </>
              ) : null}
              {step === 2 ? <RiderStep formId="rider-form" draft={draft} patch={patch} onValid={() => go(3)} /> : null}
              {step === 3 ? <LicenceStep formId="licence-form" draft={draft} patch={patch} onValid={() => go(4)} /> : null}
              {step === 4 ? <ReviewStep bike={bike} draft={draft} quote={quote} agreed={agreed} onAgree={setAgreed} /> : null}
              {step === 5 ? <PaymentStep patch={patch} /> : null}
            </div>
            <div className="mt-6 hidden lg:block">{footer}</div>
          </section>

          <aside aria-label={t("priceSummary")} className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4">
              <div className="flex gap-3 rounded-card border border-line bg-surface p-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-control bg-canvas">
                  <BikeImage bike={bike} decorative sizes="64px" />
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="truncate text-sm font-bold">{bike.name}</p>
                  <p className="text-xs text-subtle">{hasDates ? common("days", { count: days }) : t("chooseDates")}</p>
                </div>
              </div>
              <BookingSummary lines={quoteLines(quote)} totalLabel="totalPayable" />
            </div>
          </aside>
        </div>
      </Screen>

      <div className="lg:hidden">{footer}</div>
    </>
  );
}
