"use client"

/**
 * The four engine states as one visual system [REQ AE-04; LEDGER D-L1], for Attainment and its peek.
 *
 * Calm palette (components/lab/viz-tokens.css): states are graded neutrals and brand tint, never a hue each. Amber stays
 * reserved for the dashboard's single "behind" flag, so a page has one saturated colour. State is always glyph + word:
 * the StatusBadge carries an icon and the label, the strip is backed by printed counts and a legend.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { StateBadge } from "@/components/lab/status-pill"
import { RECORD_STATE_META } from "@/lib/v2/labels"
import { RECORD_STATES, RECORD_STATE_LABEL, type RecordState } from "@/lib/lab/dashboard"
import type { StateCounts } from "@/lib/lab/attainment"
import { DiamondGlyph, VIZ } from "@/components/lab/viz"
import { NUM_LINK } from "@/components/lab/link-styles"
import { fmt } from "@/lib/v2/format"

/** Icons come from the one state map (lib/v2/labels.ts), so every screen draws the same glyph per state. */
export const STATE_ICON: Record<RecordState, string> = {
  achieved: RECORD_STATE_META.achieved.icon,
  progress: RECORD_STATE_META.progress.icon,
  unqualified: RECORD_STATE_META.unqualified.icon,
  none: RECORD_STATE_META.none.icon,
}

/** Fill per state, darkest for achieved. Graded neutrals only. */
export const STATE_FILL: Record<RecordState, string> = {
  // A neutral ramp from dark (achieved) to empty (no evidence): the strip reads by lightness alone, so it survives greyscale.
  achieved: "var(--lab-viz-age-4)",
  progress: "var(--lab-viz-age-3)",
  unqualified: "var(--lab-viz-age-1)",
  none: "var(--muted)",
}

/** The shared status pill (components/lab/status-pill.tsx). */
export { StateBadge }

export function StateSwatch({ state }: { state: RecordState }) {
  return <span className="inline-block size-3 shrink-0 rounded-sm" style={{ background: STATE_FILL[state], boxShadow: `inset 0 0 0 1px ${VIZ.grid}` }} aria-hidden="true" />
}

export function StateLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {RECORD_STATES.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <StateSwatch state={s} />
          {RECORD_STATE_LABEL[s]}
        </li>
      ))}
    </ul>
  )
}

/** Distribution of records across the four states: a decorative strip; the counts beside it are the data. */
export function StateStrip({ counts, total, label }: { counts: StateCounts; total: number; label: string }) {
  if (total === 0) return null
  return (
    <span role="img" aria-label={label} className="flex h-2.5 w-full min-w-24 overflow-hidden rounded-sm" style={{ boxShadow: `inset 0 0 0 1px ${VIZ.grid}` }}>
      {RECORD_STATES.map((s) => (counts[s] ? <span key={s} style={{ width: `${(counts[s] / total) * 100}%`, background: STATE_FILL[s] }} /> : null))}
    </span>
  )
}

/** A count that opens the records behind it. Zero is plain text: there is nothing to open. */
export function CountLink({ n, href, label }: { n: number; href: string; label: string }) {
  if (n === 0) return <span className="tabular-nums text-muted-foreground">0</span>
  return (
    <Link href={href} scroll={false} aria-label={label} className={`${NUM_LINK} font-normal`}>
      {fmt(n)}
    </Link>
  )
}

/** The single amber flag on the page: glyph + word + colour. */
export function BehindMark({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: VIZ.behindInk }}>
      <DiamondGlyph size={10} />
      {label}
    </span>
  )
}
