"use client";

import { ArrowsClockwiseIcon, PlusIcon, ShuffleIcon } from "@phosphor-icons/react";
import { MotionConfig } from "motion/react";
import { useState } from "react";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { BookingStatusBadge } from "@/components/customer/booking-status-badge";
import { FeaturedBikeCarousel } from "@/components/customer/featured-bike-carousel";
import { MobileBottomNav } from "@/components/customer/mobile-bottom-nav";
import { MotorcycleCard } from "@/components/customer/motorcycle-card";
import { AnimatedActivityList } from "@/components/motion/animated-activity-list";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/selection-controls";
import { Tabs } from "@/components/ui/tabs";
import { type Booking, bookings, dashboardStats, motorcycles } from "@/features/mock/data";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { Demo, Section } from "../section";

const categories = [
  { id: "all", label: "All" },
  { id: "cruiser", label: "Cruiser" },
  { id: "sports", label: "Sports" },
  { id: "adventure", label: "Adventure" },
];

function ReplayButton({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="secondary" size="sm" onPress={onPress} className="self-start">
      <ArrowsClockwiseIcon size={20} />
      Replay
    </Button>
  );
}

export function MotionSection() {
  const [reducedPreview, setReducedPreview] = useState(false);
  const [category, setCategory] = useState("all");
  const [unit, setUnit] = useState("day");
  const [navHref, setNavHref] = useState("/");
  const [revealRun, setRevealRun] = useState(0);
  const [gridRun, setGridRun] = useState(0);
  const [stats, setStats] = useState(dashboardStats);
  const [feed, setFeed] = useState<Booking[]>(bookings.slice(0, 3));

  const visible = category === "all" ? motorcycles : motorcycles.filter((bike) => bike.category === category);

  function randomize() {
    setStats((current) =>
      current.map((stat) => ({ ...stat, value: Math.max(10, Math.round(stat.value * (0.7 + Math.random() * 0.6))) })),
    );
  }

  function addBooking() {
    setFeed((current) => {
      const next = bookings[current.length % bookings.length];
      return [{ ...next, id: `${next.id}-${current.length}` }, ...current].slice(0, 5);
    });
  }

  return (
    <Section
      id="motion"
      title="Motion & interaction"
      description="Subtle by design: transform and opacity only, 140–300ms, played once. HeroUI overlays keep their own animation."
    >
      <Demo title="Reduced-motion preview" className="flex flex-col gap-2">
        <Switch isSelected={reducedPreview} onChange={setReducedPreview}>
          Preview reduced motion
        </Switch>
        <p className="text-xs text-subtle">
          Forces the simplified version below: no sliding, rising or counting. Your OS setting does the same automatically.
        </p>
      </Demo>

      <MotionConfig reducedMotion={reducedPreview ? "always" : "user"}>
        <div className={cn("flex flex-col gap-8", reducedPreview && "rgo-force-reduced")}>
          <div className="grid gap-8 lg:grid-cols-2">
            <Demo title="Animated selection · category tabs and segmented control" className="flex flex-col gap-5">
              <Tabs aria-label="Bike category" items={categories} selectedKey={category} onSelectionChange={setCategory} />
              <SegmentedControl
                aria-label="Price unit"
                value={unit}
                onChange={setUnit}
                options={[
                  { id: "hour", label: "Hour" },
                  { id: "day", label: "Day" },
                  { id: "week", label: "Week" },
                ]}
              />
            </Demo>

            <Demo title="Bottom-nav indicator" className="flex justify-center bg-canvas">
              <div className="flex h-[260px] w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] border-[6px] border-ink bg-canvas">
                <div className="flex flex-1 items-center justify-center p-6 text-sm text-subtle">
                  Current page: <strong className="ml-1 text-ink">{navHref === "/" ? "Home" : navHref.slice(1)}</strong>
                </div>
                <MobileBottomNav inline activeHref={navHref} onNavigate={setNavHref} />
              </div>
            </Demo>
          </div>

          <Demo title="Staggered grid · replays when the category changes" className="flex flex-col gap-4">
            <ReplayButton onPress={() => setGridRun((n) => n + 1)} />
            <AnimatedGrid
              key={`${category}-${gridRun}`}
              className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
            >
              {visible.slice(0, 4).map((bike) => (
                <MotorcycleCard key={bike.id} bike={bike} />
              ))}
            </AnimatedGrid>
          </Demo>

          <div className="grid gap-8 lg:grid-cols-2">
            <Demo title="Card hover and press · lift and soft glare on hover devices, press on touch" className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <MotorcycleCard bike={motorcycles[0]} />
                <MotorcycleCard bike={motorcycles[2]} />
              </div>
            </Demo>

            <Demo title="Reveal" className="flex flex-col gap-4">
              <ReplayButton onPress={() => setRevealRun((n) => n + 1)} />
              <div key={revealRun} className="flex flex-col gap-3">
                {["Choose your ride", "Pick your dates", "Ride out"].map((line, i) => (
                  <Reveal key={line} delay={i * 0.08}>
                    <div className="rounded-control bg-brand-soft px-4 py-3 text-sm font-semibold">{line}</div>
                  </Reveal>
                ))}
              </div>
            </Demo>
          </div>

          <Demo title="Featured bike carousel · swipe, drag or use arrow keys" className="overflow-hidden">
            <FeaturedBikeCarousel bikes={motorcycles} />
          </Demo>

          <Demo title="Metric ticker · counts up when seen, tweens on change" className="flex flex-col gap-4">
            <Button variant="secondary" size="sm" onPress={randomize} className="self-start">
              <ShuffleIcon size={20} />
              Change values
            </Button>
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 md:gap-4">
              {stats.map((stat) => (
                <DashboardStatCard key={stat.id} {...stat} />
              ))}
            </div>
          </Demo>

          <Demo title="Animated activity list" className="flex flex-col gap-4">
            <Button variant="secondary" size="sm" onPress={addBooking} className="self-start">
              <PlusIcon size={20} />
              Add booking
            </Button>
            <AnimatedActivityList
              aria-label="Recent bookings"
              items={feed}
              getKey={(booking) => booking.id}
              className="divide-y divide-line"
              itemClassName="bg-surface"
              renderItem={(booking) => (
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{booking.customer}</p>
                    <p className="truncate text-xs text-subtle">
                      {booking.bike} · {formatDate(booking.startDate, { year: undefined })}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              )}
            />
          </Demo>
        </div>
      </MotionConfig>
    </Section>
  );
}
