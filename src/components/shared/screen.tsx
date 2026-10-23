import { cn } from "@/lib/cn";

type ScreenProps = {
  children: React.ReactNode;
  bottom?: "nav" | "footer" | "none";
  enter?: "slide" | "none";
  className?: string;
};

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

  return enter === "slide" ? <div className="overflow-x-clip">{body}</div> : body;
}

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
  hideFrom?: "md" | "lg";
  className?: string;
};

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
