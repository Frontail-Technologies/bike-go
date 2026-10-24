import Image from "next/image";
import { ImageIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

type BannerImageProps = {
  banner: { title: string; imageUrl: string | null };
  className?: string;
  sizes?: string;
  /** Kept for the preview frames, which draw their own text over the image. */
  textless?: boolean;
  src?: string | null;
};

/** The image is served privately by the API (or is a local preview), so it is never run through the image optimiser. */
export function BannerImage({ banner, className, sizes = "(min-width: 1280px) 33vw, 100vw", src }: BannerImageProps) {
  const url = src ?? banner.imageUrl;
  return (
    <div className={cn("relative isolate overflow-hidden bg-[var(--admin-surface-muted)]", className)}>
      {url ? <Image src={url} alt={banner.title} fill loading="eager" sizes={sizes} unoptimized className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-[var(--admin-muted)]"><ImageIcon size={28} weight="duotone" aria-hidden /></div>}
    </div>
  );
}
