"use client";

import { Drawer, useOverlayState } from "@heroui/react";
import { ListIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { AdminNavList } from "@/components/admin/admin-nav";
import { Logo } from "@/components/shared/logo";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type AdminSidebarProps = {
  /** Override router-derived active href (design-system demo). */
  activeHref?: string;
  onNavigate?: (href: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  /** Render inline instead of fixed to the viewport. */
  inline?: boolean;
  className?: string;
};

/** Desktop sidebar (collapsible). Hidden below `lg`; use AdminMobileBar there. */
export function AdminSidebar({
  activeHref,
  onNavigate,
  collapsed,
  onCollapsedChange,
  inline = false,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Admin"
      className={cn(
        "flex flex-col gap-4 border-r border-line bg-surface p-3 transition-[width] duration-200 ease-out motion-reduce:transition-none",
        collapsed ? "w-[72px]" : "w-64",
        inline ? "h-full" : "sticky top-0 hidden h-dvh lg:flex",
        className,
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between pl-1")}>
        {collapsed ? null : <Logo href="/admin" />}
        <IconButton
          label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          icon={<SidebarSimpleIcon size={20} />}
          onPress={() => onCollapsedChange(!collapsed)}
        />
      </div>
      <nav aria-label="Admin sections">
        <AdminNavList activeHref={activeHref ?? pathname} collapsed={collapsed} onNavigate={onNavigate} />
      </nav>
    </aside>
  );
}

/** Mobile/tablet top bar with a left drawer for navigation. */
export function AdminMobileBar({ activeHref, onNavigate }: { activeHref?: string; onNavigate?: (href: string) => void }) {
  const pathname = usePathname();
  const drawer = useOverlayState();

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/90 px-4 pt-[var(--safe-top)] backdrop-blur-md lg:hidden">
        <IconButton label="Open menu" icon={<ListIcon size={24} />} onPress={drawer.open} />
        <Logo href="/admin" />
      </div>
      <Drawer.Backdrop isOpen={drawer.isOpen} onOpenChange={drawer.setOpen}>
        <Drawer.Content placement="left">
          <Drawer.Dialog aria-label="Admin navigation">
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Logo href="/admin" />
            </Drawer.Header>
            <Drawer.Body>
              <AdminNavList
                activeHref={activeHref ?? pathname}
                onNavigate={(href) => {
                  onNavigate?.(href);
                  drawer.close();
                }}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
