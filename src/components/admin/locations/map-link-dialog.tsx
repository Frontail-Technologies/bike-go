"use client";

import { Button, Description, FieldError, Input, Label, Modal, TextField } from "@heroui/react";
import { useState } from "react";
import { type Coordinates, mapLinkError, parseMapLink } from "./map-link";

function LinkForm({ name, onClose, onSave }: { name: string; onClose: () => void; onSave: (coordinates: Coordinates) => void }) {
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
        <p className="text-sm text-[var(--admin-muted)]">Paste a map link for <strong className="text-[var(--admin-text)]">{name}</strong> and the coordinates are filled in for you.</p>
        <TextField isRequired isInvalid={Boolean(error)} value={link} onChange={(value) => { setLink(value); setError(""); }} autoFocus>
          <Label>Map link</Label>
          <Input placeholder="https://www.google.com/maps/place/…/@11.5504,104.9212,17z" />
          <Description>{found ? `Found: ${found.latitude}, ${found.longitude}` : "Google Maps link, or “latitude, longitude”."}</Description>
          <FieldError>{error}</FieldError>
        </TextField>
        <p className="text-xs text-[var(--admin-muted)]">Demo only — changes reset after reload.</p>
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11">Save coordinates</Button>
      </Modal.Footer>
    </form>
  );
}

export function MapLinkDialog({ name, isOpen, onOpenChange, onSave }: { name: string | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onSave: (coordinates: Coordinates) => void }) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label="Add coordinates by link">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Add coordinates by link</Modal.Heading></Modal.Header>
          {name ? <LinkForm key={name} name={name} onClose={() => onOpenChange(false)} onSave={onSave} /> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
