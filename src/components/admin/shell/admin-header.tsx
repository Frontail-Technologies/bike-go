"use client";

import { Avatar, Button, Dropdown, SearchField, Tooltip } from "@heroui/react";
import { BellIcon, CaretDownIcon } from "@phosphor-icons/react";
import { adminCopy } from "@/components/admin/config";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center border-b border-[var(--admin-border)] bg-white/92 px-5 backdrop-blur-md lg:flex">
      <SearchField aria-label="Search admin" className="w-full max-w-sm">
        <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder={adminCopy.searchPlaceholder} /><SearchField.ClearButton /></SearchField.Group>
      </SearchField>
      <div className="ml-auto flex items-center gap-2">
        <Tooltip delay={300}>
          <Button isIconOnly variant="ghost" aria-label="Notifications" className="relative">
            <BellIcon size={20} aria-hidden />
            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[var(--admin-danger)]" aria-hidden />
          </Button>
          <Tooltip.Content className="adminOverlay">Notifications</Tooltip.Content>
        </Tooltip>
        <Dropdown>
          <Dropdown.Trigger className="h-12 gap-2 rounded-xl px-2" aria-label="Open profile menu">
              <Avatar size="sm"><Avatar.Fallback>SA</Avatar.Fallback></Avatar>
              <span className="hidden text-left xl:block">
                <span className="block text-xs font-bold">{adminCopy.adminName}</span>
                <span className="block text-[11px] text-[var(--admin-muted)]">{adminCopy.adminRole}</span>
              </span>
              <CaretDownIcon size={14} aria-hidden />
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu aria-label="Profile actions">
              <Dropdown.Item id="profile">Profile</Dropdown.Item>
              <Dropdown.Item id="preferences">Preferences</Dropdown.Item>
              <Dropdown.Item id="sign-out">Sign out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </header>
  );
}
