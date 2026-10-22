import { ClockCountdownIcon, GasPumpIcon, IdentificationCardIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";

const terms = [
  { Icon: IdentificationCardIcon, text: "Rider must be 18+ with a valid driving licence." },
  { Icon: ShieldCheckIcon, text: "Refundable deposit, returned within 48 hours of return." },
  { Icon: GasPumpIcon, text: "100 km/day included. $0.10 per extra km. Return with the fuel you started with." },
  { Icon: ClockCountdownIcon, text: "Free cancellation up to 24 hours before pickup. Late return: $2 per hour." },
];

export function RentalTerms() {
  return (
    <ul className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      {terms.map(({ Icon, text }) => (
        <li key={text} className="flex items-start gap-3 text-sm leading-6">
          <Icon size={20} className="mt-1 shrink-0" />
          <span className="text-ink/75">{text}</span>
        </li>
      ))}
    </ul>
  );
}
