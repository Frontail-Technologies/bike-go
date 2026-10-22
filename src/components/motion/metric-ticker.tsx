"use client";

import { animate, useInView, useMotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { duration, ease } from "@/design-system/motion";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

type MetricTickerProps = {
  value: number;
  /** Intl.NumberFormat options, e.g. `{ style: "currency", currency: "INR" }`. */
  format?: Intl.NumberFormatOptions;
  className?: string;
};

/**
 * Counts up when first seen and tweens whenever `value` changes (the NumberTicker
 * pattern from Magic UI, adapted). The final value is in the server HTML, holds
 * the layout width, and is what screen readers get. Under reduced motion the
 * number simply shows its final value.
 */
export function MetricTicker({ value, format, className }: MetricTickerProps) {
  const reduced = useReducedMotionPreference();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(value);
  const formatKey = JSON.stringify(format ?? {});
  const formatter = useMemo(() => new Intl.NumberFormat("en-IN", format), [formatKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = formatter.format(value);

  // Before first paint, rewind to 0 so the first reveal counts up instead of flashing the final value.
  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    motionValue.jump(0);
    ref.current.textContent = formatter.format(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const unsubscribe = motionValue.on("change", (latest) => {
      node.textContent = formatter.format(Math.round(latest));
    });
    return unsubscribe;
  }, [motionValue, formatter]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      motionValue.jump(value);
      node.textContent = text;
      return;
    }
    if (!inView) return;
    const controls = animate(motionValue, value, { duration: duration.ticker, ease });
    return () => controls.stop();
  }, [inView, value, reduced, motionValue, text]);

  return (
    <span className={cn("tabular relative inline-grid", className)}>
      {/* Holds the final width so counting never shifts layout. */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {text}
      </span>
      <span ref={ref} aria-hidden className="col-start-1 row-start-1">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
