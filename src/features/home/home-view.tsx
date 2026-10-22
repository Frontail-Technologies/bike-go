"use client";

import { ArrowCounterClockwiseIcon, HeadsetIcon, SealCheckIcon, TimerIcon } from "@phosphor-icons/react";
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
import { AppSearchField } from "@/components/ui/search-field";
import { type BikeCategory, motorcycles } from "@/features/mock/data";
import { CategoryCircles } from "./category-circles";
import { HomeBanner } from "./home-banner";

const featured = [...motorcycles].sort((a, b) => b.rating - a.rating).slice(0, 6);

const benefits = [
  { Icon: SealCheckIcon, title: "Verified bikes", text: "Serviced before every ride" },
  { Icon: TimerIcon, title: "Flexible pickup", text: "7 AM to 9 PM, 3 cities" },
  { Icon: ArrowCounterClockwiseIcon, title: "Refundable deposit", text: "Back within 48 hours" },
  { Icon: HeadsetIcon, title: "24/7 support", text: "Chat or call anytime" },
];

export function HomeView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BikeCategory | null>(null);

  const popular = motorcycles
    .filter((bike) => !category || bike.category === category)
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 8);

  function search(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    router.push(qs ? `/bikes?${qs}` : "/bikes");
  }

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      {/* Top of the screen follows the reference: city, banner, search, categories, popular bikes. */}
      <div className="flex flex-col gap-4">
        <div className="lg:hidden">
          <LocationPicker variant="row" />
        </div>
        <Reveal y={8} blur={0}>
          <HomeBanner />
        </Reveal>
        <div className="flex gap-2">
          <AppSearchField
            value={query}
            onChange={setQuery}
            onSubmit={() => search(query.trim() ? { q: query.trim() } : {})}
            placeholder="Search bikes or brands"
            iconClassName="text-brand!"
            groupClassName="border-transparent bg-surface-secondary shadow-none"
            className="flex-1"
          />
          <RentalDatesButton iconOnly onChange={(start, end) => search({ start, end })} />
        </div>
      </div>

      <CategoryCircles value={category} onChange={setCategory} />

      <section aria-labelledby="popular" className="flex flex-col gap-3">
        <SectionHeading id="popular" title="Popular Bikes" href={category ? `/bikes?category=${category}` : "/bikes"} />
        {/* A sideways scroller on phones (next card peeks in); a regular grid from 768px. */}
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
        <section aria-labelledby="featured" className="flex flex-col gap-4">
          <SectionHeading id="featured" title="Featured" href="/bikes" />
          <FeaturedBikeCarousel bikes={featured} bleed />
        </section>
      </Reveal>

      <Reveal>
        <section aria-label="Offer" className="flex items-center justify-between gap-4 rounded-overlay bg-brand p-5 text-ink md:p-6">
          <div>
            <p className="text-lg font-extrabold">Free helmet on 3+ days</p>
            <p className="text-sm text-ink/75">Applied automatically at checkout.</p>
          </div>
          <Link
            href="/bikes"
            className="flex h-11 shrink-0 items-center rounded-control bg-ink px-4 text-sm font-semibold text-white outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 active:scale-[0.97] motion-reduce:transition-none"
          >
            Browse
          </Link>
        </section>
      </Reveal>

      <Reveal>
        <section aria-label="Why RideGo">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {benefits.map(({ Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
                <span className="flex size-10 items-center justify-center rounded-control bg-brand-soft">
                  <Icon size={24} />
                </span>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-subtle">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}
