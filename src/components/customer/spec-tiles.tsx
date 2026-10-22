import { GasPumpIcon, GaugeIcon, GearSixIcon, ScalesIcon } from "@phosphor-icons/react/ssr";
import type { Motorcycle } from "@/features/mock/data";
import { cn } from "@/lib/cn";

/** Four key specs as tiles (reference: 350cc, 35 km/l, 5 speed, 160 kg). */
export function SpecTiles({ bike, className }: { bike: Motorcycle; className?: string }) {
  const specs = [
    { Icon: GaugeIcon, value: `${bike.engineCc}cc`, label: "Engine" },
    { Icon: GasPumpIcon, value: `${bike.mileageKmpl} km/l`, label: "Mileage" },
    { Icon: GearSixIcon, value: bike.gears ? `${bike.gears} speed` : "Auto", label: "Gearbox" },
    { Icon: ScalesIcon, value: `${bike.weightKg} kg`, label: "Weight" },
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
