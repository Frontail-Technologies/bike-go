"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

type InteractiveCardProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
  /** Very soft pointer-following highlight. Mouse only; off on touch. */
  glare?: boolean;
};

/**
 * RideGo card behaviour.
 * - Hover devices: a 2px lift and a deeper shadow (faded in as an overlay so only
 *   transform and opacity animate). Optional soft glare following the mouse.
 * - Touch: press feedback only.
 * Hover styles only apply on devices that can hover, and all transitions are
 * removed under reduced motion.
 */
export function InteractiveCard({ children, className, as: Tag = "div", glare = false }: InteractiveCardProps) {
  const glareRef = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!glare || event.pointerType !== "mouse") return;
    const el = glareRef.current;
    if (!el) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--gx", `${x}px`);
      el.style.setProperty("--gy", `${y}px`);
    });
  }

  return (
    <Tag
      onPointerMove={onPointerMove}
      className={cn(
        "group relative rounded-card border border-line bg-surface shadow-card",
        "transition-transform duration-150 ease-out motion-reduce:transition-none",
        "hover:-translate-y-0.5 active:scale-[0.985]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-[0_14px_32px_rgb(17_17_17/0.12)] transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
      />
      {glare ? (
        <span
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:hidden max-md:hidden [@media(hover:none)]:hidden"
          style={{
            background:
              "radial-gradient(220px circle at var(--gx, 50%) var(--gy, 0%), rgb(255 196 0 / 0.12), transparent 70%)",
          }}
        />
      ) : null}
      {children}
    </Tag>
  );
}
