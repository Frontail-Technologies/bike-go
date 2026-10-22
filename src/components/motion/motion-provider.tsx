"use client";

import { MotionConfig } from "motion/react";

/** Honour the OS reduced-motion setting for every Motion animation in the app. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
