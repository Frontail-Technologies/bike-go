"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppBar } from "@/components/shared/app-bar";
import { Screen, ScreenFooter } from "@/components/shared/screen";
import { Spinner } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { useVehicleModelsQuery } from "@/features/customer/vehicles/hooks/use-vehicles";
import { useBack } from "@/hooks/use-back";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTranslations } from "@/i18n/hooks";
import { BikeFilters } from "./bike-filters";
import { modelListParams } from "../../lib/browse-params";
import { browseStore } from "../../stores/browse-store";
import { DEFAULT_FILTERS } from "../../lib/filters";
import type { VehicleFilterMasters } from "../../api/vehicle-filter-server-data";

export function FiltersScreen({ initialMasters }: { initialMasters: VehicleFilterMasters }) {
  const router = useRouter();
  const hasSidebar = useMediaQuery("(min-width: 1024px)");
  const back = useBack("/bikes");
  const t = useTranslations("browse");
  const common = useTranslations("common");
  const { filters, query, sort, dates } = browseStore.useValue();

  useEffect(() => {
    if (hasSidebar) router.replace("/bikes");
  }, [hasSidebar, router]);

  const vehicleParams = useMemo(() => modelListParams({ filters, query, sort, dates, page: 1, pageSize: 1 }), [dates, filters, query, sort]);
  const vehicles = useVehicleModelsQuery(vehicleParams);
  const count = vehicles.data?.meta.total ?? 0;
  const reset = () => browseStore.update((s) => ({ ...s, filters: { ...DEFAULT_FILTERS, category: "all" } }));

  return (
    <>
      <AppBar
        leading="back"
        backFallback="/bikes"
        title={t("filters")}
        actions={
          <Button variant="ghost" size="sm" onPress={reset}>
            {common("reset")}
          </Button>
        }
      />
      <Screen enter="slide" bottom="footer" className="md:max-w-3xl">
        <div className="mb-6 hidden items-center justify-between md:flex">
          <h1 className="text-2xl font-extrabold tracking-tight">{t("filters")}</h1>
          <Button variant="ghost" size="sm" onPress={reset}>
            {common("reset")}
          </Button>
        </div>
        <BikeFilters value={filters} onChange={(next) => browseStore.update((s) => ({ ...s, filters: next }))} initialMasters={initialMasters} />
      </Screen>
      <ScreenFooter>
        <Button size="lg" fullWidth isPending={vehicles.isPending} isDisabled={vehicles.isPending || count === 0} onPress={back}>
          {vehicles.isPending ? <Spinner color="current" size="sm" /> : null}
          {vehicles.isPending ? t("loading") : count === 0 ? t("noBikesMatch") : t("showBikes", { count })}
        </Button>
      </ScreenFooter>
    </>
  );
}
