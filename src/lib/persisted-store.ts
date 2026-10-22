"use client";

import { useSyncExternalStore } from "react";

type Area = "local" | "session";

/**
 * Tiny browser-persisted store for mock state (bookings, favourites, profile).
 * Server render and hydration always see `initial`, so there is no hydration
 * mismatch; the persisted value arrives right after hydration. Replace with a
 * real API later without touching callers (they only use the hook and `update`).
 */
export function createPersistedStore<T>(key: string, initial: T, area: Area = "local") {
  const listeners = new Set<() => void>();
  let cache: T | undefined;

  const storage = () => (area === "local" ? window.localStorage : window.sessionStorage);

  function read(): T {
    if (typeof window === "undefined") return initial;
    if (cache !== undefined) return cache;
    try {
      const raw = storage().getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      cache = initial;
    }
    return cache;
  }

  function write(next: T) {
    cache = next;
    try {
      storage().setItem(key, JSON.stringify(next));
    } catch {
      // Storage can be blocked (private mode); state still works for this tab.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    useValue: () => useSyncExternalStore(subscribe, read, () => initial),
    get: read,
    set: write,
    update: (fn: (current: T) => T) => write(fn(read())),
    reset: () => write(initial),
  };
}
