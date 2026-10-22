"use client";

import { useState } from "react";
import { BikeImage } from "@/components/shared/bike-image";
import { ImageCarousel } from "@/components/ui/image-carousel";
import type { Motorcycle } from "@/features/mock/data";
import { cn } from "@/lib/cn";

type MotorcycleGalleryProps = {
  bike: Motorcycle;
  className?: string;
  /**
   * Phone hero: square corners and a taller frame so the image can run edge to edge (the parent must have no
   * horizontal padding). From 768px it is a normal rounded card again.
   */
  bleed?: boolean;
};

/** Swipeable gallery with a thumbnail strip. One slide per photo, or per colourway until photos exist. */
export function MotorcycleGallery({ bike, className, bleed = false }: MotorcycleGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = bike.images.length || bike.colorways.length;
  const slides = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ImageCarousel
        label={`${bike.name} photos`}
        index={index}
        onIndexChange={setIndex}
        className={bleed ? "max-md:rounded-none" : undefined}
        aspectClassName={bleed ? "max-md:aspect-[5/4] md:aspect-4/3" : undefined}
        slides={slides.map((i) => (
          <div key={i} className="flex size-full items-center justify-center bg-canvas p-4">
            <BikeImage bike={bike} index={i} sizes="(min-width: 1024px) 50vw, 100vw" priority={i === 0} />
          </div>
        ))}
      />
      <div
        className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-none", bleed && "max-md:px-page")}
        role="tablist"
        aria-label="Choose photo"
      >
        {slides.map((i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show photo ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "size-16 shrink-0 overflow-hidden rounded-control border-2 bg-canvas p-1 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ink",
              i === index ? "border-brand" : "border-transparent",
            )}
          >
            <BikeImage bike={bike} index={i} decorative sizes="64px" />
          </button>
        ))}
      </div>
    </div>
  );
}
