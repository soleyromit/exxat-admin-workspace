import type * as React from "react"

/**
 * Shared vocabulary for the v2 viz primitives. Colours come only from DS tokens.
 * Magnitude uses one hue (--chart-1). State uses the DS status-badge pairs, so
 * "did not meet" is amber (warning) with a triangle glyph and never red.
 * Every state also has a glyph and a word, so colour is never the only signal.
 */

export type VizState = "met" | "notMet" | "notYet" | "pending" | "none"

export type VizTone = "magnitude" | "met" | "notMet" | "notYet" | "pending" | "neutral" | "muted" | "series2" | "series3"

export const STATE_META: Record<VizState, { word: string; icon: string; fill: string; fg: string; dashed?: boolean }> = {
  met: { word: "Met", icon: "fa-solid fa-circle-check", fill: "var(--status-badge-success-fill)", fg: "var(--status-badge-success-fg)" },
  notMet: { word: "Did not meet", icon: "fa-solid fa-triangle-exclamation", fill: "var(--status-badge-warning-fill)", fg: "var(--status-badge-warning-fg)" },
  notYet: { word: "Not yet met", icon: "fa-light fa-circle-half-stroke", fill: "var(--status-badge-info-fill)", fg: "var(--status-badge-info-fg)" },
  pending: { word: "Waiting for review", icon: "fa-light fa-clock", fill: "var(--status-badge-neutral-fill)", fg: "var(--status-badge-neutral-fg)", dashed: true },
  none: { word: "No evidence", icon: "fa-light fa-minus", fill: "transparent", fg: "var(--muted-foreground)" },
}

/** Mark colour per tone (solid fill for bars, dots, squares). */
export const TONE_COLOR: Record<VizTone, string> = {
  magnitude: "var(--chart-1)",
  met: "var(--status-badge-success-fg)",
  notMet: "var(--status-badge-warning-fg)",
  notYet: "var(--status-badge-info-fg)",
  pending: "var(--status-badge-neutral-fg)",
  neutral: "var(--muted-foreground)",
  muted: "var(--muted)",
  series2: "var(--chart-2)",
  series3: "var(--chart-4)",
}

/** Diagonal hatch: a texture so identity survives without colour. */
export function hatch(color: string): React.CSSProperties {
  return { backgroundImage: `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 6px)` }
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

export function pct(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(0, Math.min(100, (value / max) * 100))
}
