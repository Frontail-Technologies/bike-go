"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookingSummary } from "@/components/customer/booking-summary";
import { AppBar } from "@/components/shared/app-bar";
import { BikeImage } from "@/components/shared/bike-image";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { rangeOverlapsBooking, rentalDaysBetween } from "@/features/bookings/dates";
import { getQuote, quoteLines } from "@/features/bookings/pricing";
import { formatMoney } from "@/lib/format";
import { addBooking, draftStore, justBookedStore, newReference } from "@/features/bookings/store";
import type { BookingDraft } from "@/features/bookings/types";
import { cityStore, profileStore } from "@/features/profile/store";
import type { Motorcycle } from "@/features/mock/data";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTranslations } from "@/i18n/hooks";
import { BookingProgress, flowSteps } from "./booking-progress";
import { FlowFooter } from "./flow-footer";
import { DatesStep, LicenceStep, PaymentStep, RiderStep, ReviewStep, licenceStepValid, paymentMethods, riderStepValid } from "./steps";

const PAY_DELAY_MS = 900;
const LAST_STEP = flowSteps.length;

const clampStep = (n: number) => Math.max(1, Math.min(LAST_STEP, Number.isFinite(n) ? n : 1));

export function BookingFlow({ bike }: { bike: Motorcycle }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const profile = profileStore.useValue();
  const stored = draftStore.useValue();
  const justBooked = justBookedStore.useValue();
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
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
        addOns: { helmet: false, jacket: false },
        rider: { name: profile.name, phone: profile.phone, email: profile.email },
        licenceNumber: profile.licence?.number ?? "",
        licenceLater: false,
        payment: "aba-khqr",
      };

  const patch = (partial: Partial<BookingDraft>) => draftStore.set({ ...draft, ...partial });
  const hasDates = Boolean(draft.start && draft.end);
  const overlaps = hasDates && rangeOverlapsBooking(bike, draft.start!, draft.end!);
  const days = hasDates ? rentalDaysBetween(draft.start!, draft.end!) : 0;
  const quote = getQuote(bike, Math.max(days, 1), draft.addOns);

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

  function pay() {
    setPaying(true);
    window.setTimeout(() => {
      const reference = newReference();
      addBooking({
        reference,
        bikeId: bike.id,
        status: "upcoming",
        startDate: draft.start!,
        endDate: draft.end!,
        pickupTime: draft.pickupTime,
        dropTime: draft.dropTime,
        city: cityStore.get(),
        addOns: draft.addOns,
        quote: getQuote(bike, days, draft.addOns),
        rider: draft.rider,
        licenceNumber: draft.licenceLater ? null : draft.licenceNumber,
        paymentMethod: paymentMethods.find((m) => m.value === draft.payment)?.label ?? "ABA KHQR",
        createdAt: new Date().toISOString(),
      });
      paid.current = true;
      draftStore.set(null);
      justBookedStore.set(reference);
      router.replace(`/bookings/${reference}/confirmation`);
    }, PAY_DELAY_MS);
  }

  const footer =
    step === 1 ? (
      <FlowFooter label={t("continue")} amount={quote.payable} onPress={() => go(2)} isDisabled={!hasDates || overlaps} />
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
      <FlowFooter label={t("pay", { amount: formatMoney(quote.payable) })} amount={quote.payable} onPress={pay} isPending={paying} />
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
                  <DatesStep bike={bike} draft={draft} patch={patch} />
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
