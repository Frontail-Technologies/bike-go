"use client";

import { motion } from "motion/react";
import { Children } from "react";
import { duration, ease, stagger } from "@/design-system/motion";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";

type AnimatedGridProps = {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
};

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
