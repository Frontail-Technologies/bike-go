"use client";

import {
  Checkbox as HeroCheckbox,
  type CheckboxProps,
  Radio as HeroRadio,
  RadioGroup as HeroRadioGroup,
  type RadioGroupProps,
  Label,
  Switch as HeroSwitch,
  type SwitchProps,
} from "@heroui/react";
import { cn } from "@/lib/cn";

export function Checkbox({
  children,
  className,
  ...props
}: Omit<CheckboxProps, "children"> & { children: React.ReactNode }) {
  return (
    <HeroCheckbox className={cn("min-h-11", className)} {...props}>
      <HeroCheckbox.Content>
        <HeroCheckbox.Control>
          <HeroCheckbox.Indicator />
        </HeroCheckbox.Control>
        {children}
      </HeroCheckbox.Content>
    </HeroCheckbox>
  );
}

type RadioOption = { value: string; label: string };

export function RadioGroup({
  label,
  options,
  className,
  ...props
}: Omit<RadioGroupProps, "children"> & { label: string; options: RadioOption[] }) {
  return (
    <HeroRadioGroup className={cn("flex flex-col gap-1", className)} {...props}>
      <Label className="text-sm font-semibold">{label}</Label>
      {options.map((option) => (
        <HeroRadio key={option.value} value={option.value} className="min-h-11">
          <HeroRadio.Content>
            <HeroRadio.Control>
              <HeroRadio.Indicator />
            </HeroRadio.Control>
            {option.label}
          </HeroRadio.Content>
        </HeroRadio>
      ))}
    </HeroRadioGroup>
  );
}

export function Switch({
  children,
  className,
  ...props
}: Omit<SwitchProps, "children"> & { children: React.ReactNode }) {
  return (
    <HeroSwitch className={cn("min-h-11", className)} {...props}>
      <HeroSwitch.Content>
        <HeroSwitch.Control>
          <HeroSwitch.Thumb />
        </HeroSwitch.Control>
        {children}
      </HeroSwitch.Content>
    </HeroSwitch>
  );
}
