"use client";

import { HeartIcon } from "@phosphor-icons/react";
import { MotorcycleCard } from "@/components/customer/motorcycle-card";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { MotorcycleCardSkeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/i18n/hooks";
import { favoritesStore } from "@/features/customer/profile/stores/preferences-store";
import { useVehiclesQuery } from "../../hooks/use-vehicles";
import { vehicleToMotorcycle } from "../../lib/vehicle-mapper";

/**
 * Saved vehicles are a local preference until the customer API exposes a
 * favourite resource. Vehicle details themselves always come from the API.
 */
export function SavedBikesView() {
  const t = useTranslations("browse");
  const favoriteIds = favoritesStore.useValue();
  const vehicles = useVehiclesQuery({ page: 1, pageSize: 100, sort: "newest" });
  const savedBikes = (vehicles.data?.data ?? [])
    .map(vehicleToMotorcycle)
    .filter((vehicle) => favoriteIds.includes(vehicle.id));

  return (
    <>
      <AppBar title={t("saved")} leading="back" backFallback="/profile" />
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title={t("saved")} />

        {vehicles.isPending ? (
          <div aria-busy="true" aria-label="Loading saved bikes" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {Array.from({ length: 6 }, (_, index) => <MotorcycleCardSkeleton key={index} />)}
          </div>
        ) : savedBikes.length ? (
          <AnimatedGrid className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {savedBikes.map((bike) => <MotorcycleCard key={bike.id} bike={bike} />)}
          </AnimatedGrid>
        ) : (
          <EmptyState
            icon={<HeartIcon size={24} weight="regular" />}
            title={t("saved")}
            action={<ButtonLink href="/bikes" variant="outline" size="sm">Browse bikes</ButtonLink>}
          />
        )}
      </Screen>
    </>
  );
}
