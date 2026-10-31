import Image from "next/image";
import { cn } from "@/lib/cn";

export function BrandLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[40dvh] items-center justify-center", className)} role="status" aria-label="Loading">
      <Image src="/brand/logo.png" alt="" width={64} height={64} priority className="size-16 animate-pulse motion-reduce:animate-none" />
    </div>
  );
}
