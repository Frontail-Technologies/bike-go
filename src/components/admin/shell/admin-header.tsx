"use client";

import { Avatar, Button, Dropdown, SearchField, Tooltip } from "@heroui/react";
import { BellIcon, CaretDownIcon } from "@phosphor-icons/react";
import { adminCopy } from "@/components/admin/config";

export function NotificationsButton({ className }: { className?: string }) {
  return (
    <Tooltip delay={300}>
      <Button isIconOnly variant="ghost" aria-label="Notifications" className={`relative size-11 min-w-11 ${className ?? ""}`}>
        <BellIcon size={21} aria-hidden />
        <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-[var(--admin-danger)]" aria-hidden />
      </Button>
      <Tooltip.Content className="adminOverlay">Notifications</Tooltip.Content>
    </Tooltip>
  );
}

export function ProfileMenu({ compact = false }: { compact?: boolean }) {
  return (
    <Dropdown>
      <Dropdown.Trigger className="flex h-11 items-center gap-2.5 rounded-xl px-1.5 outline-none transition-colors hover:bg-[var(--admin-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]" aria-label="Open profile menu">
        <Avatar size="sm"><Avatar.Fallback>SA</Avatar.Fallback></Avatar>
        {compact ? null : (
          <span className="hidden text-left leading-tight xl:block">
            <span className="block whitespace-nowrap text-xs font-bold">{adminCopy.adminName}</span>
            <span className="block whitespace-nowrap text-[11px] text-[var(--admin-muted)]">{adminCopy.adminRole}</span>
          </span>
        )}
        {compact ? null : <CaretDownIcon size={13} className="hidden text-[var(--admin-muted)] xl:block" aria-hidden />}
      </Dropdown.Trigger>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label="Profile actions">
          <Dropdown.Item id="profile">Profile</Dropdown.Item>
          <Dropdown.Item id="preferences">Preferences</Dropdown.Item>
          <Dropdown.Item id="sign-out">Sign out</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center gap-4 border-b border-[var(--admin-border)] bg-white/85 px-6 backdrop-blur-md lg:flex">
      <SearchField aria-label="Search admin" className="w-full max-w-md">
        <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder={adminCopy.searchPlaceholder} /><SearchField.ClearButton /></SearchField.Group>
      </SearchField>
      <div className="ml-auto flex items-center gap-1">
        <NotificationsButton />
        <span className="mx-1 h-6 w-px bg-[var(--admin-border)]" aria-hidden />
        <ProfileMenu />
      </div>
    </header>
  );
}
