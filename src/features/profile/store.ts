"use client";

import type { City } from "@/features/mock/data";
import { createPersistedStore } from "@/lib/persisted-store";

export type Profile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  licence: { number: string; expiry: string; verified: boolean } | null;
  notifications: { reminders: boolean; offers: boolean; updates: boolean };
};

export const profileStore = createPersistedStore<Profile>("rgo.profile.v1", {
  name: "Rahul Sharma",
  email: "rahul.sharma@gmail.com",
  phone: "9876543210",
  address: "B-14, Malviya Nagar, Jaipur",
  licence: { number: "RJ14 2021 0012345", expiry: "2041-06-30", verified: true },
  notifications: { reminders: true, offers: false, updates: true },
});

export const favoritesStore = createPersistedStore<string[]>("rgo.favorites.v1", ["yamaha-mt-15"]);

export const cityStore = createPersistedStore<City>("rgo.city.v1", "Jaipur");

export function toggleFavorite(id: string) {
  favoritesStore.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
