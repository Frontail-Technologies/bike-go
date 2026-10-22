"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { AppSearchField } from "@/components/ui/search-field";

type SearchDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Current search, shown when the popup opens. */
  value: string;
  /** Called with the trimmed query (empty string clears the search). */
  onSubmit: (query: string) => void;
};

function SearchForm({ initial, onSubmit }: { initial: string; onSubmit: (query: string) => void }) {
  // Mounted only while the popup is open, so the draft restarts from the current search each time.
  const [draft, setDraft] = useState(initial);
  const submit = () => onSubmit(draft.trim());

  return (
    <div className="flex flex-col gap-4">
      <AppSearchField autoFocus value={draft} onChange={setDraft} onSubmit={submit} placeholder="Search bikes or brands" />
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onPress={() => onSubmit("")}>
          Clear
        </Button>
        <Button fullWidth onPress={submit}>
          Search
        </Button>
      </div>
    </div>
  );
}

/**
 * Search popup for phones, where the Bikes screen keeps its body for results. It sits at the top of the
 * screen so the on-screen keyboard never covers it; Enter or Search applies, Back or Esc dismisses.
 */
export function SearchDialog({ isOpen, onOpenChange, value, onSubmit }: SearchDialogProps) {
  return (
    <ModalDialog isOpen={isOpen} onOpenChange={onOpenChange} title="Search bikes" placement="top">
      <SearchForm initial={value} onSubmit={onSubmit} />
    </ModalDialog>
  );
}
