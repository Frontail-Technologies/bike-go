"use client";

import { Toast, toast } from "@heroui/react";

export { toast };

export function AppToaster() {
  return (
    <Toast.Provider
      placement="bottom"
      className="mb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+8px)] md:mb-6"
    />
  );
}
