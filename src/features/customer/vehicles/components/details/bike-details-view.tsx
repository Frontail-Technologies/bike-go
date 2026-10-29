"use client";

import { CalendarBlankIcon, CaretRightIcon, CheckIcon, HeartIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookingSummary } from "@/components/customer/booking-summary";
import { MotorcycleGallery } from "@/components/customer/motorcycle-gallery";
import { PriceDisplay } from "@/components/customer/price-display";
import { RentalDateSelector, type RentalSelection, rentalDays } from "@/components/customer/rental-date-selector";
import { SpecTiles } from "@/components/customer/spec-tiles";
import { StickyBookingBar } from "@/components/customer/sticky-booking-bar";
import { Reveal } from "@/components/motion/reveal";
import { AppBar } from "@/components/shared/app-bar";
import { Screen } from "@/components/shared/screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button, IconButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast";
import { formatDay, formatRange, toISO, toRange } from "@/features/customer/bookings/lib/dates";
import { useBookingQuoteQuery } from "@/features/customer/bookings/hooks/use-booking-quote";
import { bookingQuoteToView } from "@/features/customer/bookings/lib/booking-mapper";
import { quoteLines } from "@/features/customer/bookings/lib/pricing";
import { draftStore, justBookedStore } from "@/features/customer/bookings/stores/booking-draft-store";
import { useRequireSignIn } from "@/features/customer/auth/components/sign-in-prompt";
import type { Motorcycle } from "@/features/customer/vehicles/lib/view-model";
import { favoritesStore, toggleFavorite } from "@/features/customer/profile/stores/preferences-store";
import { useTranslations } from "@/i18n/hooks";
import { formatMoney } from "@/lib/format";
import { cambodiaRentalDateTime } from "@/lib/date";
import { PickupCard } from "./pickup-card";
import { RentalTerms } from "./rental-terms";
import type { VehicleLocation } from "@/features/customer/vehicles/types";

