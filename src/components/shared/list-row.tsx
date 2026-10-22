import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** A titled card that groups related rows (Profile, Help, Legal). */
export function SectionCard({ title, id, children, className }: { title: string; id: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-card border border-line bg-surface p-4 shadow-card", className)}>
      <h2 id={id} className="mb-2 text-base leading-6 font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

const rowClass =
  "flex min-h-12 w-full items-center gap-3 rounded-control px-1 text-left text-sm outline-none transition-colors duration-150 hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ink";

type ListRowProps = {
  icon: React.ReactNode;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** In-app path (client navigation) or external href such as tel: / mailto:. */
  href?: string;
};

/** Tappable row with an icon tile, label and chevron. Renders a real link for hrefs and a button otherwise. */
export function ListRow({ icon, label, description, trailing, onPress, href }: ListRowProps) {
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-secondary">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="leading-5 font-medium">{label}</span>
        {description ? <span className="text-xs leading-5 text-subtle">{description}</span> : null}
      </span>
      {trailing}
      <CaretRightIcon size={16} className="shrink-0 text-subtle" />
    </>
  );

  if (href?.startsWith("/")) {
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={rowClass}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onPress} className={rowClass}>
      {content}
    </button>
  );
}
