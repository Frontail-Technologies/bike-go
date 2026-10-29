"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { CrownSimpleIcon, ListIcon, MagnifyingGlassIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { AdminNavList } from "@/components/admin/admin-nav";
import "@/components/admin/admin-theme.module.css";
import { adminCopy } from "@/components/admin/config";
import { ProfileMenu } from "@/components/admin/shell/admin-header";
import { AdminLogo } from "@/components/admin/shell/admin-logo";
import { AdminLanguageSwitcher } from "@/features/admin/i18n/components/admin-language-switcher";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { cn } from "@/lib/cn";

type AdminSidebarProps = { activeHref?: string; onNavigate?: (href: string) => void; collapsed: boolean; onCollapsedChange: (collapsed: boolean) => void; inline?: boolean; className?: string };

function SidebarPromo() {
  const t = useAdminTranslations();
  return (
    <div className="adminSidebarGlow relative isolate overflow-hidden rounded-2xl border border-white/10 p-4 text-white">
      <CrownSimpleIcon size={22} weight="fill" className="text-[var(--admin-accent)]" aria-hidden />
      <p className="mt-2 text-sm font-extrabold">RideGo Admin</p>
      <p className="mt-0.5 text-xs leading-5 text-white/60">{t("shell.manage")}</p>
    </div>
  );
}

export function AdminSidebar({ activeHref, onNavigate, collapsed, onCollapsedChange, inline = false, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useAdminTranslations();
  return (
    <aside aria-label="Admin" className={cn("adminOverlay flex shrink-0 flex-col gap-5 bg-[var(--admin-sidebar)] p-3 transition-[width] duration-200 ease-out motion-reduce:transition-none", collapsed ? "w-[72px]" : "w-[232px]", inline ? "h-full" : "sticky top-0 hidden h-dvh lg:flex", className)}>
      <div className={cn("flex h-11 items-center", collapsed ? "justify-center" : "justify-between px-1")}>
        <AdminLogo compact={collapsed} />
        {collapsed ? null : <Button isIconOnly variant="ghost" aria-label={t("shell.collapse")} onPress={() => onCollapsedChange(true)} className="[--button-bg-hover:rgb(255_255_255/0.1)] [--button-bg-pressed:rgb(255_255_255/0.16)] text-white/80 hover:text-white"><SidebarSimpleIcon size={19} aria-hidden /></Button>}
      </div>
      {collapsed ? <Button isIconOnly variant="ghost" aria-label={t("shell.expand")} onPress={() => onCollapsedChange(false)} className="[--button-bg-hover:rgb(255_255_255/0.1)] [--button-bg-pressed:rgb(255_255_255/0.16)] mx-auto text-white/80 hover:text-white"><SidebarSimpleIcon size={19} className="rotate-180" aria-hidden /></Button> : null}
      <nav aria-label={t("nav.sections")} className="min-h-0 flex-1 overflow-y-auto"><AdminNavList activeHref={activeHref ?? pathname} collapsed={collapsed} onNavigate={onNavigate} /></nav>
      {collapsed ? null : <SidebarPromo />}
    </aside>
  );
}

export function AdminMobileBar({ activeHref, onNavigate }: { activeHref?: string; onNavigate?: (href: string) => void }) {
  const pathname = usePathname();
  const drawer = useOverlayState();
  const t = useAdminTranslations();
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-[var(--admin-border)] bg-white/90 px-2 backdrop-blur-md lg:hidden">
        <Button isIconOnly variant="ghost" aria-label={t("shell.openMenu")} onPress={drawer.open} className="size-11 min-w-11"><ListIcon size={23} aria-hidden /></Button>
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <span className="flex size-7 items-center justify-center rounded-full bg-[var(--admin-accent)]" aria-hidden><span className="size-2 rounded-full bg-[#111820]" /></span>
          {adminCopy.productName}
        </span>
        <div className="ml-auto flex items-center">
          <AdminLanguageSwitcher compact />
          <Button isIconOnly variant="ghost" aria-label={t("shell.searchButton")} className="size-11 min-w-11"><MagnifyingGlassIcon size={21} aria-hidden /></Button>
          <ProfileMenu compact />
        </div>
      </div>
      <Drawer.Backdrop isOpen={drawer.isOpen} onOpenChange={drawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="left" className="h-dvh w-[min(18rem,calc(100vw-3rem))] max-w-none bg-[var(--admin-sidebar)] text-white">
          <Drawer.Dialog aria-label={t("shell.navigation")} className="h-full rounded-none border-0 bg-[var(--admin-sidebar)] text-white shadow-none">
            <Drawer.CloseTrigger className="text-white" />
            <Drawer.Header><AdminLogo /></Drawer.Header>
            <Drawer.Body className="flex flex-col gap-5"><AdminLanguageSwitcher inverse /><AdminNavList activeHref={activeHref ?? pathname} onNavigate={(href) => { onNavigate?.(href); drawer.close(); }} /><SidebarPromo /></Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
