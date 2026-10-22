import { cn } from "@/lib/cn";

type ScreenProps = {
  children: React.ReactNode;
  /** Room to reserve below the content: the fixed bottom nav, a pinned footer, or nothing. */
  bottom?: "nav" | "footer" | "none";
  /** Entry animation. Stack screens slide in; tab screens are covered by the template fade. */
  enter?: "slide" | "none";
  className?: string;
};

/**
 * Page body: owns horizontal padding, vertical rhythm and the space under pinned bars, so no screen redoes
 * safe-area maths. Bars (AppBar, ScreenFooter) stay outside it: an animated transform would otherwise
 * become the containing block of `position: fixed` children and make them jump.
 */
export function Screen({ children, bottom = "none", enter = "none", className }: ScreenProps) {
  const body = (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-page py-4 md:py-8 md:pb-12",
        bottom === "nav" && "pb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+24px)]",
        bottom === "footer" && "pb-[calc(6rem+var(--safe-bottom))]",
        enter === "slide" && "rgo-stack-in",
        className,
      )}
    >
      {children}
    </div>
  );

  // The slide starts 24px to the right. Left unclipped, that makes the page wider than the screen for
  // 220ms and mobile browsers zoom the whole page out to fit it, then snap back. `overflow-x: clip`
  // (not hidden: no scroll container, so sticky children keep working) keeps the overflow inside.
  return enter === "slide" ? <div className="overflow-x-clip">{body}</div> : body;
}

/** Desktop-only page heading (phones show the title in the AppBar). */
export function DesktopTitle({ title, subtitle, className }: { title: string; subtitle?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("hidden md:block", className)}>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-subtle">{subtitle}</p> : null}
    </div>
  );
}

type ScreenFooterProps = {
  children: React.ReactNode;
  /** Hide from this breakpoint up (desktop shows the action elsewhere). */
  hideFrom?: "md" | "lg";
  className?: string;
};

/** Primary action pinned to the bottom edge, above the home indicator. Stack screens have no bottom nav. */
export function ScreenFooter({ children, hideFrom, className }: ScreenFooterProps) {
  return (
    <div
      data-testid="screen-footer"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-page pt-3 pb-[calc(0.75rem+var(--safe-bottom))] shadow-nav backdrop-blur-md",
        hideFrom === "md" && "md:hidden",
        hideFrom === "lg" && "lg:hidden",
        className,
      )}
    >
      <div className="mx-auto max-w-md md:max-w-3xl">{children}</div>
    </div>
  );
}
