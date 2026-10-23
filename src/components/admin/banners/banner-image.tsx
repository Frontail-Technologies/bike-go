import Image from "next/image";
import { BikeArt } from "@/components/shared/bike-art";
import { CarProfileIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import type { Banner } from "./banner-data";

const tones = {
  sun: { bg: "from-[#ffc400] to-[#ffdf6b]", text: "text-[#111820]", sub: "text-[#111820]/70", art: "#111820" },
  night: { bg: "from-[#0b1a24] to-[#16384d]", text: "text-white", sub: "text-white/70", art: "#FFC400" },
  forest: { bg: "from-[#0e5e45] to-[#2fa57a]", text: "text-white", sub: "text-white/75", art: "#FFC400" },
  rose: { bg: "from-[#c43b3b] to-[#ee7f6b]", text: "text-white", sub: "text-white/75", art: "#FFFFFF" },
} as const;

type BannerImageProps = {
  banner: Pick<Banner, "title" | "subtitle" | "imageUrl" | "tone" | "art">;
  className?: string;
  sizes?: string;
  textless?: boolean;
  src?: string | null;
};

export function BannerImage({ banner, className, sizes = "(min-width: 1280px) 33vw, 100vw", textless = false, src }: BannerImageProps) {
  const url = src ?? banner.imageUrl;
  const tone = tones[banner.tone];
  return (
    <div className={cn("relative isolate overflow-hidden bg-gradient-to-br [container-type:inline-size]", url ? "bg-[var(--admin-surface-muted)]" : tone.bg, className)}>
      {url ? <Image src={url} alt={banner.title} fill loading="eager" sizes={sizes} unoptimized={url.startsWith("blob:")} className="object-cover" /> : (
        <>
          <div aria-hidden className="absolute -right-[4%] bottom-[-8%] w-[54%] max-w-xs">
            {banner.art === "car" ? <CarProfileIcon weight="duotone" className="size-full" color={tone.art} /> : <BikeArt variant={banner.art === "scooter" ? "scooter" : "motorcycle"} color={tone.art} className="p-0 drop-shadow-[0_10px_16px_rgb(0_0_0/0.3)]" />}
          </div>
          {textless ? null : (
            <div className={cn("absolute inset-y-0 left-0 flex w-[56%] flex-col justify-center gap-0.5 p-[6%]", tone.text)}>
              <p className="line-clamp-2 text-[clamp(0.7rem,2.4cqw,1.5rem)] font-extrabold leading-tight">{banner.title}</p>
              <p className={cn("line-clamp-2 text-[clamp(0.55rem,1.4cqw,0.9rem)]", tone.sub)}>{banner.subtitle}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