function DetailSection({ id, title, className, children }: { id: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="mb-3 text-lg leading-7 font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BikeDetailsView({ bike, location }: { bike: Motorcycle; location?: VehicleLocation }) {
  const router = useRouter();
  const requireSignIn = useRequireSignIn();
  const params = useSearchParams();
  const favorite = favoritesStore.useValue().includes(bike.id);
  const t = useTranslations("bike");
  const common = useTranslations("common");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [solidBar, setSolidBar] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<RentalSelection>({
    range: toRange(params.get("start") ?? undefined, params.get("end") ?? undefined),
    pickupTime: params.get("pt") ?? "10:00 AM",
    dropTime: params.get("dt") ?? "10:00 AM",
  });

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setSolidBar(!entry.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const range = selection.range;
  const days = rentalDays(range);
  const quoteRequest = useMemo(() => range && location ? {
    vehicle: bike.id,
    pickupLocationId: location.id,
    returnLocationId: location.id,
    pickupAt: cambodiaRentalDateTime(toISO(range.start), selection.pickupTime),
    returnAt: cambodiaRentalDateTime(toISO(range.end), selection.dropTime),
  } : null, [bike.id, location, range, selection.dropTime, selection.pickupTime]);
  const quoteQuery = useBookingQuoteQuery(quoteRequest);
  const quote = quoteQuery.data ? bookingQuoteToView(quoteQuery.data) : null;
  const dateLabel = range ? formatRange(toISO(range.start), toISO(range.end)) : null;

  function goBook() {
    if (!range) {
      setSheetOpen(true);
      return;
    }
    draftStore.set(null);
    justBookedStore.set(null);
    const qs = new URLSearchParams({
      start: toISO(range.start),
      end: toISO(range.end),
      pt: selection.pickupTime,
      dt: selection.dropTime,
    });
    const target = `/bikes/${bike.id}/book?${qs}`;
    if (!requireSignIn(target)) return;
    router.push(target);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: bike.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("linkCopied"));
      }
    } catch {
    }
  }

  const saveButton = (className?: string) => (
    <IconButton
      label={favorite ? t("removeSaved") : t("saveBike")}
      aria-pressed={favorite}
      icon={<HeartIcon size={24} weight={favorite ? "fill" : "regular"} className={favorite ? "text-danger" : undefined} />}
      className={className}
      onPress={() => toggleFavorite(bike.id)}
    />
  );
  const shareButton = (className?: string) => (
    <IconButton label={t("share")} icon={<ShareNetworkIcon size={24} />} className={className} onPress={share} />
  );

  const selector = <RentalDateSelector value={selection} onChange={setSelection} />;

  const summary = quote ? (
    <BookingSummary lines={quoteLines(quote)} totalLabel="totalPayable" totalAmount={quote.payable} />
  ) : (
    <p className="rounded-control bg-surface-secondary px-4 py-3 text-sm text-subtle">{t("selectToSeeTotal")}</p>
  );

  const overHeroButton = "bg-surface/90 shadow-card backdrop-blur-sm";

  return (
    <>
      <AppBar
        floating
        solid={solidBar}
        leading="back"
        backFallback="/bikes"
        title={bike.name}
        titleAs="p"
        actions={
          <>
            {saveButton(solidBar ? undefined : overHeroButton)}
            {shareButton(solidBar ? undefined : overHeroButton)}
          </>
        }
      />

      <Screen enter="slide" bottom="footer" className="flex flex-col gap-4 max-md:px-0! max-md:pt-0 md:pb-28 lg:pb-12">
        <div className="hidden md:block">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bikes", href: "/bikes" }, { label: bike.name }]} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-6">
            <div ref={heroRef}>
              <MotorcycleGallery bike={bike} bleed />
            </div>

            <div className="flex flex-col gap-8 max-md:px-page">
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
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <PriceDisplay amount={bike.pricePerDay} size="lg" />
                        <div className="hidden gap-2 md:flex">
                          {saveButton("border border-line")}
                          {shareButton("border border-line")}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {bike.available ? (
                        <StatusBadge tone="success">{t("available")}</StatusBadge>
                      ) : (
                        <StatusBadge tone="danger">{bike.availableFrom ? t("onRentBack", { date: formatDay(bike.availableFrom, false) }) : t("onRent")}</StatusBadge>
                      )}
                    </div>
                  </div>
                  <SpecTiles bike={bike} />
                </section>
              </Reveal>

              <DetailSection id="dates-title" title={t("rentalDates")} className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-card border border-line bg-surface px-4 text-left outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.99] motion-reduce:transition-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
                    <CalendarBlankIcon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{dateLabel ?? t("selectDates")}</span>
                    <span className="block text-xs text-subtle">
                      {range ? t("daysPickup", { days: common("days", { count: days }), time: selection.pickupTime }) : t("seeAvailability")}
                    </span>
                  </span>
                  <CaretRightIcon size={20} className="shrink-0 text-subtle" />
                </button>
                <div className="mt-3">{summary}</div>
              </DetailSection>

              <DetailSection id="about-title" title={t("about")}>
                <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
                  <p className="text-[15px] leading-7 text-ink/80">{bike.description}</p>
                  <ul className="flex flex-col gap-3 border-t border-line pt-4">
                    {bike.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-3 text-sm leading-6 font-medium">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
                          <CheckIcon size={12} weight="bold" />
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </DetailSection>

              <DetailSection id="pickup-title" title={t("pickupLocation")}>
                <PickupCard location={location} />
              </DetailSection>

              <DetailSection id="terms-title" title={t("rentalTerms")}>
                <RentalTerms />
              </DetailSection>
            </div>
          </div>

          <aside aria-label={t("bookAria")} className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
              <div className="flex items-baseline justify-between">
                <PriceDisplay amount={bike.pricePerDay} size="lg" />
                <span className="text-xs text-subtle">{t("freeCancel")}</span>
              </div>
              {selector}
              {summary}
              <Button size="lg" fullWidth onPress={goBook} isDisabled={!range}>
                {t("bookNow")}
              </Button>
            </div>
          </aside>
        </div>
      </Screen>

      <BottomSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        title={t("selectDatesTitle")}
        footer={
          <Button slot="close" fullWidth isDisabled={!range}>
            {range ? t("confirmDays", { days: common("days", { count: days }) }) : t("selectDatesButton")}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {selector}
          {quote ? (
            <p className="tabular text-center text-sm text-subtle">
              {t("totalPayableInline", { amount: formatMoney(quote.payable) })}
            </p>
          ) : null}
        </div>
      </BottomSheet>

      <StickyBookingBar className="lg:hidden" amount={bike.pricePerDay} label={range ? t("bookNow") : t("selectDatesButton")} onPress={goBook} />
    </>
  );
}
