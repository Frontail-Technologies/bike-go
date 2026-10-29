"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { ArrowDownIcon, ArrowUpIcon, DotsThreeVerticalIcon, NotePencilIcon, PowerIcon, TrashIcon } from "@phosphor-icons/react";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { adminT } from "@/features/admin/i18n/translate";

type ItemRowActionsProps = {
  name: string;
  active: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
};

export function ItemRowActions({ name, active, onEdit, onToggle, onMoveUp, onMoveDown, onDelete }: ItemRowActionsProps) {
  const t = useAdminTranslations();
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={t("settings.actions.actionsFor", { name })} className="size-11 min-w-11 md:size-9 md:min-w-9">
        <DotsThreeVerticalIcon size={20} weight="bold" />
      </Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={t("settings.actions.actionsFor", { name })}>
          <Dropdown.Item id="edit" textValue={t("settings.actions.edit")} onAction={onEdit}>
            <NotePencilIcon size={16} />
            <Label>{t("settings.actions.edit")}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={active ? t("actions.deactivate") : t("actions.activate")} variant={active ? "danger" : "default"} onAction={onToggle}>
            <PowerIcon size={16} />
            <Label>{active ? t("actions.deactivate") : t("actions.activate")}</Label>
          </Dropdown.Item>
          {onMoveUp ? (
            <Dropdown.Item id="up" textValue={t("settings.actions.moveUp")} onAction={onMoveUp}>
              <ArrowUpIcon size={16} />
              <Label>{t("settings.actions.moveUp")}</Label>
            </Dropdown.Item>
          ) : null}
          {onMoveDown ? (
            <Dropdown.Item id="down" textValue={t("settings.actions.moveDown")} onAction={onMoveDown}>
              <ArrowDownIcon size={16} />
              <Label>{t("settings.actions.moveDown")}</Label>
            </Dropdown.Item>
          ) : null}
          {onDelete ? (
            <Dropdown.Item id="delete" textValue={t("settings.actions.delete")} variant="danger" onAction={onDelete}>
              <TrashIcon size={16} />
              <Label>{t("settings.actions.delete")}</Label>
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export const deactivateCopy = (name: string) => adminT("settings.deactivateCopy", { name });
