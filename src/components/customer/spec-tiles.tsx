"use client";

import { GasPumpIcon, GaugeIcon, GearSixIcon, ScalesIcon } from "@phosphor-icons/react/ssr";
import type { Motorcycle } from "@/features/mock/data";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

export function SpecTiles({ bike, className }: { bike: Motorcycle; className?: string }) {
  const t = useTranslations("bike");
  const specs = [
    { Icon: GaugeIcon, value: `${bike.engineCc}cc`, label: t("engine") },
    { Icon: GasPumpIcon, value: `${bike.mileageKmpl} km/l`, label: t("mileage") },
    { Icon: GearSixIcon, value: bike.gears ? t("speed", { count: bike.gears }) : t("auto"), label: t("gearbox") },
    { Icon: ScalesIcon, value: `${bike.weightKg} kg`, label: t("weight") },
  ];

  return (
    <ul className={cn("grid grid-cols-4 gap-2", className)}>
      {specs.map(({ Icon, value, label }) => (
        <li key={label} className="flex flex-col items-center gap-1 rounded-card border border-line bg-surface px-1 py-3 text-center">
          <Icon size={20} className="text-ink" />
          <span className="tabular text-[13px] leading-4 font-bold">{value}</span>
          <span className="text-[11px] text-subtle">{label}</span>
        </li>
      ))}
    </ul>
  );
}
