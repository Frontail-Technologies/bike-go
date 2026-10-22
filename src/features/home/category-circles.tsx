"use client";

import { LightningIcon, MotorcycleIcon, MountainsIcon, RoadHorizonIcon } from "@phosphor-icons/react";
import { AnimatedSelection, SelectionIndicator } from "@/components/motion/animated-selection";
import type { BikeCategory } from "@/features/mock/data";
import { cn } from "@/lib/cn";

const items = [
  { id: "adventure", label: "Adventure", Icon: MountainsIcon },
  { id: "cruiser", label: "Cruiser", Icon: MotorcycleIcon },
  { id: "sports", label: "Sports", Icon: LightningIcon },
  { id: "touring", label: "Touring", Icon: RoadHorizonIcon },
] satisfies { id: BikeCategory; label: string; Icon: typeof MotorcycleIcon }[];

type CategoryCirclesProps = {
  /** Selected category, or null for all bikes. Pressing the selected one again clears it. */
  value: BikeCategory | null;
  onChange: (value: BikeCategory | null) => void;
};

/** Round category buttons (reference: Adventure, Cruiser, Sports, Touring). The yellow fill slides between them. */
export function CategoryCircles({ value, onChange }: CategoryCirclesProps) {
  return (
    <AnimatedSelection>
      <div role="group" aria-label="Bike category" className="mx-auto grid w-full max-w-md grid-cols-4 gap-2">
        {items.map(({ id, label, Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : id)}
              className="group flex min-h-11 flex-col items-center gap-2 rounded-card py-1 outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span
                className={cn(
                  "relative isolate flex size-16 items-center justify-center rounded-full bg-brand-soft",
                  "transition-transform duration-150 group-active:scale-95 motion-reduce:transition-none",
                )}
              >
                {selected ? <SelectionIndicator className="bg-brand" /> : null}
                <Icon size={28} weight={selected ? "fill" : "regular"} />
              </span>
              <span className={cn("text-xs", selected ? "font-bold" : "font-medium")}>{label}</span>
            </button>
          );
        })}
      </div>
    </AnimatedSelection>
  );
}
