"use client";

import { motion } from "motion/react";
import { Children } from "react";
import { duration, ease, stagger } from "@/design-system/motion";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";

type AnimatedGridProps = {
  children: React.ReactNode;
  /** Put the grid classes here (`grid grid-cols-2 gap-3 ...`). */
  className?: string;
  /** Classes for each item wrapper (e.g. a fixed width in a horizontal scroller). */
  itemClassName?: string;
};

/**
 * Staggers its children in once, when the listing first scrolls into view.
 * It never replays on small scrolls. Only the first few items are staggered, so
 * long listings don't feel slow. Under reduced motion every item fades together.
 */
export function AnimatedGrid({ children, className, itemClassName }: AnimatedGridProps) {
  const reduced = useReducedMotionPreference();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {Children.toArray(children).map((child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          variants={{
            hidden: { opacity: 0, y: reduced ? 0 : 10 },
            show: {
              opacity: 1,
              y: 0,
              transition: {
                duration: reduced ? 0.01 : duration.reveal,
                delay: reduced ? 0 : Math.min(index, stagger.maxItems) * stagger.step,
                ease,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
