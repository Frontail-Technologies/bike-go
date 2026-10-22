"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ListIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { AdminNavList } from "@/components/admin/admin-nav";
import "@/components/admin/admin-theme.module.css";
import { AdminLogo } from "@/components/admin/shell/admin-logo";
import { cn } from "@/lib/cn";

type AdminSidebarProps = { activeHref?: string; onNavigate?: (href: string) => void; collapsed: boolean; onCollapsedChange: (collapsed: boolean) => void; inline?: boolean; className?: string };

export function AdminSidebar({ activeHref, onNavigate, collapsed, onCollapsedChange, inline = false, className }: AdminSidebarProps) {
  const pathname = usePathname();
  return (
    <aside aria-label="Admin" className={cn("adminOverlay flex shrink-0 flex-col gap-5 bg-[var(--admin-sidebar)] p-3 transition-[width] duration-200 ease-out motion-reduce:transition-none", collapsed ? "w-[72px]" : "w-[232px]", inline ? "h-full" : "sticky top-0 hidden h-dvh lg:flex", className)}>
      <div className={cn("flex h-11 items-center", collapsed ? "justify-center" : "justify-between px-1")}>
        <AdminLogo compact={collapsed} />
        {collapsed ? null : <Button isIconOnly variant="ghost" aria-label="Collapse sidebar" onPress={() => onCollapsedChange(true)} className="text-white"><SidebarSimpleIcon size={19} aria-hidden /></Button>}
      </div>
      {collapsed ? <Button isIconOnly variant="ghost" aria-label="Expand sidebar" onPress={() => onCollapsedChange(false)} className="mx-auto text-white"><SidebarSimpleIcon size={19} className="rotate-180" aria-hidden /></Button> : null}
      <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto"><AdminNavList activeHref={activeHref ?? pathname} collapsed={collapsed} onNavigate={onNavigate} /></nav>
    </aside>
  );
}

export function AdminMobileBar({ activeHref, onNavigate }: { activeHref?: string; onNavigate?: (href: string) => void }) {
  const pathname = usePathname();
  const drawer = useOverlayState();
  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-sidebar)] px-4 lg:hidden">
        <Button isIconOnly variant="ghost" aria-label="Open menu" onPress={drawer.open} className="text-white"><ListIcon size={23} aria-hidden /></Button>
        <AdminLogo />
      </div>
      <Drawer.Backdrop isOpen={drawer.isOpen} onOpenChange={drawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="left" className="max-w-[288px] bg-[var(--admin-sidebar)] text-white">
          <Drawer.Dialog aria-label="Admin navigation">
            <Drawer.CloseTrigger className="text-white" />
            <Drawer.Header><AdminLogo /></Drawer.Header>
            <Drawer.Body><AdminNavList activeHref={activeHref ?? pathname} onNavigate={(href) => { onNavigate?.(href); drawer.close(); }} /></Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
