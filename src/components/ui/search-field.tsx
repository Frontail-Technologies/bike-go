"use client";

import { SearchField, type SearchFieldProps } from "@heroui/react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

type AppSearchFieldProps = Omit<SearchFieldProps, "children"> & { placeholder?: string };

export function AppSearchField({
  placeholder = "Search bikes, brands or locations",
  "aria-label": ariaLabel = "Search",
  className,
  ...props
}: AppSearchFieldProps) {
  return (
    <SearchField aria-label={ariaLabel} className={cn("w-full", className)} {...props}>
      <SearchField.Group className="min-h-11 rounded-control border border-line bg-surface">
        <SearchField.SearchIcon>
          <MagnifyingGlassIcon size={20} />
        </SearchField.SearchIcon>
        <SearchField.Input placeholder={placeholder} className="text-base" />
        <SearchField.ClearButton aria-label="Clear search">
          <XIcon size={16} />
        </SearchField.ClearButton>
      </SearchField.Group>
    </SearchField>
  );
}
