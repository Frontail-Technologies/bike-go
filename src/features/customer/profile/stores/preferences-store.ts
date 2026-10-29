"use client";

import { createPersistedStore } from "@/lib/persisted-store";

export type ProfilePreferences = {
  notifications: { reminders: boolean; updates: boolean };
};

export const profileStore = createPersistedStore<ProfilePreferences>("rgo.customer-preferences.v3", {
  notifications: { reminders: false, updates: false },
});

export const favoritesStore = createPersistedStore<string[]>("rgo.customer-favorites.v3", []);

export const cityStore = createPersistedStore<string>("rgo.city.v2", "Phnom Penh");

export function toggleFavorite(id: string) {
  favoritesStore.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
}
