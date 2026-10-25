"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { ArrowDownIcon, ArrowUpIcon, DotsThreeVerticalIcon, NotePencilIcon, PowerIcon, TrashIcon } from "@phosphor-icons/react";

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
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${name}`} className="size-11 min-w-11 md:size-9 md:min-w-9">
        <DotsThreeVerticalIcon size={20} weight="bold" />
      </Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={`Actions for ${name}`}>
          <Dropdown.Item id="edit" textValue="Edit" onAction={onEdit}>
            <NotePencilIcon size={16} />
            <Label>Edit</Label>
          </Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={active ? "Deactivate" : "Activate"} variant={active ? "danger" : "default"} onAction={onToggle}>
            <PowerIcon size={16} />
            <Label>{active ? "Deactivate" : "Activate"}</Label>
          </Dropdown.Item>
          {onMoveUp ? (
            <Dropdown.Item id="up" textValue="Move up" onAction={onMoveUp}>
              <ArrowUpIcon size={16} />
              <Label>Move up</Label>
            </Dropdown.Item>
          ) : null}
          {onMoveDown ? (
            <Dropdown.Item id="down" textValue="Move down" onAction={onMoveDown}>
              <ArrowDownIcon size={16} />
              <Label>Move down</Label>
            </Dropdown.Item>
          ) : null}
          {onDelete ? (
            <Dropdown.Item id="delete" textValue="Delete" variant="danger" onAction={onDelete}>
              <TrashIcon size={16} />
              <Label>Delete</Label>
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export const deactivateCopy = (name: string) => `${name} will stay on existing records, but it can’t be picked for new ones. You can activate it again later.`;
