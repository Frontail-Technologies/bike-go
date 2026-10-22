/** Mirrors the CSS tokens in globals.css for places that need values in JS. */
export const colors = {
  brand: "#FFC400",
  ink: "#111111",
  canvas: "#F7F8FA",
  surface: "#FFFFFF",
  line: "#E5E7EB",
  subtle: "#6B7280",
  success: "#16A34A",
  danger: "#EF4444",
} as const;

export const spacing = [4, 8, 12, 16, 24, 32, 48] as const;

export const radii = {
  control: 12,
  card: 16,
  overlay: 24,
  badge: 9999,
} as const;

export const iconSize = {
  control: 20,
  nav: 24,
} as const;
