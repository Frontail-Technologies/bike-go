"use client";

import { CaretLeftIcon, CaretRightIcon, GaugeIcon, GasPumpIcon, StarIcon } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PriceDisplay } from "@/components/customer/price-display";
import { BikeArt } from "@/components/shared/bike-art";
import type { Motorcycle } from "@/features/mock/data";
import { cn } from "@/lib/cn";

type FeaturedBikeCarouselProps = {
  bikes: Motorcycle[];
  /** Where each slide's call to action goes. */
  hrefFor?: (bike: Motorcycle) => string;
  className?: string;
};

/**
 * Swipeable showcase of featured bikes. Embla provides drag, momentum and snap;
 * slides are sized by breakpoint (peeking next card on phones) and the active
 * slide is emphasised on phones only. Artwork is `meet`-fitted, never stretched.
 */
export function FeaturedBikeCarousel({ bikes, hrefFor = () => "/bikes", className }: FeaturedBikeCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

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
      aria-roledescription="carousel"
      aria-label="Featured bikes"
      className={cn("flex flex-col gap-4", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") emblaApi?.scrollPrev();
        if (event.key === "ArrowRight") emblaApi?.scrollNext();
      }}
    >
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="-ml-3 flex touch-pan-y">
            {bikes.map((bike, index) => (
              <div
                key={bike.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${bikes.length}`}
                className="min-w-0 flex-[0_0_82%] pl-3 sm:flex-[0_0_46%] lg:flex-[0_0_32%]"
              >
                <article
                  className={cn(
                    "flex h-full flex-col overflow-hidden rounded-overlay bg-ink text-white",
                    "origin-center transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
                    index !== selected && "max-sm:scale-[0.96] max-sm:opacity-70",
                  )}
                >
                  <div
                    className="aspect-4/3 p-4"
                    style={{ background: `radial-gradient(70% 70% at 50% 60%, ${bike.color}33, transparent 75%)` }}
                  >
                    <BikeArt color={bike.color} title={bike.name} />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4 pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base leading-5 font-bold">{bike.name}</h3>
                      <span className="tabular flex shrink-0 items-center gap-1 text-xs font-medium text-white/75">
                        <StarIcon size={14} weight="fill" className="text-brand" />
                        {bike.rating.toFixed(1)}
                      </span>
                    </div>
                    <ul className="flex flex-wrap gap-2 text-xs text-white/75">
                      <li className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                        <GaugeIcon size={14} />
                        {bike.engineCc}cc
                      </li>
                      <li className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                        <GasPumpIcon size={14} />
                        {bike.mileageKmpl} km/l
                      </li>
                    </ul>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                      <PriceDisplay amount={bike.pricePerDay} size="md" className="[&_span:last-child]:text-white/60" />
                      <Link
                        href={hrefFor(bike)}
                        className="flex h-11 items-center rounded-control bg-brand px-4 text-sm font-semibold text-ink outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-white active:scale-[0.97] motion-reduce:transition-none"
                      >
                        Book
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
          aria-label="Previous bike"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
          className="absolute top-1/3 -left-3 hidden size-11 items-center justify-center rounded-full border border-line bg-surface shadow-card transition-opacity disabled:pointer-events-none disabled:opacity-0 md:flex"
        >
          <CaretLeftIcon size={20} />
        </button>
        <button
          type="button"
          aria-label="Next bike"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
          className="absolute top-1/3 -right-3 hidden size-11 items-center justify-center rounded-full border border-line bg-surface shadow-card transition-opacity disabled:pointer-events-none disabled:opacity-0 md:flex"
        >
          <CaretRightIcon size={20} />
        </button>
      </div>

      {/* Fixed height so the dots appearing after mount never shift the page. */}
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
