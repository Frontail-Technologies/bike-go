"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CopyIcon, DotsThreeVerticalIcon, EyeIcon, NotePencilIcon, PowerIcon, TrashIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { placementMeta } from "../lib/banner-model";
import type { Banner, BannerPlacement } from "../types/banner";

export function PlacementBadge({ placement, className }: { placement: BannerPlacement; className?: string }) {
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
  const inactive = banner.status === "inactive";
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${banner.title}`} className={cn("size-11 min-w-11 md:size-9 md:min-w-9", className)}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={`Actions for ${banner.title}`}>
          <Dropdown.Item id="edit" textValue="Edit banner" onAction={() => handlers.onEdit(banner)}><NotePencilIcon size={16} /><Label>Edit</Label></Dropdown.Item>
          <Dropdown.Item id="preview" textValue="Preview banner" onAction={() => handlers.onPreview(banner)}><EyeIcon size={16} /><Label>Preview</Label></Dropdown.Item>
          <Dropdown.Item id="duplicate" textValue="Duplicate banner" onAction={() => handlers.onDuplicate(banner)}><CopyIcon size={16} /><Label>Duplicate</Label></Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={inactive ? "Activate banner" : "Deactivate banner"} onAction={() => handlers.onToggle(banner)}><PowerIcon size={16} /><Label>{inactive ? "Activate" : "Deactivate"}</Label></Dropdown.Item>
          <Dropdown.Item id="delete" textValue="Delete banner" variant="danger" onAction={() => handlers.onDelete(banner)}><TrashIcon size={16} /><Label>Delete</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
