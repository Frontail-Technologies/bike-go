"use client";

import { useEffect, useRef } from "react";

/**
 * Android-style Back for overlays: while a sheet or dialog is open it owns one history entry, so the
 * system Back button closes it instead of leaving the page. A programmatic close (Esc, a button) removes
 * that entry again, so history never accumulates stray steps.
 */
export function useBackToClose(isOpen: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  const entryPushed = useRef(false);

  useEffect(() => {
    closeRef.current = onClose;
  });

  // Open: take one history entry and listen for Back.
  useEffect(() => {
    if (!isOpen) return;
    if (!entryPushed.current) {
      window.history.pushState({ rgoOverlay: true }, "");
      entryPushed.current = true;
    }
    const onPop = () => {
      entryPushed.current = false; // Back already removed our entry
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isOpen]);

  // Closed by something other than Back: give the entry back.
  useEffect(() => {
    if (isOpen || !entryPushed.current) return;
    entryPushed.current = false;
    if (window.history.state?.rgoOverlay) window.history.back();
  }, [isOpen]);
}
