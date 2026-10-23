"use client";

import { useState } from "react";

export function useOptimisticNav(pathname: string) {
  const [intent, setIntent] = useState<{ href: string; from: string } | null>(null);
  const current = intent && intent.from === pathname ? intent.href : pathname;
  return { current, navigate: (href: string) => setIntent({ href, from: pathname }) };
}
