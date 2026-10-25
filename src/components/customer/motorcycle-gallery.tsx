"use client";

import { useState } from "react";
import { BikeImage } from "@/components/shared/bike-image";
import { ImageCarousel } from "@/components/ui/image-carousel";
import type { Motorcycle } from "@/features/vehicles/view-model";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type MotorcycleGalleryProps = {
  bike: Motorcycle;
  className?: string;
  bleed?: boolean;
};

export function MotorcycleGallery({ bike, className, bleed = false }: MotorcycleGalleryProps) {
  const [index, setIndex] = useState(0);
  const t = useTranslations("bike");
  const count = bike.images.length || bike.colorways.length;
  const slides = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ImageCarousel
        label={t("photosAria", { name: bike.name })}
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
        aria-label={t("choosePhoto")}
      >
        {slides.map((i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={t("showPhoto", { n: i + 1 })}
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
