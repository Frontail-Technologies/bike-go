import { MotorcycleIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="RideGo home"
      className={cn("inline-flex min-h-11 items-center gap-2 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-ink", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-brand text-ink">
        <MotorcycleIcon size={20} weight="fill" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">RideGo</span>
    </Link>
  );
}
