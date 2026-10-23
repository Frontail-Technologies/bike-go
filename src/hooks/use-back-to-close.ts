"use client";

import { useEffect, useRef } from "react";

export function useBackToClose(isOpen: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  const entryPushed = useRef(false);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    if (!entryPushed.current) {
      window.history.pushState({ rgoOverlay: true }, "");
      entryPushed.current = true;
    }
    const onPop = () => {
      entryPushed.current = false;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !entryPushed.current) return;
    entryPushed.current = false;
    if (window.history.state?.rgoOverlay) window.history.back();
  }, [isOpen]);
}
