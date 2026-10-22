"use client";

import { FunnelIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MotorcycleCard } from "@/components/customer/motorcycle-card";
import { RentalDatesButton } from "@/components/customer/rental-dates-button";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { PageHeader } from "@/components/shared/page-header";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AppSearchField } from "@/components/ui/search-field";
import { MotorcycleCardSkeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useMockLoad } from "@/hooks/use-mock-load";
import { categories, motorcycles } from "@/features/mock/data";
import { favoritesStore } from "@/features/profile/store";
import { BikeFilters } from "./bike-filters";
import { DEFAULT_FILTERS, type Filters, type SortKey, activeFilterCount, queryBikes } from "./filters";
import { SortControl } from "./sort-control";

const gridClass = "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4";

export function BrowseView() {
  const params = useSearchParams();
  const saved = params.get("saved") === "1";
  const initialCategory = categories.some((c) => c.id === params.get("category")) ? (params.get("category") as string) : "all";

  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, category: initialCategory });
  const [draft, setDraft] = useState<Filters>(filters);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<SortKey>("popular");
  const [dates, setDates] = useState<{ start: string; end: string } | null>(
    params.get("start") && params.get("end") ? { start: params.get("start")!, end: params.get("end")! } : null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const loading = useMockLoad(450);
  const favorites = favoritesStore.useValue();

  const results = useMemo(
    () =>
      queryBikes(motorcycles, {
        filters,
        query,
        sort,
        start: dates?.start,
        end: dates?.end,
        onlyIds: saved ? favorites : undefined,
      }),
    [filters, query, sort, dates, saved, favorites],
  );
  const draftCount = useMemo(
    () => queryBikes(motorcycles, { filters: draft, query, sort, start: dates?.start, end: dates?.end, onlyIds: saved ? favorites : undefined }).length,
    [draft, query, sort, dates, saved, favorites],
  );
  const activeCount = activeFilterCount(filters);

  function resetAll() {
    setFilters(DEFAULT_FILTERS);
    setDraft(DEFAULT_FILTERS);
    setQuery("");
    setDates(null);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader title={saved ? "Saved bikes" : "Bikes"} subtitle={<span aria-live="polite">{loading ? "Loading bikes" : `${results.length} ${results.length === 1 ? "bike" : "bikes"}`}</span>} />

      <div className="flex gap-2">
        <AppSearchField value={query} onChange={setQuery} className="flex-1" />
        <Button
          variant="secondary"
          className="shrink-0 lg:hidden"
          aria-label={activeCount ? `Filters, ${activeCount} active` : "Filters"}
          onPress={() => {
            setDraft(filters);
            setSheetOpen(true);
          }}
        >
          <FunnelIcon size={20} />
          <span className="hidden sm:inline">Filters</span>
          {activeCount ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{activeCount}</span>
          ) : null}
        </Button>
      </div>

      <Tabs
        aria-label="Bike category"
        selectedKey={filters.category}
        onSelectionChange={(category) => setFilters((f) => ({ ...f, category }))}
        items={categories.map((c) => ({ id: c.id, label: c.label }))}
      />

      <div className="flex items-start gap-8">
        <aside aria-label="Filters" className="sticky top-24 hidden w-72 shrink-0 rounded-card border border-line bg-surface p-5 shadow-card lg:block">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold">Filters</h2>
            <Button variant="ghost" size="sm" onPress={() => setFilters({ ...DEFAULT_FILTERS, category: filters.category })} isDisabled={!activeCount}>
              Reset
            </Button>
          </div>
          <BikeFilters value={filters} onChange={setFilters} />
        </aside>

        <section aria-label="Results" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-subtle">
              {loading ? "Finding bikes…" : dates ? "Available for your dates" : "All bikes"}
            </p>
            <div className="flex items-center gap-2">
              <RentalDatesButton
                start={dates?.start}
                end={dates?.end}
                onChange={(start, end) => setDates({ start, end })}
                triggerProps={{ size: "sm" }}
              />
              <SortControl value={sort} onChange={setSort} />
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
                <Button size="sm" onPress={resetAll}>
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

      <BottomSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filters"
        footer={
          <>
            <Button variant="secondary" fullWidth onPress={() => setDraft({ ...DEFAULT_FILTERS, category: draft.category })}>
              Reset
            </Button>
            <Button slot="close" fullWidth onPress={() => setFilters(draft)}>
              {draftCount === 0 ? "No bikes" : `Show ${draftCount} ${draftCount === 1 ? "bike" : "bikes"}`}
            </Button>
          </>
        }
      >
        <BikeFilters value={draft} onChange={setDraft} />
      </BottomSheet>
    </div>
  );
}
