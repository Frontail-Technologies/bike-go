"use client";

import { type CalendarDate, getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { useMemo, useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Today's date in the visitor's time zone. `undefined` during SSR/prerender
 * (the clock can't be read there), then the real date after hydration.
 */
export function useToday(): CalendarDate | undefined {
  const iso = useSyncExternalStore(
    subscribe,
    () => today(getLocalTimeZone()).toString(),
    () => undefined,
  );
  return useMemo(() => (iso ? parseDate(iso) : undefined), [iso]);
}
