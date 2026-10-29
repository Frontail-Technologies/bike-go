"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CopyIcon, DotsThreeVerticalIcon, EyeIcon, NotePencilIcon, PowerIcon, TrashIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { placementMeta } from "../lib/banner-model";
import type { Banner, BannerPlacement } from "../types/banner";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function PlacementBadge({ placement, className }: { placement: BannerPlacement; className?: string }) {
  useAdminTranslations();
  const meta = placementMeta[placement];
  return <span className={cn("inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold", meta.badge, className)}>{meta.label}</span>;
}

export type BannerHandlers = {
  onEdit: (banner: Banner) => void;
  onPreview: (banner: Banner) => void;
  onToggle: (banner: Banner) => void;
  onDuplicate: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
};

export function BannerActions({ banner, handlers, className }: { banner: Banner; handlers: BannerHandlers; className?: string }) {
  const t = useAdminTranslations();
  const inactive = banner.status === "inactive";
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={t("banners.actions.actionsFor", { name: banner.title })} className={cn("size-11 min-w-11 md:size-9 md:min-w-9", className)}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={t("banners.actions.actionsFor", { name: banner.title })}>
          <Dropdown.Item id="edit" textValue={t("banners.actions.edit")} onAction={() => handlers.onEdit(banner)}><NotePencilIcon size={16} /><Label>{t("banners.actions.editShort")}</Label></Dropdown.Item>
          <Dropdown.Item id="preview" textValue={t("banners.actions.preview")} onAction={() => handlers.onPreview(banner)}><EyeIcon size={16} /><Label>{t("banners.actions.previewShort")}</Label></Dropdown.Item>
          <Dropdown.Item id="duplicate" textValue={t("banners.actions.duplicate")} onAction={() => handlers.onDuplicate(banner)}><CopyIcon size={16} /><Label>{t("banners.actions.duplicateShort")}</Label></Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={inactive ? t("banners.actions.activate") : t("banners.actions.deactivate")} onAction={() => handlers.onToggle(banner)}><PowerIcon size={16} /><Label>{inactive ? t("actions.activate") : t("actions.deactivate")}</Label></Dropdown.Item>
          <Dropdown.Item id="delete" textValue={t("banners.actions.delete")} variant="danger" onAction={() => handlers.onDelete(banner)}><TrashIcon size={16} /><Label>{t("banners.actions.deleteShort")}</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
