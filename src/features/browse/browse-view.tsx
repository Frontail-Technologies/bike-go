"use client";

import { FunnelIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { MotorcycleCard } from "@/components/customer/motorcycle-card";
import { RentalDatesButton } from "@/components/customer/rental-dates-button";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { Button, IconButton } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { AppSearchField } from "@/components/ui/search-field";
import { MotorcycleCardSkeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useTranslations } from "@/i18n/hooks";
import { favoritesStore } from "@/features/profile/store";
import { useVehiclesQuery } from "@/features/vehicles/hooks/generated";
import { vehicleToMotorcycle } from "@/features/vehicles/vehicle-mapper";
import { useMasterItemsQuery } from "@/features/master-data/hooks/generated";
import { cambodiaRentalRange } from "@/lib/cambodia-time";
import { BikeFilters } from "./bike-filters";
import { DEFAULT_BROWSE, browseStore } from "./browse-store";
import { DEFAULT_FILTERS, activeFilterCount } from "./filters";
import { SearchDialog } from "./search-dialog";
import { SortControl } from "./sort-control";

const gridClass = "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4";

export function BrowseView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const saved = params.get("saved") === "1";
  const { filters, query, sort, dates } = browseStore.useValue();
  const favorites = favoritesStore.useValue();
  const [searchOpen, setSearchOpen] = useState(false);
  const t = useTranslations("browse");
  const common = useTranslations("common");
  const deferredQuery = useDeferredValue(query.trim());
  const categoryOptions = useMasterItemsQuery("vehicle_category");
  const engine = filters.engine[0];
  const range = dates ? cambodiaRentalRange(dates.start, dates.end) : {};
  const vehicles = useVehiclesQuery({
    page,
    pageSize: saved ? 100 : 24,
    q: deferredQuery || undefined,
    category: filters.category === "all" ? undefined : filters.category,
    brand: filters.brands.length ? filters.brands : undefined,
    transmission: filters.transmission.length ? filters.transmission : undefined,
    minPrice: filters.price[0] * 100,
    maxPrice: filters.price[1] * 100,
    minEngineCc: engine === "200-400" ? 200 : engine === "over-400" ? 401 : undefined,
    maxEngineCc: engine === "under-200" ? 199 : engine === "200-400" ? 400 : undefined,
    availableOnly: filters.availableOnly || undefined,
    ...range,
    sort: sort === "price-asc" ? "price_asc" : sort === "price-desc" ? "price_desc" : sort === "popular" ? "newest" : "name",
  });

  useEffect(() => {
    const category = params.get("category");
    const q = params.get("q");
    const start = params.get("start");
    const end = params.get("end");
    if (!category && !q && !(start && end)) return;
    browseStore.update((s) => ({
      ...s,
      query: q ?? s.query,
      filters: { ...s.filters, category: category ?? s.filters.category },
      dates: start && end ? { start, end } : s.dates,
    }));
  }, []);

  const results = useMemo(() => {
    const mapped = (vehicles.data?.data ?? []).map(vehicleToMotorcycle);
    return saved ? mapped.filter((vehicle) => favorites.includes(vehicle.id)) : mapped;
  }, [favorites, saved, vehicles.data]);
  const loading = vehicles.isPending;
  const phoneCount = activeFilterCount(filters, true);
  const sidebarCount = activeFilterCount(filters);
  const set = (patch: Partial<typeof DEFAULT_BROWSE>) => browseStore.update((s) => ({ ...s, ...patch }));
  const setPage = (next: number) => {
    const query = new URLSearchParams(params.toString());
    if (next <= 1) query.delete("page"); else query.set("page", String(next));
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
  };
  const update = (patch: Partial<typeof DEFAULT_BROWSE>) => {
    set(patch);
    if (page !== 1) setPage(1);
  };
  const title = saved ? t("saved") : t("title");
  const subtitle = loading ? t("loading") : common("bikesCount", { count: saved ? results.length : vehicles.data?.meta.total ?? 0 });

  return (
    <>
      <AppBar
        title={title}
        actions={
          <>
            <IconButton label={t("searchBikes")} icon={<MagnifyingGlassIcon size={24} />} onPress={() => setSearchOpen(true)} />
            <span className="relative">
              <ButtonLink href="/bikes/filters" variant="ghost" iconOnly aria-label={phoneCount ? t("filtersActive", { count: phoneCount }) : t("filters")}>
                <FunnelIcon size={24} />
              </ButtonLink>
              {phoneCount ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1 right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-ink"
                >
                  {phoneCount}
                </span>
              ) : null}
            </span>
            <SortControl value={sort} onChange={(next) => update({ sort: next })} iconOnly />
          </>
        }
      />

      <SearchDialog
        isOpen={searchOpen}
        onOpenChange={setSearchOpen}
        value={query}
        onSubmit={(q) => {
          update({ query: q });
          setSearchOpen(false);
        }}
      />

      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <DesktopTitle title={title} subtitle={<span aria-live="polite">{subtitle}</span>} />
        <p className="sr-only md:hidden" aria-live="polite">
          {subtitle}
        </p>

        <div className="flex flex-col gap-2 md:hidden">
          <RentalDatesButton
            start={dates?.start}
            end={dates?.end}
            onChange={(start, end) => update({ dates: { start, end } })}
            triggerProps={{ fullWidth: true, className: "justify-start border border-line bg-surface px-3 font-medium" }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => update({ query: "" })}
              className="flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <MagnifyingGlassIcon size={16} />
              {query}
              <XIcon size={14} aria-hidden />
              <span className="sr-only">{common("clearSearch")}</span>
            </button>
          ) : null}
        </div>

        <div className="hidden gap-2 md:flex">
          <AppSearchField value={query} onChange={(q) => update({ query: q })} className="flex-1" />
          <ButtonLink
            href="/bikes/filters"
            variant="secondary"
            className="shrink-0 lg:hidden"
            aria-label={sidebarCount ? t("filtersActive", { count: sidebarCount }) : t("filters")}
          >
            <FunnelIcon size={20} />
            <span>{t("filters")}</span>
            {sidebarCount ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{sidebarCount}</span>
            ) : null}
          </ButtonLink>
        </div>
        <div className="hidden md:block">
          <Tabs
            aria-label={t("categoryAria")}
            selectedKey={filters.category}
            onSelectionChange={(category) => update({ filters: { ...filters, category } })}
            items={[{ id: "all", label: t("cat_all") }, ...(categoryOptions.data ?? []).map((item) => ({ id: item.code, label: item.name }))]}
          />
        </div>

        <div className="flex items-start gap-8">
          <aside aria-label={t("filters")} className="sticky top-24 hidden w-72 shrink-0 rounded-card border border-line bg-surface p-5 shadow-card lg:block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold">{t("filters")}</h2>
              <Button variant="ghost" size="sm" onPress={() => update({ filters: { ...DEFAULT_FILTERS, category: filters.category } })} isDisabled={!sidebarCount}>
                {common("reset")}
              </Button>
            </div>
            <BikeFilters value={filters} onChange={(next) => update({ filters: next })} />
          </aside>

          <section aria-label={t("resultsAria")} className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="hidden items-center justify-between gap-2 md:flex">
              <p className="text-sm text-subtle">{loading ? t("finding") : dates ? t("availableForDates") : t("allBikes")}</p>
              <div className="flex items-center gap-2">
                <RentalDatesButton
                  start={dates?.start}
                  end={dates?.end}
                  onChange={(start, end) => update({ dates: { start, end } })}
                  triggerProps={{ size: "sm" }}
                />
                <SortControl value={sort} onChange={(next) => update({ sort: next })} />
              </div>
            </div>

            {loading ? (
              <div className={`${gridClass} lg:grid-cols-3`} role="status" aria-label={t("loadingAria")}>
                {Array.from({ length: 6 }, (_, i) => (
                  <MotorcycleCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlassIcon size={24} />}
                title={t("noMatchTitle")}
                description={t("noMatchText")}
                action={
                  <Button size="sm" onPress={() => vehicles.isError ? vehicles.refetch() : update(DEFAULT_BROWSE)}>
                    {t("resetFilters")}
                  </Button>
                }
              />
            ) : (
              <AnimatedGrid key={`${filters.category}-${sort}-${results.length}`} className={`${gridClass} lg:grid-cols-3`}>
                {results.map((bike) => (
                  <MotorcycleCard key={bike.id} bike={bike} />
                ))}
              </AnimatedGrid>
            )}
            {!saved && (vehicles.data?.meta.total ?? 0) > 24 ? (
              <Pagination
                page={page}
                pageCount={Math.max(1, Math.ceil((vehicles.data?.meta.total ?? 0) / 24))}
                onPageChange={setPage}
                summary={`${vehicles.data?.meta.total ?? 0} vehicles`}
              />
            ) : null}
          </section>
        </div>
      </Screen>
    </>
  );
}
