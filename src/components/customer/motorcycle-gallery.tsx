"use client";

import { useState } from "react";
import { BikeImage } from "@/components/shared/bike-image";
import { ImageCarousel } from "@/components/ui/image-carousel";
import type { Motorcycle } from "@/features/mock/data";
import { cn } from "@/lib/cn";

type MotorcycleGalleryProps = {
  bike: Motorcycle;
  className?: string;
  /** Overlay (back / favourite / share). Rendered on top of the main image. */
  overlay?: React.ReactNode;
};

/** Swipeable gallery with a thumbnail strip. One slide per photo, or per colourway until photos exist. */
export function MotorcycleGallery({ bike, className, overlay }: MotorcycleGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = bike.images.length || bike.colorways.length;
  const slides = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative">
        <ImageCarousel
          label={`${bike.name} photos`}
          index={index}
          onIndexChange={setIndex}
          slides={slides.map((i) => (
            <div key={i} className="flex size-full items-center justify-center bg-canvas p-4">
              <BikeImage bike={bike} index={i} sizes="(min-width: 1024px) 50vw, 100vw" priority={i === 0} />
            </div>
          ))}
        />
        {overlay}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Choose photo">
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
