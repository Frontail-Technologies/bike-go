"use client";

import { Suspense } from "react";
import { Logo } from "@/components/shared/logo";
import { ButtonsSection } from "./sections/buttons";
import { DataSection } from "./sections/data";
import { FoundationsSection } from "./sections/foundations";
import { FormsSection } from "./sections/forms";
import { MotionSection } from "./sections/motion";
import { NavigationSection } from "./sections/navigation";
import { OverlaysSection } from "./sections/overlays";
import { RideGoSection } from "./sections/ridego";
import { sectionList } from "./section";

export function Showcase() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 pt-[var(--safe-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col px-page">
          <div className="flex h-14 items-center gap-3">
            <Logo />
            <span className="text-sm font-medium text-subtle">Design system</span>
          </div>
          <nav aria-label="Sections" className="-mx-1 flex gap-1 overflow-x-auto pb-2 scrollbar-none">
            {sectionList.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold text-subtle outline-none transition-colors duration-150 hover:bg-surface-secondary hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto flex max-w-6xl flex-col gap-16 px-page py-8 pb-24 md:py-12">
        <FoundationsSection />
        <ButtonsSection />
        <FormsSection />
        <OverlaysSection />
        <NavigationSection />
        <DataSection />
        <Suspense fallback={<div className="min-h-[1400px]" aria-hidden />}>
          <RideGoSection />
        </Suspense>
        <MotionSection />
      </main>
    </div>
  );
}
