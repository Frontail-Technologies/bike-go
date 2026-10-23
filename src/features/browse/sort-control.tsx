"use client";

import { SortAscendingIcon } from "@phosphor-icons/react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { RadioGroup } from "@/components/ui/selection-controls";
import { useTranslations } from "@/i18n/hooks";
import { type SortKey, sortOptions } from "./filters";

type SortControlProps = {
  value: SortKey;
  onChange: (value: SortKey) => void;
  iconOnly?: boolean;
};

export function SortControl({ value, onChange, iconOnly = false }: SortControlProps) {
  const t = useTranslations("browse");
  const found = sortOptions.find((o) => o.id === value);
  const current = found ? t(found.key) : t("sortBy");

  return (
    <ResponsiveOverlay
      title={t("sortBy")}
      popoverClassName="w-[280px]"
      triggerProps={
        iconOnly
          ? { variant: "ghost", isIconOnly: true, "aria-label": t("sortCurrent", { current }) }
          : { variant: "secondary", size: "sm", "aria-label": t("sortCurrent", { current }) }
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
          label={t("sortBy")}
          value={value}
          onChange={(next) => {
            onChange(next as SortKey);
            close();
          }}
          options={sortOptions.map((o) => ({ value: o.id, label: t(o.key) }))}
        />
      )}
    </ResponsiveOverlay>
  );
}
