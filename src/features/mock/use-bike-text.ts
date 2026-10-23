"use client";

import { useTranslations } from "@/i18n/hooks";
import type { Messages } from "@/i18n";
import type { Motorcycle } from "./data";

type BikeId = keyof Messages["bikes"];

export function useBikeText(bike: Motorcycle) {
  const t = useTranslations("bikes");
  const id = bike.id as BikeId;

  if (!t.has(`${id}.description`)) return { description: bike.description, highlights: bike.highlights };

  return {
    description: t(`${id}.description`),
    highlights: [t(`${id}.h1`), t(`${id}.h2`), t(`${id}.h3`)],
  };
}
