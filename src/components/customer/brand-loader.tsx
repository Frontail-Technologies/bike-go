import { MotorcycleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

export function BrandLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[40dvh] items-center justify-center", className)} role="status" aria-label="Loading RideGo">
      <div className="flex items-center gap-3">
        <span className="flex size-11 animate-pulse items-center justify-center rounded-[14px] bg-brand text-ink motion-reduce:animate-none">
          <MotorcycleIcon size={25} weight="fill" />
        </span>
        <span className="text-xl font-extrabold tracking-tight">RideGo</span>
      </div>
    </div>
  );
}
