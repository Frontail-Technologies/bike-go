"use client";

import { Breadcrumbs, Tabs } from "@heroui/react";
import { HouseIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export type AdminTabItem = { id: string; label: string; content?: ReactNode; icon?: ReactNode };
export function AdminTabs({ items, label, selectedKey, onSelectionChange }: { items: AdminTabItem[]; label: string; selectedKey?: string; onSelectionChange?: (key: string) => void }) {
  return <Tabs selectedKey={selectedKey} defaultSelectedKey={items[0]?.id} onSelectionChange={(key) => onSelectionChange?.(String(key))} className="w-full"><Tabs.ListContainer><Tabs.List aria-label={label}>{items.map((item) => <Tabs.Tab key={item.id} id={item.id} className="relative min-h-10 gap-2 whitespace-nowrap font-bold">{item.icon}{item.label}<Tabs.Indicator className="rounded-lg bg-white shadow-sm" /></Tabs.Tab>)}</Tabs.List></Tabs.ListContainer>{items.map((item) => item.content ? <Tabs.Panel key={item.id} id={item.id} className="px-0 pt-4">{item.content}</Tabs.Panel> : null)}</Tabs>;
}

export function AdminBreadcrumbs({ items }: { items: ReadonlyArray<{ label: string; href?: string }> }) {
  return <Breadcrumbs aria-label="Breadcrumb" className="text-xs text-[var(--admin-muted)]">
    <Breadcrumbs.Item href="/admin" aria-label="Dashboard"><HouseIcon size={14} /></Breadcrumbs.Item>
    {items.map((item, index) => <Breadcrumbs.Item key={`${item.label}-${index}`} href={item.href} className="font-semibold last:text-[var(--admin-text)]">{item.label}</Breadcrumbs.Item>)}
  </Breadcrumbs>;
}
