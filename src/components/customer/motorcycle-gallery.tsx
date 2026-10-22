"use client";

import { useState } from "react";
import { BikeArt } from "@/components/shared/bike-art";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { cn } from "@/lib/cn";

type MotorcycleGalleryProps = {
  name: string;
  /** One colourway per slide until real photography exists. */
  colors: string[];
  className?: string;
};

export function MotorcycleGallery({ name, colors, className }: MotorcycleGalleryProps) {
  const [index, setIndex] = useState(0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ImageCarousel
        label={`${name} photos`}
        index={index}
        onIndexChange={setIndex}
        slides={colors.map((color, i) => (
          <div key={color} className="flex size-full items-center justify-center bg-canvas p-4">
            <BikeArt color={color} title={`${name}, view ${i + 1}`} />
          </div>
        ))}
      />
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Choose photo">
        {colors.map((color, i) => (
          <button
            key={color}
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
            <BikeArt color={color} />
          </button>
        ))}
      </div>
    </div>
  );
}
