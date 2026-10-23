"use client";

import { AnimatePresence, motion } from "motion/react";
import { duration, ease, listTransition } from "@/design-system/motion";
import { cn } from "@/lib/cn";

type AnimatedActivityListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  "aria-label"?: string;
};

export function AnimatedActivityList<T>({
  items,
  getKey,
  renderItem,
  className,
  itemClassName,
  ...props
}: AnimatedActivityListProps<T>) {
  return (
    <ul aria-label={props["aria-label"]} className={cn("relative flex flex-col", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => (
          <motion.li
            key={getKey(item)}
            layout="position"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}
            transition={{ layout: listTransition, duration: duration.reveal, ease }}
            className={itemClassName}
          >
            {renderItem(item)}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
