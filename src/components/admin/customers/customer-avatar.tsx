import { cn } from "@/lib/cn";
import { initials } from "@/lib/text";

const palettes = [
  "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]",
  "bg-[#e8f5f2] text-[#147d68]",
  "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  "bg-[#efe9ff] text-[#6246c7]",
] as const;

const sizes = { sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-xl sm:size-20 sm:text-2xl" } as const;

export function CustomerAvatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  const tone = palettes[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length];
  return <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full font-extrabold", sizes[size], tone, className)}>{initials(name)}</span>;
}
