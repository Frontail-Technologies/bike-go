"use client";

import { ChipGroup } from "@/components/ui/chip-group";
import { RangeSlider } from "@/components/ui/range-slider";
import { Switch } from "@/components/ui/selection-controls";
import { brands, categories } from "@/features/mock/data";
import { useTranslations } from "@/i18n/hooks";
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

export function BikeFilters({ value, onChange }: BikeFiltersProps) {
  const t = useTranslations("browse");
  const set = <K extends keyof Filters>(key: K, next: Filters[K]) => onChange({ ...value, [key]: next });

  return (
    <div className="flex flex-col gap-6">
      <Group title={t("bikeType")}>
        <ChipGroup
          label={t("bikeType")}
          options={categories.filter((c) => c.id !== "all").map((c) => ({ id: c.id, label: t(`cat_${c.id}` as "cat_all") }))}
          value={value.category === "all" ? [] : [value.category]}
          onChange={(ids) => set("category", ids[0] ?? "all")}
        />
      </Group>

      <RangeSlider
        label={t("pricePerDay")}
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={1}
        value={value.price}
        onChange={(price) => set("price", price)}
      />

      <Group title={t("brand")}>
        <ChipGroup
          label={t("brand")}
          multiple
          options={brands.map((b) => ({ id: b, label: b }))}
          value={value.brands}
          onChange={(next) => set("brands", next)}
        />
      </Group>

      <Group title={t("transmission")}>
        <ChipGroup
          label={t("transmission")}
          multiple
          options={[
            { id: "manual", label: t("manual") },
            { id: "automatic", label: t("automatic") },
          ]}
          value={value.transmission}
          onChange={(next) => set("transmission", next)}
        />
      </Group>

      <Group title={t("engineCapacity")}>
        <ChipGroup
          label={t("engineCapacity")}
          options={engineBands.map((band) => ({ id: band.id, label: t(band.key) }))}
          value={value.engine}
          onChange={(next) => set("engine", next as EngineBand[])}
        />
      </Group>

      <Switch isSelected={value.availableOnly} onChange={(next) => set("availableOnly", next)}>
        {t("availableOnly")}
      </Switch>
    </div>
  );
}

export { DEFAULT_FILTERS };
