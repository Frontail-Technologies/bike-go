"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AdminShellState = {
  sidebarCollapsed: boolean;
  mobileNavigationOpen: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavigationOpen: (open: boolean) => void;
};

/** UI-only state. Server data must live in React Query. */
export const useAdminShellStore = create<AdminShellState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavigationOpen: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileNavigationOpen: (mobileNavigationOpen) => set({ mobileNavigationOpen }),
    }),
    {
      name: "ridego-admin-shell",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      skipHydration: true,
    },
  ),
);
