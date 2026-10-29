"use client";

import { Avatar, Dropdown, SearchField } from "@heroui/react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useAdminLogout } from "@/features/admin/auth/hooks/use-admin-logout";
import { useAdminSessionQuery } from "@/features/admin/auth/hooks/use-admin-session-query";
import { AdminLanguageSwitcher } from "@/features/admin/i18n/components/admin-language-switcher";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

function adminInitials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const logout = useAdminLogout();
  const session = useAdminSessionQuery();
  const t = useAdminTranslations();
  const admin = session.data;

  if (!admin) return <span className="block size-11 shrink-0" aria-hidden />;

  const role = admin.role === "super_admin" ? t("shell.superAdmin") : t("shell.admin");

  return (
    <Dropdown>
      <Dropdown.Trigger className="flex h-11 items-center gap-2.5 rounded-xl px-1.5 outline-none transition-colors hover:bg-[var(--admin-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]" aria-label={t("shell.openProfile")}>
        <Avatar size="sm"><Avatar.Fallback>{adminInitials(admin.name, admin.email)}</Avatar.Fallback></Avatar>
        {compact ? null : (
          <span className="hidden text-left leading-tight xl:block">
            <span className="block max-w-40 truncate text-xs font-bold">{admin.name}</span>
            <span className="block whitespace-nowrap text-[11px] text-[var(--admin-muted)]">{role}</span>
          </span>
        )}
        {compact ? null : <CaretDownIcon size={13} className="hidden text-[var(--admin-muted)] xl:block" aria-hidden />}
      </Dropdown.Trigger>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu
          aria-label={t("shell.profileActions")}
          onAction={(key) => {
            if (key === "sign-out") logout.mutate();
          }}
        >
          <Dropdown.Item id="sign-out" variant="danger" isDisabled={logout.isPending}>{logout.isPending ? t("shell.signingOut") : t("shell.signOut")}</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function AdminHeader() {
  const t = useAdminTranslations();
  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center gap-4 border-b border-[var(--admin-border)] bg-white/85 px-6 backdrop-blur-md lg:flex">
      <SearchField aria-label={t("shell.searchAdmin")} className="w-full max-w-md">
        <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder={t("shell.search")} /><SearchField.ClearButton /></SearchField.Group>
      </SearchField>
      <div className="ml-auto flex items-center gap-1">
        <AdminLanguageSwitcher />
        <ProfileMenu />
      </div>
    </header>
  );
}
