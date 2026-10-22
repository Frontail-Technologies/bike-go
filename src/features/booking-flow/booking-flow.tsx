"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BookingSummary } from "@/components/customer/booking-summary";
import { BikeImage } from "@/components/shared/bike-image";
import { IconButton } from "@/components/ui/button";
import { rangeOverlapsBooking, rentalDaysBetween } from "@/features/bookings/dates";
import { getQuote, quoteLines } from "@/features/bookings/pricing";
import { addBooking, draftStore, newReference } from "@/features/bookings/store";
import type { BookingDraft } from "@/features/bookings/types";
import { cityStore, profileStore } from "@/features/profile/store";
import type { Motorcycle } from "@/features/mock/data";
import { BookingProgress, flowSteps } from "./booking-progress";
import { FlowFooter } from "./flow-footer";
import { DatesStep, LicenceStep, PaymentStep, RiderStep, ReviewStep, paymentMethods } from "./steps";

const PAY_DELAY_MS = 900;

export function BookingFlow({ bike }: { bike: Motorcycle }) {
  const router = useRouter();
  const params = useSearchParams();
  const profile = profileStore.useValue();
  const stored = draftStore.useValue();
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);

  // The draft lives in sessionStorage so a refresh keeps progress. With no draft for this
  // bike yet, derive one from the URL (dates passed from the details page) and the profile.
  const draft: BookingDraft =
    stored && stored.bikeId === bike.id
      ? stored
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
          payment: "upi",
          step: 0,
        };

  const patch = (partial: Partial<BookingDraft>) => draftStore.set({ ...draft, ...partial });
  const step = draft.step;
  const hasDates = Boolean(draft.start && draft.end);
  const overlaps = hasDates && rangeOverlapsBooking(bike, draft.start!, draft.end!);
  const days = hasDates ? rentalDaysBetween(draft.start!, draft.end!) : 0;
  const quote = getQuote(bike, Math.max(days, 1), draft.addOns);

  const go = (next: number) => patch({ step: Math.max(0, Math.min(flowSteps.length - 1, next)) });
  const back = () => (step === 0 ? router.back() : go(step - 1));

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
        paymentMethod: paymentMethods.find((m) => m.value === draft.payment)?.label ?? "UPI",
        createdAt: new Date().toISOString(),
      });
      draftStore.set(null);
      router.replace(`/bookings/${reference}/confirmation`);
    }, PAY_DELAY_MS);
  }

  const footer =
    step === 0 ? (
      <FlowFooter label="Continue" amount={quote.payable} onPress={() => go(1)} isDisabled={!hasDates || overlaps} />
    ) : step === 1 ? (
      <FlowFooter label="Continue" amount={quote.payable} formId="rider-form" />
    ) : step === 2 ? (
      <FlowFooter
        label="Continue"
        amount={quote.payable}
        formId={draft.licenceLater ? undefined : "licence-form"}
        onPress={draft.licenceLater ? () => go(3) : undefined}
      />
    ) : step === 3 ? (
      <FlowFooter label="Continue to payment" amount={quote.payable} onPress={() => go(4)} isDisabled={!agreed} />
    ) : (
      <FlowFooter label={`Pay ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(quote.payable)}`} amount={quote.payable} onPress={pay} isPending={paying} />
    );

  return (
    <div className="flex flex-col gap-5 pb-28 lg:pb-0">
      <div className="flex items-center gap-2">
        <IconButton label={step === 0 ? "Back to bike" : "Previous step"} icon={<ArrowLeftIcon size={20} />} variant="secondary" className="-ml-1" onPress={back} />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight">Book {bike.name}</h1>
        </div>
      </div>

      <BookingProgress step={step} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <section aria-label={flowSteps[step]} className="min-w-0">
          <div key={step} className="rgo-page-in flex flex-col gap-5">
            {step === 0 ? (
              <>
                <DatesStep bike={bike} draft={draft} patch={patch} />
                {overlaps ? <p className="text-sm text-danger" role="alert">This bike is booked for part of that range. Pick other dates.</p> : null}
              </>
            ) : null}
            {step === 1 ? <RiderStep formId="rider-form" draft={draft} patch={patch} onValid={() => go(2)} /> : null}
            {step === 2 ? <LicenceStep formId="licence-form" draft={draft} patch={patch} onValid={() => go(3)} /> : null}
            {step === 3 ? <ReviewStep bike={bike} draft={draft} quote={quote} agreed={agreed} onAgree={setAgreed} /> : null}
            {step === 4 ? <PaymentStep draft={draft} patch={patch} /> : null}
          </div>
          <div className="mt-6 hidden lg:block">{footer}</div>
        </section>

        <aside aria-label="Price summary" className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="flex gap-3 rounded-card border border-line bg-surface p-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-control bg-canvas">
                <BikeImage bike={bike} decorative sizes="64px" />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <p className="truncate text-sm font-bold">{bike.name}</p>
                <p className="text-xs text-subtle">{hasDates ? `${days} ${days === 1 ? "day" : "days"}` : "Choose dates"}</p>
              </div>
            </div>
            <BookingSummary lines={quoteLines(quote)} totalLabel="Total payable" />
          </div>
        </aside>
      </div>

      <div className="lg:hidden">{footer}</div>
    </div>
  );
}
