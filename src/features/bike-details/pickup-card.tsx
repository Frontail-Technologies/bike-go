"use client";

import { ClockIcon, MapPinIcon } from "@phosphor-icons/react";
import { useTranslations } from "@/i18n/hooks";
import { cityStore } from "@/features/profile/store";

export function PickupCard() {
  const city = cityStore.useValue();
  const t = useTranslations("places");
  const bike = useTranslations("bike");

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
          <MapPinIcon size={20} weight="fill" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] leading-6 font-bold">{t(`hubs.${city}.name`)}</p>
          <p className="text-sm leading-6 text-ink/75">{t(`hubs.${city}.address`)}</p>
        </div>
      </div>
      <p className="flex items-start gap-2 border-t border-line pt-3 text-sm leading-6 text-ink/75">
        <ClockIcon size={20} className="mt-0.5 shrink-0 text-ink" />
        {bike("pickupOpen", { hours: t("hours") })}
      </p>
    </div>
  );
}
