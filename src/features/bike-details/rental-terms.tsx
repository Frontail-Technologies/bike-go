"use client";

import { ClockCountdownIcon, GasPumpIcon, IdentificationCardIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { useTranslations } from "@/i18n/hooks";

const terms = [
  { Icon: IdentificationCardIcon, key: "term1" },
  { Icon: ShieldCheckIcon, key: "term2" },
  { Icon: GasPumpIcon, key: "term3" },
  { Icon: ClockCountdownIcon, key: "term4" },
] as const;

export function RentalTerms() {
  const t = useTranslations("bike");

  return (
    <ul className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      {terms.map(({ Icon, key }) => (
        <li key={key} className="flex items-start gap-3 text-sm leading-6">
          <Icon size={20} className="mt-1 shrink-0" />
          <span className="text-ink/75">{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}
