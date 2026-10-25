"use client";

import { ArrowCounterClockwiseIcon, ArrowRightIcon, BankIcon, BellIcon, HeadsetIcon, SealCheckIcon, TimerIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeaturedBikeCarousel } from "@/components/customer/featured-bike-carousel";
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
import type { BikeCategory } from "@/features/vehicles/view-model";
import { useVehiclesQuery } from "@/features/vehicles/hooks/generated";
import { vehicleToMotorcycle } from "@/features/vehicles/vehicle-mapper";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslations } from "@/i18n/hooks";
import { CategoryCircles } from "./category-circles";
import { HomeBanner } from "./home-banner";
import { useBannersQuery } from "./hooks/generated";

const benefits = [
  { Icon: SealCheckIcon, key: "verified" },
  { Icon: TimerIcon, key: "pickup" },
  { Icon: ArrowCounterClockwiseIcon, key: "deposit" },
  { Icon: HeadsetIcon, key: "support" },
] as const;

export function HomeView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BikeCategory | null>(null);
  const t = useTranslations("home");
  const common = useTranslations("common");
  const vehicles = useVehiclesQuery({ page: 1, pageSize: 8, category: category ?? undefined, sort: "newest" });
  const banners = useBannersQuery({ placement: "home_hero" });
  const popular = (vehicles.data?.data ?? []).map(vehicleToMotorcycle);
  const featured = popular.slice(0, 6);

  function search(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    router.push(qs ? `/bikes?${qs}` : "/bikes");
  }

  return (
    <>
      <AppBar leading="logo" actions={
          <>
            <LanguageSwitcher />
            <IconButton label={common("notifications")} icon={<BellIcon size={24} />} />
          </>
        } />
      <Screen bottom="nav" className="flex flex-col gap-6 md:gap-10">
      <div className="flex flex-col gap-4">
        <div className="lg:hidden">
          <LocationPicker variant="row" />
        </div>
        <Reveal y={8} blur={0}>
          <HomeBanner banner={banners.data?.[0]} />
        </Reveal>
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

      <CategoryCircles value={category} onChange={setCategory} />

      <section aria-labelledby="popular" className="flex flex-col gap-3">
        <SectionHeading id="popular" title={t("popular")} href={category ? `/bikes?category=${category}` : "/bikes"} />
        <AnimatedGrid
          key={category ?? "all"}
          className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4"
          itemClassName="w-[46%] shrink-0 snap-start sm:w-[36%] md:w-auto"
        >
          {popular.map((bike) => (
            <MotorcycleCard key={bike.id} bike={bike} />
          ))}
        </AnimatedGrid>
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
          <SectionHeading id="featured" title={t("featured")} href="/bikes" />
          <FeaturedBikeCarousel bikes={featured} bleed />
        </section>
      </Reveal>

      <Reveal>
        <section aria-label={t("offerAria")} className="relative isolate flex items-center justify-start gap-4 overflow-hidden min-h-36 rounded-overlay bg-brand p-5 text-ink md:min-h-52 md:p-10">
          <Image src="/hero/offer-banner.jpg" alt="" fill sizes="(min-width: 1280px) 1216px, 100vw" className="-z-10 object-cover object-left md:object-right" />
          <div>
            <p className="text-lg font-extrabold md:text-3xl">{t("offerTitle")}</p>
            <p className="text-sm text-ink/75 md:mt-1 md:text-base">{t("offerText")}</p>
          </div>
          <Link
            href="/bikes"
            className="flex h-11 shrink-0 items-center rounded-control bg-ink px-4 text-sm md:h-12 md:px-6 md:text-base font-semibold text-white outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 active:scale-[0.97] motion-reduce:transition-none"
          >
            {common("browse")}
          </Link>
        </section>
      </Reveal>

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
