"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { DotsThreeVerticalIcon, EyeIcon, NotePencilIcon } from "@phosphor-icons/react";
import type { CustomerSummary } from "../types/customer";

export function CustomerActions({ customer, onView, onEdit, className }: { customer: Pick<CustomerSummary, "name">; onView: () => void; onEdit: () => void; className?: string }) {
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${customer.name}`} className={`size-11 min-w-11 md:size-9 md:min-w-9 ${className ?? ""}`}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={`Actions for ${customer.name}`}>
          <Dropdown.Item id="view" textValue="View customer" onAction={onView}><EyeIcon size={16} /><Label>View customer</Label></Dropdown.Item>
          <Dropdown.Item id="edit" textValue="Edit profile" onAction={onEdit}><NotePencilIcon size={16} /><Label>Edit profile</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
