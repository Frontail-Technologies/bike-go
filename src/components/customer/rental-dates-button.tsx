"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import type { DateValue } from "@internationalized/date";
import { useState } from "react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { Button, type ButtonProps } from "@/components/ui/button";
import { type DateRange, DateRangeCalendar } from "@/components/ui/date-range-calendar";
import { formatRange, toISO, toRange } from "@/features/bookings/dates";
import { useToday } from "@/hooks/use-today";
import { useTranslations } from "@/i18n/hooks";

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
  const t = useTranslations("booking");

  return (
    <ResponsiveOverlay
      title={t("pickupDates")}
      popoverClassName="w-[380px]"
      triggerProps={{ variant: "secondary", ...(iconOnly ? { isIconOnly: true } : {}), ...triggerProps }}
      triggerLabel={
        <>
          <CalendarBlankIcon size={20} />
          <span className={iconOnly ? "sr-only" : undefined}>{start && end ? formatRange(start, end) : t("pickupDates")}</span>
        </>
      }
      footer={
        <Button
          slot="close"
          fullWidth
          isDisabled={!draft}
          onPress={() => draft && onChange(toISO(draft.start), toISO(draft.end))}
        >
          {t("applyDates")}
        </Button>
      }
    >
      <DateRangeCalendar
        aria-label={t("rentalDates")}
        value={draft}
        onChange={setDraft}
        minValue={min}
        isDateUnavailable={isDateUnavailable}
      />
    </ResponsiveOverlay>
  );
}
