"use client";

import { createPersistedStore } from "@/lib/persisted-store";
import { DEFAULT_FILTERS, type Filters, type SortKey } from "./filters";

export type BrowseState = {
  filters: Filters;
  query: string;
  sort: SortKey;
  /** Pickup dates chosen on Home or Browse; narrows results to bikes free for the whole range. */
  dates: { start: string; end: string } | null;
};

export const DEFAULT_BROWSE: BrowseState = { filters: DEFAULT_FILTERS, query: "", sort: "popular", dates: null };

/**
 * Browse state shared by the Bikes tab and the full-screen Filters page. Session-scoped, so coming back to
 * Bikes keeps what you set (like a native tab), and a new visit starts clean.
 */
export const browseStore = createPersistedStore<BrowseState>("rgo.browse.v1", DEFAULT_BROWSE, "session");
