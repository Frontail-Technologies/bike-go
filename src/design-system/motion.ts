/**
 * Motion config for custom RideGo interactions only. HeroUI components keep
 * their native CSS animations; nothing here touches Drawer, Select, Modal,
 * Popover or the calendars.
 *
 * Budgets: feedback ~140ms, shared selection ~200ms, reveal ~300ms, page ~200ms.
 * Animate transform and opacity only.
 */
export const duration = {
  feedback: 0.14,
  selection: 0.2,
  reveal: 0.3,
  page: 0.2,
  ticker: 0.8,
} as const;

/** Soft ease-out used for entrances. */
export const ease = [0.165, 0.84, 0.44, 1] as const;

/** Shared-layout movement for selection indicators. Duration-based, no bounce. */
export const selectionTransition = { type: "spring", duration: duration.selection, bounce: 0 } as const;

/** Layout reordering for lists (position only, so nothing stretches). */
export const listTransition = { type: "spring", duration: 0.28, bounce: 0 } as const;

export const stagger = {
  /** Seconds between grid items. */
  step: 0.04,
  /** Items beyond this index reveal together, so long lists never feel slow. */
  maxItems: 8,
} as const;
