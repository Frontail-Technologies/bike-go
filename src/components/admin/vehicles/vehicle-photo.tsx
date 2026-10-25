import { CarProfileIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import type { VehicleType } from "@/components/admin/data";
import { BikeArt } from "@/components/shared/bike-art";
import { cn } from "@/lib/cn";

const tints = ["#FFC400", "#E5484D", "#2563B9", "#12805C", "#F97316", "#0F172A"] as const;
const tintFor = (seed: string) => tints[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tints.length];

type VehiclePhotoProps = {
  vehicle: { id: string; name: string; vehicleType: VehicleType; images: ReadonlyArray<{ url: string | null; altText: string | null }> };
  index?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

function Illustration({ type, seed }: { type: VehicleType; seed: string }) {
  if (type === "car") return <CarProfileIcon weight="duotone" className="size-[38%] text-[var(--admin-muted)]" aria-hidden />;
  return <BikeArt variant={type === "scooter" ? "scooter" : "motorcycle"} color={tintFor(seed)} className="size-[90%] p-0 drop-shadow-[0_10px_14px_rgb(20_25_31/0.18)]" />;
}

export function VehiclePhoto({ vehicle, index = 0, sizes = "(min-width: 1280px) 33vw, 100vw", priority = false, className }: VehiclePhotoProps) {
  const image = vehicle.images[index];
  return (
    <div className={cn("relative isolate flex items-center justify-center overflow-hidden bg-[radial-gradient(80%_80%_at_50%_30%,#fff,#f1efe6)]", className)}>
      {image?.url ? <Image src={image.url} alt={image.altText ?? vehicle.name} fill sizes={sizes} priority={priority} unoptimized className="object-cover" /> : <Illustration type={vehicle.vehicleType} seed={`${vehicle.id}${index}`} />}
    </div>
  );
}
