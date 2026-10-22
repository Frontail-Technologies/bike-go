"use client";

import { FunnelIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { useMockLoad } from "@/hooks/use-mock-load";
import { categories, motorcycles } from "@/features/mock/data";
import { favoritesStore } from "@/features/profile/store";
import { BikeFilters } from "./bike-filters";
import { DEFAULT_BROWSE, browseStore } from "./browse-store";
import { DEFAULT_FILTERS, activeFilterCount, queryBikes } from "./filters";
import { SearchDialog } from "./search-dialog";
import { SortControl } from "./sort-control";

const gridClass = "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4";

export function BrowseView() {
  const params = useSearchParams();
  const saved = params.get("saved") === "1";
  const { filters, query, sort, dates } = browseStore.useValue();
  const loading = useMockLoad(450);
  const favorites = favoritesStore.useValue();
  const [searchOpen, setSearchOpen] = useState(false);

  // Home hands over category / search / dates in the URL: take them into the store once, on arrival.
  useEffect(() => {
    const category = params.get("category");
    const q = params.get("q");
    const start = params.get("start");
    const end = params.get("end");
    if (!category && !q && !(start && end)) return;
    browseStore.update((s) => ({
      ...s,
      query: q ?? s.query,
      filters: { ...s.filters, category: categories.some((c) => c.id === category) ? (category as string) : s.filters.category },
      dates: start && end ? { start, end } : s.dates,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(
    () => queryBikes(motorcycles, { filters, query, sort, start: dates?.start, end: dates?.end, onlyIds: saved ? favorites : undefined }),
    [filters, query, sort, dates, saved, favorites],
  );
  // Phones keep the category inside Filters, so the app bar badge counts it; desktop shows it as tabs.
  const phoneCount = activeFilterCount(filters, true);
  const sidebarCount = activeFilterCount(filters);
  const set = (patch: Partial<typeof DEFAULT_BROWSE>) => browseStore.update((s) => ({ ...s, ...patch }));
  const title = saved ? "Saved bikes" : "Bikes";
  const subtitle = loading ? "Loading bikes" : `${results.length} ${results.length === 1 ? "bike" : "bikes"}`;

  return (
    <>
      {/* Phones: filters and sort live in the app bar; the page itself only carries the pickup dates. */}
      <AppBar
        title={title}
        actions={
          <>
            <IconButton label="Search bikes" icon={<MagnifyingGlassIcon size={24} />} onPress={() => setSearchOpen(true)} />
            <span className="relative">
              <ButtonLink href="/bikes/filters" variant="ghost" iconOnly aria-label={phoneCount ? `Filters, ${phoneCount} active` : "Filters"}>
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
            <SortControl value={sort} onChange={(next) => set({ sort: next })} iconOnly />
          </>
        }
      />

      <SearchDialog
        isOpen={searchOpen}
        onOpenChange={setSearchOpen}
        value={query}
        onSubmit={(q) => {
          set({ query: q });
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
            onChange={(start, end) => set({ dates: { start, end } })}
            triggerProps={{ fullWidth: true, className: "justify-start border border-line bg-surface px-3 font-medium" }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => set({ query: "" })}
              className="flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <MagnifyingGlassIcon size={16} />
              {query}
              <XIcon size={14} aria-hidden />
              <span className="sr-only">Clear search</span>
            </button>
          ) : null}
        </div>

        {/* From 768px there is room for search and category tabs on the page. */}
        <div className="hidden gap-2 md:flex">
          <AppSearchField value={query} onChange={(q) => set({ query: q })} className="flex-1" />
          <ButtonLink
            href="/bikes/filters"
            variant="secondary"
            className="shrink-0 lg:hidden"
            aria-label={sidebarCount ? `Filters, ${sidebarCount} active` : "Filters"}
          >
            <FunnelIcon size={20} />
            <span>Filters</span>
            {sidebarCount ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{sidebarCount}</span>
            ) : null}
          </ButtonLink>
        </div>
        <div className="hidden md:block">
          <Tabs
            aria-label="Bike category"
            selectedKey={filters.category}
            onSelectionChange={(category) => set({ filters: { ...filters, category } })}
            items={categories.map((c) => ({ id: c.id, label: c.label }))}
          />
        </div>

        <div className="flex items-start gap-8">
          <aside aria-label="Filters" className="sticky top-24 hidden w-72 shrink-0 rounded-card border border-line bg-surface p-5 shadow-card lg:block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold">Filters</h2>
              <Button variant="ghost" size="sm" onPress={() => set({ filters: { ...DEFAULT_FILTERS, category: filters.category } })} isDisabled={!sidebarCount}>
                Reset
              </Button>
            </div>
            <BikeFilters value={filters} onChange={(next) => set({ filters: next })} />
          </aside>

          <section aria-label="Results" className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="hidden items-center justify-between gap-2 md:flex">
              <p className="text-sm text-subtle">{loading ? "Finding bikes…" : dates ? "Available for your dates" : "All bikes"}</p>
              <div className="flex items-center gap-2">
                <RentalDatesButton
                  start={dates?.start}
                  end={dates?.end}
                  onChange={(start, end) => set({ dates: { start, end } })}
                  triggerProps={{ size: "sm" }}
                />
                <SortControl value={sort} onChange={(next) => set({ sort: next })} />
              </div>
            </div>

            {loading ? (
              <div className={`${gridClass} lg:grid-cols-3`} role="status" aria-label="Loading bikes">
                {Array.from({ length: 6 }, (_, i) => (
                  <MotorcycleCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlassIcon size={24} />}
                title="No bikes match"
                description="Try different dates, or remove a filter."
                action={
                  <Button size="sm" onPress={() => browseStore.set(DEFAULT_BROWSE)}>
                    Reset filters
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
          </section>
        </div>
      </Screen>
    </>
  );
}
