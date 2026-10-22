"use client";

import { MotionConfigContext, useReducedMotion as useOsReducedMotion } from "motion/react";
import { useContext } from "react";

/**
 * True when motion should be simplified: either the OS asks for it, or the
 * nearest `MotionConfig` forces it (the design-system preview toggle).
 * `null` from the OS query (SSR) counts as "no preference".
 */
export function useReducedMotionPreference(): boolean {
  const { reducedMotion } = useContext(MotionConfigContext);
  const os = useOsReducedMotion();
  if (reducedMotion === "always") return true;
  if (reducedMotion === "never") return false;
  return Boolean(os);
}
