"use client";

import { Button, Description, FieldError, Input, Label, Modal, TextField } from "@heroui/react";
import { useState } from "react";
import { type Coordinates, mapLinkError, parseMapLink } from "./map-link";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

function LinkForm({ name, onClose, onSave }: { name: string; onClose: () => void; onSave: (coordinates: Coordinates) => void }) {
  const t = useAdminTranslations();
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const found = parseMapLink(link);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!found) { setError(mapLinkError(link)); return; }
    onSave(found);
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Modal.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">{t("locations.linkIntroBefore")}<strong className="text-[var(--admin-text)]">{name}</strong>{t("locations.linkIntroAfter")}</p>
        <TextField isRequired isInvalid={Boolean(error)} value={link} onChange={(value) => { setLink(value); setError(""); }} autoFocus>
          <Label>{t("locations.mapLink")}</Label>
          <Input placeholder="https://www.google.com/maps/place/…/@11.5504,104.9212,17z" />
          <Description>{found ? t("locations.found", { latitude: found.latitude, longitude: found.longitude }) : t("locations.linkHint")}</Description>
          <FieldError>{error}</FieldError>
        </TextField>
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>{t("common.cancel")}</Button>
        <Button type="submit" variant="primary" className="min-h-11">{t("locations.saveCoordinates")}</Button>
      </Modal.Footer>
    </form>
  );
}

export function MapLinkDialog({ name, isOpen, onOpenChange, onSave }: { name: string | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onSave: (coordinates: Coordinates) => void }) {
  const t = useAdminTranslations();
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label={t("locations.linkTitle")}>
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>{t("locations.linkTitle")}</Modal.Heading></Modal.Header>
          {name ? <LinkForm key={name} name={name} onClose={() => onOpenChange(false)} onSave={onSave} /> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
