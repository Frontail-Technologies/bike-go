"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminViewMode = "table" | "cards";
type PreferenceKey = "vehicles" | "bookings" | "customers" | "loans" | "documents" | "payments" | "banners";

type AdminPreferencesState = {
  pageSize: number;
  views: Partial<Record<PreferenceKey, AdminViewMode>>;
  setPageSize: (pageSize: number) => void;
  setView: (key: PreferenceKey, view: AdminViewMode) => void;
};

export const useAdminPreferencesStore = create<AdminPreferencesState>()(
  persist(
    (set) => ({
      pageSize: 20,
      views: {},
      setPageSize: (pageSize) => set({ pageSize }),
      setView: (key, view) => set((state) => ({ views: { ...state.views, [key]: view } })),
    }),
    { name: "ridego-admin-preferences", version: 1, skipHydration: true },
  ),
);
