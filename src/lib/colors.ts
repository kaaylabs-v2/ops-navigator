import type { Theme } from "@/lib/theme";

const DARK = {
  violet: "oklch(0.66 0.22 290)",
  violetGlow: "oklch(0.74 0.2 295)",
  emerald: "oklch(0.72 0.18 155)",
  amber: "oklch(0.78 0.16 75)",
  sky: "oklch(0.72 0.14 235)",
  rose: "oklch(0.66 0.22 18)",
  grid: "oklch(1 0 0 / 0.06)",
  axis: "oklch(0.68 0.025 280)",
  tooltipBg: "oklch(0.18 0.025 280 / 0.95)",
  tooltipBorder: "oklch(1 0 0 / 0.1)",
  labelText: "oklch(0.85 0.01 280)",
};

const LIGHT = {
  violet: "oklch(0.52 0.22 290)",
  violetGlow: "oklch(0.42 0.22 290)",
  emerald: "oklch(0.52 0.16 155)",
  amber: "oklch(0.58 0.14 75)",
  sky: "oklch(0.52 0.14 235)",
  rose: "oklch(0.52 0.22 18)",
  grid: "oklch(0.92 0.008 280)",
  axis: "oklch(0.42 0.018 280)",
  tooltipBg: "oklch(1 0 0 / 0.98)",
  tooltipBorder: "oklch(0.85 0.01 280)",
  labelText: "oklch(0.25 0.02 280)",
};

export type Palette = typeof DARK;

export function paletteFor(theme: Theme): Palette {
  return theme === "light" ? LIGHT : DARK;
}

// Tint helpers for pill/chip backgrounds — opacity differs by theme.
export function tintFor(theme: Theme) {
  return theme === "light" ? 0.12 : 0.18;
}
