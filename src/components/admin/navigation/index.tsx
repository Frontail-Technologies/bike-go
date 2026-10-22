"use client";

import { Tabs } from "@heroui/react";
import { CaretRightIcon, HouseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

export type AdminTabItem = { id: string; label: string; content?: ReactNode; icon?: ReactNode };
export function AdminTabs({ items, label, selectedKey, onSelectionChange }: { items: AdminTabItem[]; label: string; selectedKey?: string; onSelectionChange?: (key: string) => void }) {
  return <Tabs selectedKey={selectedKey} defaultSelectedKey={items[0]?.id} onSelectionChange={(key) => onSelectionChange?.(String(key))} className="w-full"><Tabs.ListContainer><Tabs.List aria-label={label}>{items.map((item) => <Tabs.Tab key={item.id} id={item.id} className="min-h-10 gap-2 font-bold">{item.icon}{item.label}</Tabs.Tab>)}</Tabs.List></Tabs.ListContainer>{items.map((item) => item.content ? <Tabs.Panel key={item.id} id={item.id} className="px-0 pt-4">{item.content}</Tabs.Panel> : null)}</Tabs>;
}

export function AdminBreadcrumbs({ items }: { items: ReadonlyArray<{ label: string; href?: string }> }) {
  return <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--admin-muted)]"><li><Link href="/admin" aria-label="Dashboard" className="rounded p-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]"><HouseIcon size={14} /></Link></li>{items.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-1.5"><CaretRightIcon size={12} aria-hidden />{item.href ? <Link href={item.href} className="font-semibold hover:text-[var(--admin-text)]">{item.label}</Link> : <span aria-current="page" className="font-semibold text-[var(--admin-text)]">{item.label}</span>}</li>)}</ol></nav>;
}
