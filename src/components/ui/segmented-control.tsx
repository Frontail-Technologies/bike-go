"use client";

import { Tabs } from "@/components/ui/tabs";

type SegmentedControlProps = {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  className?: string;
};

/** Single-select segmented control (e.g. price per hour / day / week). */
export function SegmentedControl({ options, value, onChange, className, ...props }: SegmentedControlProps) {
  return (
    <Tabs
      aria-label={props["aria-label"]}
      items={options}
      selectedKey={value}
      onSelectionChange={onChange}
      className={className}
    />
  );
}
