import { MotorcycleIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { adminCopy } from "@/components/admin/config";

export function AdminLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]">
      <span className="flex size-8 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[#111820]">
        <MotorcycleIcon size={19} weight="fill" aria-hidden />
      </span>
      {compact ? null : (
        <span className="leading-tight text-white">
          <span className="block text-sm font-extrabold">{adminCopy.productName}</span>
          <span className="block text-[10px] text-[var(--admin-sidebar-muted)]">{adminCopy.portalName}</span>
        </span>
      )}
    </Link>
  );
}
