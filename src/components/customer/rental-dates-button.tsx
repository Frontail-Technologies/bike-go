"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import type { DateValue } from "@internationalized/date";
import { useState } from "react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { Button, type ButtonProps } from "@/components/ui/button";
import { type DateRange, DateRangeCalendar } from "@/components/ui/date-range-calendar";
import { formatRange, toISO, toRange } from "@/features/bookings/dates";
import { useToday } from "@/hooks/use-today";

type RentalDatesButtonProps = {
  start?: string | null;
  end?: string | null;
  onChange: (start: string, end: string) => void;
  isDateUnavailable?: (date: DateValue) => boolean;
  triggerProps?: Omit<ButtonProps, "children" | "onPress">;
  /** Calendar icon only (44px square). The dates stay in the accessible name. */
  iconOnly?: boolean;
};

/** "Pickup dates" entry point: calendar in a sheet on mobile, a popover on desktop. */
export function RentalDatesButton({ start, end, onChange, isDateUnavailable, triggerProps, iconOnly }: RentalDatesButtonProps) {
  const [draft, setDraft] = useState<DateRange | null>(toRange(start ?? undefined, end ?? undefined));
  const min = useToday();

  return (
    <ResponsiveOverlay
      title="Pickup dates"
      popoverClassName="w-[380px]"
      triggerProps={{ variant: "secondary", ...(iconOnly ? { isIconOnly: true } : {}), ...triggerProps }}
      triggerLabel={
        <>
          <CalendarBlankIcon size={20} />
          <span className={iconOnly ? "sr-only" : undefined}>{start && end ? formatRange(start, end) : "Pickup dates"}</span>
        </>
      }
      footer={
        <Button
          slot="close"
          fullWidth
          isDisabled={!draft}
          onPress={() => draft && onChange(toISO(draft.start), toISO(draft.end))}
        >
          Apply dates
        </Button>
      }
    >
      <DateRangeCalendar
        aria-label="Rental dates"
        value={draft}
        onChange={setDraft}
        minValue={min}
        isDateUnavailable={isDateUnavailable}
      />
    </ResponsiveOverlay>
  );
}
