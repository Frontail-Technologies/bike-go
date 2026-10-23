"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { DotsThreeVerticalIcon, EyeIcon, NotePencilIcon, PowerIcon } from "@phosphor-icons/react";
import type { AdminVehicle } from "@/components/admin/data";

type VehicleActionsProps = {
  vehicle: Pick<AdminVehicle, "name" | "status">;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  className?: string;
};

export function VehicleActions({ vehicle, onView, onEdit, onToggle, className }: VehicleActionsProps) {
  const inactive = vehicle.status === "inactive";
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${vehicle.name}`} className={`size-11 min-w-11 md:size-9 md:min-w-9 ${className ?? ""}`}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={`Actions for ${vehicle.name}`}>
          <Dropdown.Item id="view" textValue="View vehicle" onAction={onView}><EyeIcon size={16} /><Label>View vehicle</Label></Dropdown.Item>
          <Dropdown.Item id="edit" textValue="Edit vehicle" onAction={onEdit}><NotePencilIcon size={16} /><Label>Edit vehicle</Label></Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={inactive ? "Activate vehicle" : "Deactivate vehicle"} variant={inactive ? "default" : "danger"} onAction={onToggle}><PowerIcon size={16} /><Label>{inactive ? "Activate vehicle" : "Deactivate vehicle"}</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
