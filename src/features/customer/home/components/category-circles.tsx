"use client";

import { LightningIcon, MotorcycleIcon, MountainsIcon, RoadHorizonIcon } from "@phosphor-icons/react";
import type { BikeCategory } from "@/features/customer/vehicles/lib/view-model";
import { useTranslations } from "@/i18n/hooks";

const items = [
  { id: "adventure", Icon: MountainsIcon },
  { id: "cruiser", Icon: MotorcycleIcon },
  { id: "sports", Icon: LightningIcon },
  { id: "touring", Icon: RoadHorizonIcon },
] satisfies { id: BikeCategory; Icon: typeof MotorcycleIcon }[];

type CategoryCirclesProps = {
  onSelect: (value: BikeCategory) => void;
};

export function CategoryCircles({ onSelect }: CategoryCirclesProps) {
  const t = useTranslations("home");

  return (
    <div role="group" aria-label={t("categoryAria")} className="mx-auto grid w-full max-w-md grid-cols-4 gap-2">
        {items.map(({ id, Icon }) => {
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="group flex min-h-11 flex-col items-center gap-2 rounded-card py-1 outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span className="relative isolate flex size-16 items-center justify-center rounded-full bg-brand-soft transition-transform duration-150 group-active:scale-95 motion-reduce:transition-none">
                <Icon size={28} />
              </span>
              <span className="text-xs font-medium">{t(id)}</span>
            </button>
          );
        })}
    </div>
  );
}
