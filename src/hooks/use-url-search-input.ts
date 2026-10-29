"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";

/**
 * A search box backed by a URL param. The input updates instantly; the URL (and so the query)
 * updates once typing pauses. The URL stays the source of truth, so a reset or back/forward
 * navigation that changes it is reflected in the box.
 */
export function useUrlSearchInput(urlValue: string | undefined, commit: (q: string | undefined) => void, delayMs = 300) {
  const [text, setText] = useState(urlValue ?? "");
  const onCommit = useEffectEvent(commit);

  useEffect(() => {
    startTransition(() => setText(urlValue ?? ""));
  }, [urlValue]);

  useEffect(() => {
    if (text.trim() === (urlValue ?? "")) return;
    const timer = window.setTimeout(() => onCommit(text.trim() || undefined), delayMs);
    return () => window.clearTimeout(timer);
    // Only typing schedules a commit; a URL change is synced by the effect above.
  }, [text]);

  return [text, setText] as const;
}
