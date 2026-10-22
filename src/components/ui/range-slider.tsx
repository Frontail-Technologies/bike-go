"use client";

import { Label, Slider } from "@heroui/react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

type RangeSliderProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
};

/** Two-thumb INR range (HeroUI Slider). Shows the current range above the track. */
export function RangeSlider({ label, min, max, step = 100, value, onChange, className }: RangeSliderProps) {
  return (
    <Slider
      className={cn("w-full", className)}
      minValue={min}
      maxValue={max}
      step={step}
      value={value}
      onChange={(next) => Array.isArray(next) && onChange([next[0], next[1]])}
      formatOptions={{ style: "currency", currency: "INR", maximumFractionDigits: 0 }}
    >
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="tabular text-sm font-medium text-subtle" aria-live="polite">
          {formatPrice(value[0])} – {formatPrice(value[1])}
        </span>
      </div>
      <Slider.Track>
        {({ state }) => (
          <>
            <Slider.Fill />
            {state.values.map((_, i) => (
              <Slider.Thumb key={i} index={i} />
            ))}
          </>
        )}
      </Slider.Track>
    </Slider>
  );
}
