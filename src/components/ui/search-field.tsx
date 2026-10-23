"use client";

import { SearchField, type SearchFieldProps } from "@heroui/react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type AppSearchFieldProps = Omit<SearchFieldProps, "children"> & { placeholder?: string; iconClassName?: string; groupClassName?: string };

export function AppSearchField({
  placeholder,
  "aria-label": ariaLabel,
  className,
  iconClassName,
  groupClassName,
  ...props
}: AppSearchFieldProps) {
  const t = useTranslations();

  return (
    <SearchField aria-label={ariaLabel ?? t("common.search")} className={cn("w-full", className)} {...props}>
      <SearchField.Group className={cn("min-h-11 rounded-control border border-line bg-surface", groupClassName)}>
        <SearchField.SearchIcon>
          <MagnifyingGlassIcon size={20} className={iconClassName} />
        </SearchField.SearchIcon>
        <SearchField.Input placeholder={placeholder ?? t("home.searchPlaceholder")} className="text-base" />
        <SearchField.ClearButton aria-label={t("common.clearSearch")}>
          <XIcon size={16} />
        </SearchField.ClearButton>
      </SearchField.Group>
    </SearchField>
  );
}
