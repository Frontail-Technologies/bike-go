"use client";

import { Label, ListBox, Select, type SelectProps } from "@heroui/react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export type SelectOption = { id: string; label: string };

type AppSelectProps<T extends object = object> = Omit<SelectProps<T>, "children"> & {
  label: string;
  options: SelectOption[];
  placeholder?: string;
};

/**
 * Uses HeroUI's native Select popover (portal + collision-aware positioning),
 * so it works inside drawers and modals without clipping.
 */
export function AppSelect({ label, options, placeholder = "Select one", className, ...props }: AppSelectProps) {
  return (
    <Select placeholder={placeholder} className={cn("flex w-full flex-col gap-2", className)} {...props}>
      <Label className="text-sm font-semibold">{label}</Label>
      <Select.Trigger className="min-h-11 rounded-control border border-line bg-surface">
        <Select.Value />
        <Select.Indicator>
          <CaretDownIcon size={20} />
        </Select.Indicator>
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label} className="min-h-11">
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
