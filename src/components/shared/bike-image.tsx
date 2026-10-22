import Image from "next/image";
import { BikeArt } from "@/components/shared/bike-art";
import type { Motorcycle } from "@/features/mock/data";
import { cn } from "@/lib/cn";

type BikeImageProps = {
  bike: Motorcycle;
  /** Gallery index. Selects the photo, or the colourway of the placeholder art. */
  index?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Hide from assistive tech when a visible name sits next to the image. */
  decorative?: boolean;
};

/**
 * The single place customer pages render a motorcycle picture.
 * Add real photos to `bike.images` (e.g. `/bikes/<id>/1.webp` under `public/`)
 * and every page switches over; until then it draws clean placeholder artwork.
 * Both fill their parent, so give the parent an aspect ratio. Nothing stretches:
 * photos are `object-cover`, artwork is `meet`-fitted.
 */
export function BikeImage({ bike, index = 0, className, sizes = "(min-width: 1024px) 33vw, 100vw", priority, decorative }: BikeImageProps) {
  const photo = bike.images[index];
  const alt = decorative ? "" : bike.name;

  if (photo) {
    return (
      <div className={cn("relative size-full", className)}>
        <Image src={photo} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
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
