import { MotorcycleIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { FeaturedBikeCarousel } from "@/components/customer/featured-bike-carousel";
import { MotorcycleCard } from "@/components/customer/motorcycle-card";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { Reveal } from "@/components/motion/reveal";
import { motorcycles } from "@/features/mock/data";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <Reveal y={8} blur={0}>
        <section className="relative overflow-hidden rounded-overlay bg-ink p-6 text-white md:p-10">
          <div className="relative z-10 flex max-w-md flex-col gap-3">
            <p className="text-3xl leading-tight font-extrabold tracking-tight md:text-5xl">
              FREEDOM
              <br />
              <span className="text-brand">STARTS HERE</span>
            </p>
            <p className="text-sm text-white/75 md:text-base">Rent premium bikes for your next adventure.</p>
            <Link
              href="/design-system"
              className="mt-2 inline-flex h-12 w-fit items-center gap-2 rounded-control bg-brand px-5 text-sm font-semibold text-ink outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-white active:scale-[0.97] motion-reduce:transition-none"
            >
              <MotorcycleIcon size={20} weight="fill" />
              View design system
            </Link>
          </div>
        </section>
      </Reveal>

      <section aria-labelledby="featured" className="flex flex-col gap-4">
        <h2 id="featured" className="text-lg font-bold">
          Featured bikes
        </h2>
        <FeaturedBikeCarousel bikes={motorcycles.slice(0, 6)} />
      </section>

      <section aria-labelledby="popular" className="flex flex-col gap-4">
        <h2 id="popular" className="text-lg font-bold">
          Popular bikes
        </h2>
        <AnimatedGrid className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {motorcycles.slice(0, 4).map((bike) => (
            <MotorcycleCard key={bike.id} bike={bike} />
          ))}
        </AnimatedGrid>
      </section>
    </div>
  );
}
