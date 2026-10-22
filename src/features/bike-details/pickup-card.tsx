"use client";

import { ClockIcon, MapPinIcon } from "@phosphor-icons/react";
import { pickupHubs } from "@/features/mock/data";
import { cityStore } from "@/features/profile/store";

/** Pickup hub for the city chosen in the header. */
export function PickupCard() {
  const city = cityStore.useValue();
  const hub = pickupHubs[city];

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft">
          <MapPinIcon size={20} weight="fill" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{hub.name}</p>
          <p className="text-sm text-subtle">{hub.address}</p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm text-subtle">
        <ClockIcon size={20} className="shrink-0 text-ink" />
        Open {hub.hours}. Change your city on the home screen.
      </p>
    </div>
  );
}
