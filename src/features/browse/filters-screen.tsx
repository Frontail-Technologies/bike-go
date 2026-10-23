"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppBar } from "@/components/shared/app-bar";
import { Screen, ScreenFooter } from "@/components/shared/screen";
import { Button } from "@/components/ui/button";
import { motorcycles } from "@/features/mock/data";
import { useBack } from "@/hooks/use-back";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTranslations } from "@/i18n/hooks";
import { BikeFilters } from "./bike-filters";
import { browseStore } from "./browse-store";
import { DEFAULT_FILTERS, queryBikes } from "./filters";

/**
 * Full-screen filters (a pushed screen with back, Reset and a pinned "Show N bikes"). Changes apply to the
 * shared browse store immediately, so the count is always live and "Show" simply goes back. From 1024px
 * the sidebar on Bikes does this job, so wide screens are sent there; tablets have no sidebar and keep this page.
 */
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

  const count = useMemo(
    () => queryBikes(motorcycles, { filters, query, sort, start: dates?.start, end: dates?.end }).length,
    [filters, query, sort, dates],
  );
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
        {/* Tablets have the website header instead of the app bar, so the title and Reset sit on the page. */}
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
