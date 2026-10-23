"use client";

import { createPersistedStore } from "@/lib/persisted-store";

export const authStore = createPersistedStore<{ signedIn: boolean }>("rgo.auth.v1", { signedIn: true });

