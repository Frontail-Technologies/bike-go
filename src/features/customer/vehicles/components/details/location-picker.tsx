"use client";

import { CheckCircleIcon, MapPinIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/i18n/hooks";
import type { MotorcycleGroupLocation } from "../../lib/view-model";

export function LocationPicker({
  locations,
  value,
  onChange,
}: {
  locations: MotorcycleGroupLocation[];
  value: string | null;
  onChange: (locationId: string) => void;
}) {
  const t = useTranslations("bike");

  return (
    <div role="radiogroup" aria-label={t("pickupLocation")} className="flex flex-col gap-2">
      {locations.map((location) => {
        const disabled = location.availableCount <= 0;
        const selected = value === location.locationId;
        return (
          <button
            key={location.locationId}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(location.locationId)}
            className={cn(
              "flex items-center gap-3 rounded-card border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink",
              selected ? "border-ink bg-brand-soft" : "border-line bg-surface",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-secondary">
              <MapPinIcon size={20} weight={selected ? "fill" : "regular"} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{location.name}</span>
              <span className="block text-xs text-subtle">{location.city}</span>
            </span>
            <span className={cn("shrink-0 text-xs font-semibold", disabled ? "text-subtle" : "text-ink")}>
              {disabled ? t("soldOut") : t("unitsAvailable", { count: location.availableCount })}
            </span>
            {selected ? <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-ink" /> : null}
          </button>
        );
      })}
    </div>
  );
}
