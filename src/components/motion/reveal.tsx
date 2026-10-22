"use client";

import { motion } from "motion/react";
import { duration, ease } from "@/design-system/motion";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds before the reveal starts. Ignored under reduced motion. */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
  /** Starting blur in px. */
  blur?: number;
};

/**
 * Fade + light rise + a touch of blur, played once when the block scrolls into
 * view. Under reduced motion it is a plain, near-instant fade: no offset, no blur.
 */
export function Reveal({ children, className, delay = 0, y = 12, blur = 4 }: RevealProps) {
  const reduced = useReducedMotionPreference();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y, filter: `blur(${reduced ? 0 : blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduced ? 0.01 : duration.reveal, delay: reduced ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}
