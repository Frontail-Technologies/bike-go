"use client";

import { cn } from "@/lib/cn";

export type ChipOption = { id: string; label: string };

type ChipGroupProps = {
  label: string;
  options: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  className?: string;
};

export function ChipGroup({ label, options, value, onChange, multiple = false, className }: ChipGroupProps) {
  function toggle(id: string) {
    const selected = value.includes(id);
    if (multiple) onChange(selected ? value.filter((v) => v !== id) : [...value, id]);
    else onChange(selected ? [] : [id]);
  }

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.id)}
            className={cn(
              "min-h-11 rounded-control border px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ink",
              "transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none",
              selected ? "border-brand bg-brand-soft font-bold text-ink" : "border-line bg-surface font-medium text-subtle hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
