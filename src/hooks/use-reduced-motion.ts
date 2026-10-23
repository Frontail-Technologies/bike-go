"use client";

import { MotionConfigContext, useReducedMotion as useOsReducedMotion } from "motion/react";
import { useContext } from "react";

export function useReducedMotionPreference(): boolean {
  const { reducedMotion } = useContext(MotionConfigContext);
  const os = useOsReducedMotion();
  if (reducedMotion === "always") return true;
  if (reducedMotion === "never") return false;
  return Boolean(os);
}
