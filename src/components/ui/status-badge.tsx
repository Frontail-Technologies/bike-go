import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "info" | "success" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-secondary text-ink",
  brand: "bg-brand-soft text-ink",
  info: "bg-info-soft text-info-ink",
  success: "bg-success-soft text-[#15803d]",
  danger: "bg-danger-soft text-[#b91c1c]",
};

type StatusBadgeProps = {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ tone = "neutral", icon, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-3 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
