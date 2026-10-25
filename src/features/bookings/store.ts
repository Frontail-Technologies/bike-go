"use client";

import { createPersistedStore } from "@/lib/persisted-store";
import type { BookingDraft } from "./types";

export const draftStore = createPersistedStore<BookingDraft | null>("rgo.draft.v1", null, "session");

export const justBookedStore = createPersistedStore<string | null>("rgo.justbooked.v1", null, "session");

