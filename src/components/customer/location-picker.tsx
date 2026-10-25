"use client";

import { CaretDownIcon, MapPinIcon } from "@phosphor-icons/react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { RadioGroup } from "@/components/ui/selection-controls";
import { cityStore } from "@/features/customer/profile/stores/preferences-store";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";
import { useLocationsQuery } from "@/features/customer/locations/hooks/use-locations";

type LocationPickerProps = {
  variant?: "header" | "row";
  className?: string;
};

export function LocationPicker({ variant = "header", className }: LocationPickerProps) {
  const city = cityStore.useValue();
  const t = useTranslations("places");
  const locations = useLocationsQuery({});
  const selected = locations.data?.find((location) => location.city === city) ?? locations.data?.[0];
  const label = selected?.city ?? city;
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
        onChange={(value) => cityStore.set(value)}
        options={(locations.data ?? []).map((location) => ({ value: location.city, label: `${location.city} — ${location.name}` }))}
      />
    </ResponsiveOverlay>
  );
}
