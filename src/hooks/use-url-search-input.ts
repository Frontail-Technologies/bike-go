"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";

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
  }, [text]);

  return [text, setText] as const;
}
