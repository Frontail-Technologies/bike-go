"use client";

import { Breadcrumbs, Tabs } from "@heroui/react";
import { HouseIcon } from "@phosphor-icons/react";
import { AnimatedSelection, SelectionIndicator } from "@/components/motion/animated-selection";
import type { ReactNode } from "react";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export type AdminTabItem = { id: string; label: string; content?: ReactNode; icon?: ReactNode };
export function AdminTabs({ items, label, selectedKey, onSelectionChange }: { items: AdminTabItem[]; label: string; selectedKey?: string; onSelectionChange?: (key: string) => void }) {
  return (
    <Tabs selectedKey={selectedKey} defaultSelectedKey={items[0]?.id} onSelectionChange={(key) => onSelectionChange?.(String(key))} className="w-full">
      <Tabs.ListContainer className="overflow-x-auto scrollbar-none">
        <AnimatedSelection>
          <Tabs.List aria-label={label} className="min-w-max sm:w-full sm:min-w-0">
            {items.map((item) => (
              <Tabs.Tab key={item.id} id={item.id} className="isolate min-h-11 gap-2 whitespace-nowrap font-bold sm:flex-1">
                {({ isSelected }) => (
                  <>
                    {isSelected ? <SelectionIndicator layoutId={`admin-tab-${label}`} className="bg-[var(--admin-accent)] shadow-sm" /> : null}
                    {item.icon}
                    {item.label}
                  </>
                )}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </AnimatedSelection>
      </Tabs.ListContainer>
      {items.map((item) => (item.content ? <Tabs.Panel key={item.id} id={item.id} className="px-0 pt-4">{item.content}</Tabs.Panel> : null))}
    </Tabs>
  );
}

export function AdminBreadcrumbs({ items }: { items: ReadonlyArray<{ label: string; href?: string }> }) {
  const t = useAdminTranslations();
  return <Breadcrumbs aria-label={t("ui.breadcrumb")} className="text-xs text-[var(--admin-muted)]">
    <Breadcrumbs.Item href="/admin" aria-label={t("nav.dashboard")}><HouseIcon size={14} /></Breadcrumbs.Item>
    {items.map((item, index) => <Breadcrumbs.Item key={`${item.label}-${index}`} href={item.href} className="font-semibold last:text-[var(--admin-text)]">{item.label}</Breadcrumbs.Item>)}
  </Breadcrumbs>;
}
