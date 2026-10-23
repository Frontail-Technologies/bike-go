export const duration = {
  feedback: 0.14,
  selection: 0.2,
  reveal: 0.3,
  page: 0.2,
  ticker: 0.8,
} as const;

export const ease = [0.165, 0.84, 0.44, 1] as const;

export const selectionTransition = { type: "spring", duration: duration.selection, bounce: 0 } as const;

export const listTransition = { type: "spring", duration: 0.28, bounce: 0 } as const;

export const stagger = {
  step: 0.04,
  maxItems: 8,
} as const;
