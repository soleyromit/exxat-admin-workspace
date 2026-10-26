/**
 * The lab viz palette as values for SVG attributes, plus the two status glyphs every chart shares.
 * Values point at components/lab/viz-tokens.css, which maps each one to a DS token. Never colour alone: on track is a
 * circle, behind is a diamond, and every chart names both in its legend.
 */
import * as React from "react"

export const VIZ = {
  on: "var(--lab-viz-on)",
  behind: "var(--lab-viz-behind)",
  behindEdge: "var(--lab-viz-behind-edge)",
  behindWash: "var(--lab-viz-behind-wash)",
  behindInk: "var(--lab-viz-behind-ink)",
  zero: "var(--lab-viz-zero)",
  grid: "var(--lab-viz-grid)",
  track: "var(--lab-viz-track)",
  tick: "var(--lab-viz-tick)",
  seq: ["var(--lab-viz-seq-1)", "var(--lab-viz-seq-2)", "var(--lab-viz-seq-3)", "var(--lab-viz-seq-4)"],
  age: ["var(--lab-viz-age-1)", "var(--lab-viz-age-2)", "var(--lab-viz-age-3)", "var(--lab-viz-age-4)"],
  ageEdge: "var(--lab-viz-age-4-edge)",
} as const

/** Heat bin for a share counted (0 to 100): under 50, 50 to 69, 70 to 89, 90 and over. */
export const SEQ_BINS = [
  { min: 0, label: "Under 50%" },
  { min: 50, label: "50 to 69%" },
  { min: 70, label: "70 to 89%" },
  { min: 90, label: "90% or more" },
] as const

export const seqIndex = (pct: number): number => (pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0)

/** Behind glyph: an amber diamond. */
export function DiamondGlyph({ size = 10 }: { size?: number }) {
  const s = size
  const inset = s * 0.18
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden="true" className="shrink-0">
      <rect x={inset} y={inset} width={s - inset * 2} height={s - inset * 2} rx={1} fill={VIZ.behind} transform={`rotate(45 ${s / 2} ${s / 2})`} />
    </svg>
  )
}

/** On track glyph: a neutral circle. */
export function DotGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 0.5} fill={VIZ.on} />
    </svg>
  )
}
