import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The RideGo page you requested could not be found.",
};

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#faf8f2] text-[#14191f]">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_12%,rgba(244,201,0,0.16),transparent_28rem),radial-gradient(circle_at_12%_88%,rgba(37,99,185,0.07),transparent_26rem)]" />
      <header className="mx-auto flex w-full max-w-7xl items-center px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl pr-3 font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-[#dcae00]/45">
          <Image src="/icon.svg" width={36} height={36} alt="" aria-hidden />
          <span className="text-lg tracking-tight">RideGo</span>
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-5 pb-12 sm:px-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1.18fr)] lg:px-10 lg:pb-20">
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#a96800]">404 · Route not found</p>
          <h1 className="text-balance text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl lg:text-6xl">Looks like this route took a detour.</h1>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-7 text-[#69727c] lg:mx-0">The page may have moved, the link may be outdated, or this destination does not exist. Let&apos;s get you back on the road.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#f4c900] px-6 text-sm font-extrabold text-[#111820] shadow-sm outline-none transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#e8bd00] focus-visible:ring-3 focus-visible:ring-[#dcae00]/45 motion-reduce:transform-none motion-reduce:transition-none">Return Home</Link>
            <Link href="/bikes" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d6d3c8] bg-white px-6 text-sm font-extrabold text-[#14191f] shadow-sm outline-none transition-[transform,border-color] hover:-translate-y-0.5 hover:border-[#a9a598] focus-visible:ring-3 focus-visible:ring-[#dcae00]/45 motion-reduce:transform-none motion-reduce:transition-none">Browse Vehicles</Link>
          </div>
        </div>

        <div className="order-first mx-auto w-full max-w-[640px] lg:order-last">
          <Image src="/illustrations/ridego-not-found.svg" width={720} height={520} priority alt="A RideGo scooter beside a winding road and an unknown destination marker" className="h-auto w-full" />
        </div>
      </section>
    </main>
  );
}
