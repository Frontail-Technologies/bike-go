"use client";

import { ArrowLeftIcon, CalendarBlankIcon, CaretRightIcon, HeartIcon, ShareNetworkIcon, StarIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BookingSummary } from "@/components/customer/booking-summary";
import { MotorcycleGallery } from "@/components/customer/motorcycle-gallery";
import { PriceDisplay } from "@/components/customer/price-display";
import { RentalDateSelector, type RentalSelection, rentalDays } from "@/components/customer/rental-date-selector";
import { SpecTiles } from "@/components/customer/spec-tiles";
import { StickyBookingBar } from "@/components/customer/sticky-booking-bar";
import { Reveal } from "@/components/motion/reveal";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button, IconButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast";
import { formatRange, isBooked, toISO, toRange } from "@/features/bookings/dates";
import { getQuote, quoteLines } from "@/features/bookings/pricing";
import { draftStore } from "@/features/bookings/store";
import type { Motorcycle } from "@/features/mock/data";
import { favoritesStore, toggleFavorite } from "@/features/profile/store";
import { formatDay } from "@/features/bookings/dates";
import { PickupCard } from "./pickup-card";
import { RentalTerms } from "./rental-terms";

export function BikeDetailsView({ bike }: { bike: Motorcycle }) {
  const router = useRouter();
  const params = useSearchParams();
  const favorite = favoritesStore.useValue().includes(bike.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selection, setSelection] = useState<RentalSelection>({
    range: toRange(params.get("start") ?? undefined, params.get("end") ?? undefined),
    pickupTime: params.get("pt") ?? "10:00 AM",
    dropTime: params.get("dt") ?? "10:00 AM",
  });

  const range = selection.range;
  const days = rentalDays(range);
  const quote = range ? getQuote(bike, days, { helmet: false, jacket: false }) : null;
  const dateLabel = range ? formatRange(toISO(range.start), toISO(range.end)) : null;

  function goBook() {
    if (!range) {
      setSheetOpen(true);
      return;
    }
    draftStore.set(null); // start every booking from the dates chosen here
    const qs = new URLSearchParams({
      start: toISO(range.start),
      end: toISO(range.end),
      pt: selection.pickupTime,
      dt: selection.dropTime,
    });
    router.push(`/bikes/${bike.id}/book?${qs}`);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: bike.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* dismissed share sheet or blocked clipboard: nothing to report */
    }
  }

  const selector = (
    <RentalDateSelector
      value={selection}
      onChange={setSelection}
      isDateUnavailable={(date) => isBooked(bike, date)}
    />
  );

  const summary = quote ? (
    <BookingSummary lines={quoteLines(quote)} totalLabel="Total payable" />
  ) : (
    <p className="rounded-control bg-surface-secondary px-4 py-3 text-sm text-subtle">Select dates to see your total.</p>
  );

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-0">
      <div className="hidden md:block">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bikes", href: "/bikes" }, { label: bike.name }]} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <MotorcycleGallery
            bike={bike}
            overlay={
              <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between">
                <IconButton
                  label="Go back"
                  icon={<ArrowLeftIcon size={20} />}
                  className="pointer-events-auto bg-surface/90 backdrop-blur-sm md:hidden"
                  onPress={() => router.back()}
                />
                <span className="hidden md:block" />
                <div className="pointer-events-auto flex gap-2">
                  <IconButton
                    label={favorite ? "Remove from saved" : "Save bike"}
                    aria-pressed={favorite}
                    icon={<HeartIcon size={20} weight={favorite ? "fill" : "regular"} className={favorite ? "text-danger" : undefined} />}
                    className="bg-surface/90 backdrop-blur-sm"
                    onPress={() => toggleFavorite(bike.id)}
                  />
                  <IconButton label="Share" icon={<ShareNetworkIcon size={20} />} className="bg-surface/90 backdrop-blur-sm" onPress={share} />
                </div>
              </div>
            }
          />

          <Reveal y={8} blur={0}>
            <section aria-labelledby="bike-title" className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 id="bike-title" className="text-xl leading-tight font-extrabold tracking-tight md:text-2xl">
                      {bike.name}
                    </h1>
                    <p className="text-sm text-subtle">{bike.model}</p>
                  </div>
                  <PriceDisplay amount={bike.pricePerDay} size="lg" className="shrink-0" />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="tabular flex items-center gap-1 font-semibold">
                    <StarIcon size={16} weight="fill" className="text-brand" />
                    {bike.rating.toFixed(1)}
                    <span className="font-normal text-subtle">({bike.reviews} reviews)</span>
                  </span>
                  {bike.available ? (
                    <StatusBadge tone="success">Available</StatusBadge>
                  ) : (
                    <StatusBadge tone="danger">On rent{bike.availableFrom ? ` · back ${formatDay(bike.availableFrom, false)}` : ""}</StatusBadge>
                  )}
                </div>
              </div>
              <SpecTiles bike={bike} />
            </section>
          </Reveal>

          {/* Dates and total stay high on the page for mobile; desktop shows them in the side panel. */}
          <section aria-labelledby="dates-title" className="flex flex-col gap-3 lg:hidden">
            <h2 id="dates-title" className="text-base font-bold">
              Rental dates
            </h2>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface px-4 text-left outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.99] motion-reduce:transition-none"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
                <CalendarBlankIcon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{dateLabel ?? "Select pickup and drop dates"}</span>
                <span className="block text-xs text-subtle">
                  {range ? `${days} ${days === 1 ? "day" : "days"} · ${selection.pickupTime} pickup` : "See availability and your total"}
                </span>
              </span>
              <CaretRightIcon size={20} className="shrink-0 text-subtle" />
            </button>
            {summary}
          </section>

          <section aria-labelledby="about-title">
            <h2 id="about-title" className="mb-2 text-base font-bold">
              About this bike
            </h2>
            <p className="text-sm text-subtle">{bike.description}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {bike.highlights.map((h) => (
                <li key={h} className="rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-medium">
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pickup-title">
            <h2 id="pickup-title" className="mb-3 text-base font-bold">
              Pickup location
            </h2>
            <PickupCard />
          </section>

          <section aria-labelledby="terms-title">
            <h2 id="terms-title" className="mb-3 text-base font-bold">
              Rental terms
            </h2>
            <RentalTerms />
          </section>
        </div>

        <aside aria-label="Book this bike" className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="flex items-baseline justify-between">
              <PriceDisplay amount={bike.pricePerDay} size="lg" />
              <span className="text-xs text-subtle">Free cancellation 24h before</span>
            </div>
            {selector}
            {summary}
            <Button size="lg" fullWidth onPress={goBook} isDisabled={!range}>
              Book now
            </Button>
          </div>
        </aside>
      </div>

      <BottomSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Select dates"
        footer={
          <Button slot="close" fullWidth isDisabled={!range}>
            {range ? `Confirm ${days} ${days === 1 ? "day" : "days"}` : "Select dates"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {selector}
          {quote ? <p className="tabular text-center text-sm text-subtle">Total payable {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(quote.payable)}</p> : null}
        </div>
      </BottomSheet>

      <StickyBookingBar
        className="lg:hidden"
        amount={bike.pricePerDay}
        label={range ? "Book now" : "Select dates"}
        onPress={goBook}
      />
    </div>
  );
}
