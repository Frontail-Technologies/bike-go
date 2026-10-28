"use client";

import { ArrowCounterClockwiseIcon, ArrowRightIcon, BankIcon, BellIcon, HeadsetIcon, SealCheckIcon, TimerIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeaturedBikeCarousel, FeaturedBikeCarouselSkeleton } from "@/components/customer/featured-bike-carousel";
import { LocationPicker } from "@/components/customer/location-picker";
import { MotorcycleCard } from "@/components/customer/motorcycle-card";
import { RentalDatesButton } from "@/components/customer/rental-dates-button";
import { SectionHeading } from "@/components/customer/section-heading";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { Reveal } from "@/components/motion/reveal";
import { AppBar } from "@/components/shared/app-bar";
import { Screen } from "@/components/shared/screen";
import { IconButton } from "@/components/ui/button";
import { AppSearchField } from "@/components/ui/search-field";
import { BlockSkeleton, MotorcycleCardSkeleton } from "@/components/ui/skeleton";
import { vehicleToMotorcycle } from "@/features/customer/vehicles/lib/vehicle-mapper";
import { useCustomerSessionQuery } from "@/features/customer/auth/hooks/use-customer-session-query";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslations } from "@/i18n/hooks";
import { CategoryCircles } from "./category-circles";
import { HomeBanner, HomePromoBanner } from "./home-banner";
import { useHomeQuery } from "../hooks/use-home-query";
import type { HomeData } from "../types";

const benefits = [
  { Icon: SealCheckIcon, key: "verified" },
  { Icon: TimerIcon, key: "pickup" },
  { Icon: ArrowCounterClockwiseIcon, key: "deposit" },
  { Icon: HeadsetIcon, key: "support" },
] as const;

type HomeViewProps = {
  initialData: HomeData;
};

export function HomeView({ initialData }: HomeViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const t = useTranslations("home");
  const common = useTranslations("common");
  const auth = useTranslations("auth");
  const session = useCustomerSessionQuery();
  const home = useHomeQuery(initialData);
  const homeData = home.data;
  const popular = homeData.popularVehicles.map(vehicleToMotorcycle);
  const featured = popular.slice(0, 6);
  const isVehicleLoading = home.isLoading && !home.data;
  const popularGridColumns = popular.length === 6 ? "md:grid-cols-3 lg:grid-cols-3" : "md:grid-cols-4 lg:grid-cols-4";

  function search(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    router.push(qs ? `/bikes?${qs}` : "/bikes");
  }

  return (
    <>
      <AppBar leading="logo" actions={
          <>
            {!session.isPending && !session.data ? <Link href="/signin" className="flex h-10 items-center rounded-control bg-brand px-3 text-sm font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink">{auth("signIn")}</Link> : null}
            <LanguageSwitcher />
            <IconButton label={common("notifications")} icon={<BellIcon size={24} />} />
          </>
        } />
      <Screen bottom="nav" className="flex flex-col gap-6 md:gap-10">
      <div className="flex flex-col gap-4">
        <div className="lg:hidden">
          <LocationPicker variant="row" />
        </div>
        {home.isLoading ? <BlockSkeleton className="h-52 md:h-80 md:rounded-overlay" /> : null}
        {homeData.heroBanners[0] ? <Reveal y={8} blur={0}><HomeBanner banner={homeData.heroBanners[0]} /></Reveal> : null}
        <div className="flex gap-2">
          <AppSearchField
            value={query}
            onChange={setQuery}
            onSubmit={() => search(query.trim() ? { q: query.trim() } : {})}
            placeholder={t("searchPlaceholder")}
            iconClassName="text-brand!"
            className="flex-1"
          />
          <RentalDatesButton iconOnly triggerProps={{ className: "border border-line bg-surface" }} onChange={(start, end) => search({ start, end })} />
        </div>
      </div>

      <CategoryCircles onSelect={(category) => router.push(`/bikes?category=${encodeURIComponent(category === "sports" ? "sport" : category)}`)} />

      <section aria-labelledby="popular" className="flex flex-col gap-3">
        <SectionHeading id="popular" title={t("popular")} href="/bikes?sort=popular" />
        {isVehicleLoading ? (
          <div aria-busy="true" aria-label="Loading vehicles" className={`-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:gap-4 md:overflow-visible md:px-0 ${popularGridColumns}`}>
            {Array.from({ length: 4 }, (_, index) => <MotorcycleCardSkeleton key={index} className="w-[46%] shrink-0 snap-start sm:w-[36%] md:w-auto" />)}
          </div>
        ) : (
          <AnimatedGrid
            key="popular-vehicles"
            className={`-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:gap-4 md:overflow-visible md:px-0 ${popularGridColumns}`}
            itemClassName="w-[46%] shrink-0 snap-start sm:w-[36%] md:w-auto"
          >
            {popular.map((bike) => (
              <MotorcycleCard key={bike.id} bike={bike} />
            ))}
          </AnimatedGrid>
        )}
      </section>

      <Reveal>
        <Link
          href="/loans"
          className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.99] motion-reduce:transition-none"
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-control bg-brand-soft">
            <BankIcon size={28} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-bold">{t("loanTitle")}</span>
            <span className="text-sm text-subtle">{t("loanText")}</span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand">
            <ArrowRightIcon size={18} weight="bold" />
          </span>
        </Link>
      </Reveal>

      <Reveal>
        <section aria-labelledby="featured" className="flex flex-col gap-4">
          <SectionHeading id="featured" title={t("featured")} href="/bikes?sort=popular" />
          {isVehicleLoading ? <FeaturedBikeCarouselSkeleton bleed /> : <FeaturedBikeCarousel bikes={featured} bleed />}
        </section>
      </Reveal>

      {homeData.promoBanners[0] ? <Reveal><HomePromoBanner banner={homeData.promoBanners[0]} /></Reveal> : null}

      <Reveal>
        <section aria-label={t("whyAria")}>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {benefits.map(({ Icon, key }) => (
              <li key={key} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
                <span className="flex size-10 items-center justify-center rounded-control bg-brand-soft">
                  <Icon size={24} />
                </span>
                <p className="text-sm font-bold">{t(`${key}Title`)}</p>
                <p className="text-xs text-subtle">{t(`${key}Text`)}</p>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
      </Screen>
    </>
  );
}
