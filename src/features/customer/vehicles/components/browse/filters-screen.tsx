"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppBar } from "@/components/shared/app-bar";
import { Screen, ScreenFooter } from "@/components/shared/screen";
import { Button } from "@/components/ui/button";
import { useVehiclesQuery } from "@/features/customer/vehicles/hooks/generated";
import { useBack } from "@/hooks/use-back";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTranslations } from "@/i18n/hooks";
import { cambodiaRentalRange } from "@/lib/cambodia-time";
import { BikeFilters } from "./bike-filters";
import { browseStore } from "../../stores/browse-store";
import { DEFAULT_FILTERS } from "../../lib/filters";

export function FiltersScreen() {
  const router = useRouter();
  const hasSidebar = useMediaQuery("(min-width: 1024px)");
  const back = useBack("/bikes");
  const t = useTranslations("browse");
  const common = useTranslations("common");
  const { filters, query, sort, dates } = browseStore.useValue();

  useEffect(() => {
    if (hasSidebar) router.replace("/bikes");
  }, [hasSidebar, router]);

  const vehicleParams = useMemo(() => ({
    page: 1,
    pageSize: 1,
    q: query.trim() || undefined,
    category: filters.category === "all" ? undefined : filters.category,
    brand: filters.brands.length ? filters.brands : undefined,
    transmission: filters.transmission.length ? filters.transmission : undefined,
    minPrice: filters.price[0] * 100,
    maxPrice: filters.price[1] * 100,
    minEngineCc: filters.engine[0] === "200-400" ? 200 : filters.engine[0] === "over-400" ? 401 : undefined,
    maxEngineCc: filters.engine[0] === "under-200" ? 199 : filters.engine[0] === "200-400" ? 400 : undefined,
    availableOnly: filters.availableOnly || Boolean(dates),
    ...(dates ? cambodiaRentalRange(dates.start, dates.end) : {}),
    sort: sort === "price-asc" ? "price_asc" as const : sort === "price-desc" ? "price_desc" as const : sort === "popular" ? "newest" as const : "name" as const,
  }), [dates, filters, query, sort]);
  const vehicles = useVehiclesQuery(vehicleParams);
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
        <BikeFilters value={filters} onChange={(next) => browseStore.update((s) => ({ ...s, filters: next }))} />
      </Screen>
      <ScreenFooter>
        <Button size="lg" fullWidth isDisabled={count === 0} onPress={back}>
          {count === 0 ? t("noBikesMatch") : t("showBikes", { count })}
        </Button>
      </ScreenFooter>
    </>
  );
}
