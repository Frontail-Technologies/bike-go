"use client";

import { LightningIcon, MotorcycleIcon, MountainsIcon, RoadHorizonIcon } from "@phosphor-icons/react";
import { AnimatedSelection, SelectionIndicator } from "@/components/motion/animated-selection";
import type { BikeCategory } from "@/features/customer/vehicles/lib/view-model";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

const items = [
  { id: "adventure", Icon: MountainsIcon },
  { id: "cruiser", Icon: MotorcycleIcon },
  { id: "sports", Icon: LightningIcon },
  { id: "touring", Icon: RoadHorizonIcon },
] satisfies { id: BikeCategory; Icon: typeof MotorcycleIcon }[];

type CategoryCirclesProps = {
  value: BikeCategory | null;
  onChange: (value: BikeCategory | null) => void;
};

export function CategoryCircles({ value, onChange }: CategoryCirclesProps) {
  const t = useTranslations("home");

  return (
    <AnimatedSelection>
      <div role="group" aria-label={t("categoryAria")} className="mx-auto grid w-full max-w-md grid-cols-4 gap-2">
        {items.map(({ id, Icon }) => {
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
              <span className={cn("text-xs", selected ? "font-bold" : "font-medium")}>{t(id)}</span>
            </button>
          );
        })}
      </div>
    </AnimatedSelection>
  );
}
