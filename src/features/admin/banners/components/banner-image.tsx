import Image from "next/image";
import { ImageIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

type BannerImageProps = {
  banner: { title: string; imageUrl: string | null };
  className?: string;
  sizes?: string;
  textless?: boolean;
  src?: string | null;
};

export function BannerImage({
  banner,
  className,
  sizes = "(min-width: 1280px) 33vw, 100vw",
  src,
}: BannerImageProps) {
  const url = src ?? banner.imageUrl;
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-(--admin-surface-muted)",
        className,
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={banner.title}
          fill
          loading="eager"
          sizes={sizes}
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-(--admin-muted)">
          <ImageIcon size={28} weight="duotone" aria-hidden />
        </div>
      )}
    </div>
  );
}
