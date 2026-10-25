"use client";

import { createPersistedStore } from "@/lib/persisted-store";
import { DEFAULT_FILTERS, type Filters, type SortKey } from "../lib/filters";

export type BrowseState = {
  filters: Filters;
  query: string;
  sort: SortKey;
  dates: { start: string; end: string } | null;
};

export const DEFAULT_BROWSE: BrowseState = { filters: DEFAULT_FILTERS, query: "", sort: "popular", dates: null };

export const browseStore = createPersistedStore<BrowseState>("rgo.browse.v1", DEFAULT_BROWSE, "session");
