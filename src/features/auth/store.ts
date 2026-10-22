"use client";

import { createPersistedStore } from "@/lib/persisted-store";

/**
 * Demo session. There is no backend, so this only records that someone signed in on this device.
 * Pages are not guarded yet; that arrives with real auth.
 */
export const authStore = createPersistedStore<{ signedIn: boolean }>("rgo.auth.v1", { signedIn: true });

