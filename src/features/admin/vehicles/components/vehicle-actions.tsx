"use client";

import { Dropdown, Label } from "@heroui/react";
import { DotsThreeVerticalIcon, EyeIcon, NotePencilIcon, PowerIcon } from "@phosphor-icons/react";
import { AdminButton as Button } from "@/components/admin/controls";
import type { Vehicle } from "../types/vehicle";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

type VehicleActionsProps = {
  vehicle: Pick<Vehicle, "name" | "status">;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  className?: string;
};

export function VehicleActions({ vehicle, onView, onEdit, onToggle, className }: VehicleActionsProps) {
  const t = useAdminTranslations();
  const inactive = vehicle.status === "inactive";
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={t("vehicles.actionsFor", { name: vehicle.name })} className={`size-11 min-w-11 md:size-9 md:min-w-9 ${className ?? ""}`}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={t("vehicles.actionsFor", { name: vehicle.name })}>
          <Dropdown.Item id="view" textValue={t("vehicles.viewVehicle")} onAction={onView}><EyeIcon size={16} /><Label>{t("vehicles.viewVehicle")}</Label></Dropdown.Item>
          <Dropdown.Item id="edit" textValue={t("vehicles.editVehicle")} onAction={onEdit}><NotePencilIcon size={16} /><Label>{t("vehicles.editVehicle")}</Label></Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={inactive ? t("vehicles.activateVehicle") : t("vehicles.deactivateVehicle")} variant={inactive ? "default" : "danger"} onAction={onToggle}><PowerIcon size={16} /><Label>{inactive ? t("vehicles.activateVehicle") : t("vehicles.deactivateVehicle")}</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
