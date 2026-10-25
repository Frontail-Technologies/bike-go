"use client";

import { Avatar, Dropdown, SearchField } from "@heroui/react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { adminCopy } from "@/components/admin/config";
import { useAdminLogout } from "@/features/admin/auth/hooks/use-admin-logout";

export function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const logout = useAdminLogout();

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
        <Dropdown.Menu
          aria-label="Profile actions"
          onAction={(key) => {
            if (key === "sign-out") logout.mutate();
          }}
        >
          <Dropdown.Item id="sign-out" variant="danger" isDisabled={logout.isPending}>Sign out</Dropdown.Item>
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
        <ProfileMenu />
      </div>
    </header>
  );
}
