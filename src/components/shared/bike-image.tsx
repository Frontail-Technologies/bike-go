import Image from "next/image";
import { BikeArt } from "@/components/shared/bike-art";
import type { Motorcycle } from "@/features/customer/vehicles/lib/view-model";
import { cn } from "@/lib/cn";

type BikeImageProps = {
  bike: Motorcycle;
  index?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
};

export function BikeImage({ bike, index = 0, className, sizes = "(min-width: 1024px) 33vw, 100vw", priority, decorative }: BikeImageProps) {
  const photo = bike.images[index];
  const alt = decorative ? "" : bike.name;

  if (photo) {
    return (
      <div className={cn("relative size-full", className)}>
        <Image src={photo} alt={alt} fill sizes={sizes} priority={priority} unoptimized className="object-cover" />
      </div>
    );
  }

  return (
    <BikeArt
      color={bike.colorways[index % bike.colorways.length]}
      variant={bike.category === "scooter" ? "scooter" : "motorcycle"}
      title={decorative ? undefined : alt}
      className={cn("p-2", className)}
    />
  );
}
