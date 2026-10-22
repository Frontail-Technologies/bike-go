"use client";

import { SortAscendingIcon } from "@phosphor-icons/react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { RadioGroup } from "@/components/ui/selection-controls";
import { type SortKey, sortOptions } from "./filters";

type SortControlProps = {
  value: SortKey;
  onChange: (value: SortKey) => void;
  /** Icon-only trigger (app bar). The current order stays in the accessible name. */
  iconOnly?: boolean;
};

/** Bottom sheet on mobile, popover on desktop. Choosing an option closes it. */
export function SortControl({ value, onChange, iconOnly = false }: SortControlProps) {
  const current = sortOptions.find((o) => o.id === value)?.label ?? "Sort";

  return (
    <ResponsiveOverlay
      title="Sort by"
      popoverClassName="w-[280px]"
      triggerProps={
        iconOnly
          ? { variant: "ghost", isIconOnly: true, "aria-label": `Sort: ${current}` }
          : { variant: "secondary", size: "sm", "aria-label": `Sort: ${current}` }
      }
      triggerLabel={
        iconOnly ? (
          <SortAscendingIcon size={24} />
        ) : (
          <>
            <SortAscendingIcon size={20} />
            <span>{current}</span>
          </>
        )
      }
    >
      {(close) => (
        <RadioGroup
          label="Sort by"
          value={value}
          onChange={(next) => {
            onChange(next as SortKey);
            close();
          }}
          options={sortOptions.map((o) => ({ value: o.id, label: o.label }))}
        />
      )}
    </ResponsiveOverlay>
  );
}
