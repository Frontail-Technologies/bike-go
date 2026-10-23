"use client";

import { CaretDownIcon, MapPinIcon } from "@phosphor-icons/react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { RadioGroup } from "@/components/ui/selection-controls";
import { type City, cities } from "@/features/mock/data";
import { cityStore } from "@/features/profile/store";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type LocationPickerProps = {
  /** "header" is a compact ghost button; "row" is the full-width field under the Home header. */
  variant?: "header" | "row";
  className?: string;
};

/** Pickup city. Sheet on mobile, popover on desktop. Every bike can be collected from any hub. */
export function LocationPicker({ variant = "header", className }: LocationPickerProps) {
  const city = cityStore.useValue();
  const t = useTranslations("places");
  const label = t("cityLabel", { city: t(`cities.${city}`) });
  const row = variant === "row";

  return (
    <ResponsiveOverlay
      title={t("pickupCity")}
      triggerProps={{
        variant: row ? "secondary" : "ghost",
        size: "sm",
        fullWidth: row,
        className: cn(
          row ? "justify-start gap-2 border border-line bg-surface px-3 font-medium" : "max-w-[11rem] gap-1 px-2",
          className,
        ),
        "aria-label": t("pickupCityAria", { label }),
      }}
      triggerLabel={
        <>
          <MapPinIcon size={20} weight="fill" className="shrink-0" />
          <span className={cn("truncate", row && "flex-1 text-left text-sm")}>{label}</span>
          <CaretDownIcon size={16} className="shrink-0" />
        </>
      }
    >
      <RadioGroup
        label={t("chooseHub")}
        value={city}
        onChange={(value) => cityStore.set(value as City)}
        options={cities.map((c) => ({ value: c, label: t("hubOption", { city: t(`cities.${c}`), hub: t(`hubs.${c}.name`) }) }))}
      />
    </ResponsiveOverlay>
  );
}
