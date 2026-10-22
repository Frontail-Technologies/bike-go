import { ClockCountdownIcon, GasPumpIcon, IdentificationCardIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";

const terms = [
  { Icon: IdentificationCardIcon, text: "Rider must be 18+ with a valid driving licence." },
  { Icon: ShieldCheckIcon, text: "Refundable deposit, returned within 48 hours of return." },
  { Icon: GasPumpIcon, text: "100 km/day included. ₹5 per extra km. Return with the fuel you started with." },
  { Icon: ClockCountdownIcon, text: "Free cancellation up to 24 hours before pickup. Late return: ₹150 per hour." },
];

export function RentalTerms() {
  return (
    <ul className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      {terms.map(({ Icon, text }) => (
        <li key={text} className="flex items-start gap-3 text-sm">
          <Icon size={20} className="mt-0.5 shrink-0" />
          <span className="text-subtle">{text}</span>
        </li>
      ))}
    </ul>
  );
}
