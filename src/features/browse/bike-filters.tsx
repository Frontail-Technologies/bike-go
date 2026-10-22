"use client";

import { ChipGroup } from "@/components/ui/chip-group";
import { RangeSlider } from "@/components/ui/range-slider";
import { Switch } from "@/components/ui/selection-controls";
import { brands, categories } from "@/features/mock/data";
import { DEFAULT_FILTERS, type EngineBand, type Filters, PRICE_MAX, PRICE_MIN, engineBands } from "./filters";

type BikeFiltersProps = {
  value: Filters;
  onChange: (value: Filters) => void;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

/** The full filter set. Rendered in a sheet on mobile and a sticky sidebar on desktop. */
export function BikeFilters({ value, onChange }: BikeFiltersProps) {
  const set = <K extends keyof Filters>(key: K, next: Filters[K]) => onChange({ ...value, [key]: next });

  return (
    <div className="flex flex-col gap-6">
      <Group title="Bike type">
        <ChipGroup
          label="Bike type"
          options={categories.filter((c) => c.id !== "all")}
          value={value.category === "all" ? [] : [value.category]}
          onChange={(ids) => set("category", ids[0] ?? "all")}
        />
      </Group>

      <RangeSlider
        label="Price per day"
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={100}
        value={value.price}
        onChange={(price) => set("price", price)}
      />

      <Group title="Brand">
        <ChipGroup
          label="Brand"
          multiple
          options={brands.map((b) => ({ id: b, label: b }))}
          value={value.brands}
          onChange={(next) => set("brands", next)}
        />
      </Group>

      <Group title="Transmission">
        <ChipGroup
          label="Transmission"
          multiple
          options={[
            { id: "manual", label: "Manual" },
            { id: "automatic", label: "Automatic" },
          ]}
          value={value.transmission}
          onChange={(next) => set("transmission", next)}
        />
      </Group>

      <Group title="Engine capacity">
        <ChipGroup
          label="Engine capacity"
          options={engineBands}
          value={value.engine}
          onChange={(next) => set("engine", next as EngineBand[])}
        />
      </Group>

      <Switch isSelected={value.availableOnly} onChange={(next) => set("availableOnly", next)}>
        Available bikes only
      </Switch>
    </div>
  );
}

export { DEFAULT_FILTERS };
