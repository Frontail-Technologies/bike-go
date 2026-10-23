"use client";

import { LayoutGroup, motion } from "motion/react";
import { useId } from "react";
import { selectionTransition } from "@/design-system/motion";
import { cn } from "@/lib/cn";

export function AnimatedSelection({ children }: { children: React.ReactNode }) {
  const id = useId();
  return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

type SelectionIndicatorProps = {
  className?: string;
  radius?: number;
  layoutId?: string;
};

export function SelectionIndicator({ className, radius = 9999, layoutId = "rgo-selection" }: SelectionIndicatorProps) {
  return (
    <motion.span
      layoutId={layoutId}
      transition={selectionTransition}
      style={{ borderRadius: radius }}
      className={cn("absolute inset-0 -z-10", className)}
      aria-hidden
    />
  );
}
