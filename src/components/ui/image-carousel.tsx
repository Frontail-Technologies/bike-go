"use client";

import useEmblaCarousel from "embla-carousel-react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type ImageCarouselProps = {
  slides: React.ReactNode[];
  /** Accessible name, e.g. "Royal Enfield Classic 350 photos". */
  label: string;
  /** Tailwind aspect class. Slides always fill it without stretching. */
  aspectClassName?: string;
  showArrows?: boolean;
  className?: string;
  onIndexChange?: (index: number) => void;
  /** Controlled index, used by thumbnail strips. */
  index?: number;
};

export function ImageCarousel({
  slides,
  label,
  aspectClassName = "aspect-4/3",
  showArrows = true,
  className,
  onIndexChange,
  index,
}: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
  const [selected, setSelected] = useState(0);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    const next = emblaApi.selectedScrollSnap();
    setSelected(next);
    onIndexChange?.(next);
  }, [emblaApi, onIndexChange]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  useEffect(() => {
    if (emblaApi && index !== undefined && index !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, index]);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn("relative overflow-hidden rounded-card bg-surface-secondary", className)}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              className={cn("min-w-0 flex-[0_0_100%]", aspectClassName)}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {showArrows && slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={selected === 0}
            className="absolute top-1/2 left-2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-card transition-opacity disabled:opacity-0 md:flex"
          >
            <CaretLeftIcon size={20} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => emblaApi?.scrollNext()}
            disabled={selected === slides.length - 1}
            className="absolute top-1/2 right-2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-card transition-opacity disabled:opacity-0 md:flex"
          >
            <CaretRightIcon size={20} />
          </button>
        </>
      ) : null}

      {slides.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full bg-ink/30 transition-all duration-200",
                i === selected ? "w-5 bg-brand" : "w-1.5",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
