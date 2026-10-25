"use client";

import { CaretLeftIcon, CaretRightIcon, GaugeIcon, GasPumpIcon, StarIcon } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PriceDisplay } from "@/components/customer/price-display";
import { BikeImage } from "@/components/shared/bike-image";
import type { Motorcycle } from "@/features/customer/vehicles/lib/view-model";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type FeaturedBikeCarouselProps = {
  bikes: Motorcycle[];
  hrefFor?: (bike: Motorcycle) => string;
  className?: string;
  bleed?: boolean;
};

export function FeaturedBikeCarousel({ bikes, hrefFor = (bike) => `/bikes/${bike.id}`, className, bleed = false }: FeaturedBikeCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const t = useTranslations();

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setSnaps(emblaApi.scrollSnapList());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const initial = requestAnimationFrame(sync);
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      cancelAnimationFrame(initial);
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  return (
    <div
      role="region"
      aria-roledescription={t("common.carousel")}
      aria-label={t("home.featuredAria")}
      className={cn("flex flex-col gap-4", bleed && "-mx-(--page-padding)", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") emblaApi?.scrollPrev();
        if (event.key === "ArrowRight") emblaApi?.scrollNext();
      }}
    >
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className={cn("flex touch-pan-y", bleed ? "ml-[calc(var(--page-padding)-0.75rem)] pr-(--page-padding)" : "-ml-3")}>
            {bikes.map((bike, index) => (
              <div
                key={bike.id}
                role="group"
                aria-roledescription={t("common.slide")}
                aria-label={t("home.slideOf", { index: index + 1, total: bikes.length })}
                className="min-w-0 flex-[0_0_82%] pl-3 sm:flex-[0_0_46%] lg:flex-[0_0_32%]"
              >
                <article className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
                  <div
                    className="aspect-4/3 bg-canvas p-4"
                    style={{ background: `radial-gradient(70% 70% at 50% 60%, ${bike.color}2e, var(--color-canvas) 78%)` }}
                  >
                    <BikeImage bike={bike} sizes="(min-width: 1024px) 33vw, 82vw" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base leading-5 font-bold">{bike.name}</h3>
                      <span className="tabular flex shrink-0 items-center gap-1 text-xs font-medium text-subtle">
                        <StarIcon size={14} weight="fill" className="text-brand" />
                        {bike.rating.toFixed(1)}
                      </span>
                    </div>
                    <ul className="flex flex-wrap gap-2 text-xs text-ink">
                      <li className="flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1">
                        <GaugeIcon size={14} />
                        {bike.engineCc}cc
                      </li>
                      <li className="flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1">
                        <GasPumpIcon size={14} />
                        {bike.mileageKmpl} km/l
                      </li>
                    </ul>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                      <PriceDisplay amount={bike.pricePerDay} size="md" accent />
                      <Link
                        href={hrefFor(bike)}
                        className="flex h-11 items-center rounded-control bg-brand px-4 text-sm font-semibold text-ink outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.97] motion-reduce:transition-none"
                      >
                        {t("common.book")}
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label={t("home.previousBike")}
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
          className={cn(
            "absolute top-1/3 hidden size-11 items-center justify-center rounded-full border border-line bg-surface shadow-card transition-opacity disabled:pointer-events-none disabled:opacity-0 md:flex",
            bleed ? "left-(--page-padding)" : "-left-3",
          )}
        >
          <CaretLeftIcon size={20} />
        </button>
        <button
          type="button"
          aria-label={t("home.nextBike")}
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
          className={cn(
            "absolute top-1/3 hidden size-11 items-center justify-center rounded-full border border-line bg-surface shadow-card transition-opacity disabled:pointer-events-none disabled:opacity-0 md:flex",
            bleed ? "right-(--page-padding)" : "-right-3",
          )}
        >
          <CaretRightIcon size={20} />
        </button>
      </div>

      <div className="flex h-6 items-center justify-center gap-1.5" aria-hidden>
        {snaps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
              i === selected ? "w-5 bg-ink" : "w-1.5 bg-line",
            )}
          />
        ))}
      </div>
    </div>
  );
}
