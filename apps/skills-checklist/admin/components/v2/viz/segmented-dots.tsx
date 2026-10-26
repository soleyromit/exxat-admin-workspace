import * as React from "react"
import { STATE_META, plural, type VizState } from "./tokens"

export type SegDot = { id: string; label: string; state: VizState }

export type SegmentedDotsProps = {
  /** Names the row, for example "Wound care outcomes". */
  label: string
  items: SegDot[]
  /** Dot diameter in px (min 16 so the glyph reads). Default 20. */
  size?: number
  className?: string
}

export function SegmentedDots({ label, items, size = 20, className }: SegmentedDotsProps) {
  const counts = (Object.keys(STATE_META) as VizState[]).map((s) => [s, items.filter((i) => i.state === s).length] as const).filter(([, n]) => n > 0)
  const summary = `${label}: ${items.length} ${plural(items.length, "step", "steps")}, ${counts.map(([s, n]) => `${n} ${STATE_META[s].word.toLowerCase()}`).join(", ")}`
  const d = Math.max(20, size)
  return (
    <ul aria-label={summary} className={`flex flex-wrap items-center gap-1 ${className ?? ""}`} data-viz="segmented-dots">
      {items.map((it) => {
        const m = STATE_META[it.state]
        return (
          <li
            key={it.id}
            className="inline-flex items-center justify-center rounded-full"
            style={{ width: d, height: d, background: m.fill, border: `1px ${m.dashed ? "dashed" : "solid"} ${it.state === "none" ? "var(--border-control-35)" : m.fg}` }}
          >
            <i className={m.icon} style={{ color: m.fg, fontSize: Math.max(12, Math.round(d * 0.5)) }} aria-hidden="true" />
            <span className="sr-only">{`${it.label}: ${m.word}`}</span>
          </li>
        )
      })}
    </ul>
  )
}
