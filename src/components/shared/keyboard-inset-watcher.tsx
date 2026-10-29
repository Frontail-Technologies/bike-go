"use client";

import { useEffect } from "react";

export function KeyboardInsetWatcher() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function update() {
      const inset = Math.max(0, window.innerHeight - viewport!.height - viewport!.offsetTop);
      document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return null;
}
