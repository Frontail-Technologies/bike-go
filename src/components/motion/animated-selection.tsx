"use client";

import { LayoutGroup, motion } from "motion/react";
import { useId } from "react";
import { selectionTransition } from "@/design-system/motion";
import { cn } from "@/lib/cn";

/**
 * Shared-layout selection highlight (the AnimatedBackground pattern from Motion
 * Primitives, adapted). Wrap a set of items in <AnimatedSelection>, then render
 * <SelectionIndicator /> inside whichever item is selected. The highlight slides
 * between items using transforms only, and jumps instantly under reduced motion.
 *
 * Each item needs `relative isolate` so the indicator can sit behind its label.
 */
export function AnimatedSelection({ children }: { children: React.ReactNode }) {
  // A unique group id keeps several selectors on one page from sharing a layoutId.
  const id = useId();
  return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

type SelectionIndicatorProps = {
  className?: string;
  /** Corner radius in px. Passed as a style so Motion can correct it while it scales. */
  radius?: number;
};

export function SelectionIndicator({ className, radius = 9999 }: SelectionIndicatorProps) {
  return (
    <motion.span
      layoutId="rgo-selection"
      transition={selectionTransition}
      style={{ borderRadius: radius }}
      className={cn("absolute inset-0 -z-10", className)}
      aria-hidden
    />
  );
}
