"use client"

/**
 * Gap-axis dot strip (strategy/06 section 5.1, "Who is behind, and by how much?"). One dot per student; x is the gap to the
 * basis in points, so students of different cohorts share one axis and one zero line. Under All required x is the share
 * counted (0 to 100) and there is no zero line. Dots in the same 2-point bin pack into a small grid so 120+ students stay
 * legible. Behind is an amber diamond plus the word in the legend and the readout, never colour alone.
 *
 * Keyboard (06 section 3.5): the strip is one tab stop (a listbox); arrows move between students, Home and End jump, Enter
 * opens the student. The focused student is read out under the strip and announced. Every fact is also in the table fallback.
 * Hand-rolled SVG on DS tokens (the indicator layer is the one place the brief allows new components); no hex.
 */
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { VIZ, DiamondGlyph, DotGlyph } from "@/components/lab/viz"

export interface StripMark {
  id: string
  label: string
  /** Value on the axis (points of gap, or percent under All required). */
  value: number
  flagged: boolean
  /** Spoken and read-out description. */
  text: string
  href: string
}

export interface StripLane {
  id: string
  label: string
  marks: StripMark[]
}

export interface GapStripProps {
  /** Accessible name: the text summary of the chart. */
  summary: string
  lanes: StripLane[]
  domain: [number, number]
  /** Zero line, when the basis has one. */
  zero?: { value: number; label: string }
  tickFormat: (v: number) => string
  /** Hide lane labels (single lane). */
  showLaneLabels?: boolean
  /** Word under the bracket that labels the flagged cluster ("behind"). */
  flaggedWord?: string
}

const PAD = 14
const CELL = 10
const R = 4.5
const MAX_ROWS = 8
const BRACKET = 26

export function niceDomain(values: number[], percent: boolean): [number, number] {
  if (percent) return [0, 100]
  const max = Math.max(20, ...values.map((v) => Math.abs(v)))
  const m = Math.ceil(max / 10) * 10
  return [-m, m]
}

export function GapStrip({ summary, lanes, domain, zero, tickFormat, showLaneLabels = true, flaggedWord = "behind" }: GapStripProps) {
  const router = useLabRouter()
  const box = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(640)
  const [active, setActive] = React.useState<number | null>(null)
  const [focused, setFocused] = React.useState(false)
  const uid = React.useId().replace(/:/g, "")

  React.useLayoutEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === "undefined") return
    const read = () => { if (el.clientWidth > 0) setWidth(el.clientWidth) }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [lo, hi] = domain
  const span = hi - lo || 1
  const inner = Math.max(100, width - PAD * 2)
  const xOf = React.useCallback((v: number) => PAD + ((Math.max(lo, Math.min(hi, v)) - lo) / span) * inner, [lo, hi, span, inner])
  const binPts = 2
  const binPx = (binPts / span) * inner
  const cols = Math.max(1, Math.floor(binPx / CELL))

  const laid = React.useMemo(() => {
    return lanes.map((lane) => {
      const bins = new Map<number, StripMark[]>()
      for (const m of [...lane.marks].sort((a, b) => a.value - b.value || a.label.localeCompare(b.label))) {
        const k = Math.round(m.value / binPts) * binPts
        bins.set(k, [...(bins.get(k) ?? []), m])
      }
      let rows = 1
      const pts: Array<{ m: StripMark; x: number; row: number }> = []
      for (const [k, ms] of [...bins].sort((a, b) => a[0] - b[0])) {
        const cx = xOf(k)
        // Pack a bin into a small grid: at most MAX_ROWS high, widening sideways, so a bin of 40 students stays short.
        const c = Math.max(cols, Math.ceil(ms.length / MAX_ROWS))
        ms.forEach((m, i) => {
          const col = i % c
          const row = Math.floor(i / c)
          rows = Math.max(rows, row + 1)
          pts.push({ m, x: cx + (col - (Math.min(c, ms.length) - 1) / 2) * CELL, row })
        })
      }
      const flagged = pts.filter((p) => p.m.flagged)
      const bracket = flagged.length > 0 ? { x1: Math.min(...flagged.map((p) => p.x)) - R, x2: Math.max(...flagged.map((p) => p.x)) + R, n: flagged.length } : null
      const dots = rows * CELL + 12
      return { lane, pts, rows, dots, bracket, height: dots + (bracket ? BRACKET : 0) }
    })
  }, [lanes, xOf, cols])

  const flat = React.useMemo(() => laid.flatMap((l, li) => l.pts.map((p) => ({ ...p, li }))), [laid])
  const total = flat.length
  const ticks = React.useMemo(() => {
    const step = span > 80 ? 20 : 10
    const out: number[] = []
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v)
    return out
  }, [lo, hi, span])

  const onKey = (e: React.KeyboardEvent) => {
    if (total === 0) return
    const cur = active ?? -1
    let next = cur
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(total - 1, cur + 1)
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, cur - 1)
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = total - 1
    else if (e.key === "Enter" && active !== null) {
      e.preventDefault()
      router.push(flat[active].m.href)
      return
    } else return
    e.preventDefault()
    setActive(next)
  }

  const current = active !== null ? flat[active] : null
  const optId = (i: number) => `${uid}-m${i}`

  if (total === 0) return <p className="text-sm text-muted-foreground" data-viz="gap-strip" data-empty>No students to show in this scope.</p>

  let idx = -1
  return (
    <figure className="flex flex-col gap-2" data-viz="gap-strip">
      <div
        ref={box}
        role="listbox"
        tabIndex={0}
        aria-label={summary}
        aria-activedescendant={current ? optId(active!) : undefined}
        onKeyDown={onKey}
        onFocus={() => { setFocused(true); if (active === null) setActive(0) }}
        onBlur={() => setFocused(false)}
        className="flex flex-col gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {laid.map((l) => (
          <div key={l.lane.id} className="flex flex-col gap-1" role="group" aria-label={`${l.lane.label}, ${l.lane.marks.length} students`}>
            {showLaneLabels ? <span className="text-xs font-medium text-foreground">{`${l.lane.label} (${l.lane.marks.length})`}</span> : null}
            <svg width={width} height={l.height} className="block max-w-full overflow-visible">
              {zero ? <line x1={xOf(zero.value)} x2={xOf(zero.value)} y1={0} y2={l.dots} stroke={VIZ.zero} strokeWidth={1} strokeDasharray="3 3" /> : null}
              <line x1={PAD} x2={PAD + inner} y1={l.dots - 1} y2={l.dots - 1} stroke={VIZ.grid} strokeWidth={1} />
              {l.bracket ? (
                <g aria-hidden="true" data-behind-bracket>
                  <path d={`M${l.bracket.x1} ${l.dots + 3} v4 H${l.bracket.x2} v-4`} fill="none" stroke={VIZ.behindEdge} strokeWidth={1} />
                  <text x={(l.bracket.x1 + l.bracket.x2) / 2} y={l.dots + 20} textAnchor="middle" fontSize={12} fontWeight={500} fill={VIZ.behindInk}>{`${l.bracket.n} ${flaggedWord}`}</text>
                </g>
              ) : null}
              {l.pts.map((p) => {
                idx++
                const i = idx
                const cy = l.dots - 7 - p.row * CELL
                const isActive = active === i && focused
                const fill = p.m.flagged ? VIZ.behind : VIZ.on
                return (
                  <g
                    key={p.m.id}
                    id={optId(i)}
                    role="option"
                    aria-selected={active === i}
                    aria-label={p.m.text}
                    className="cursor-pointer"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => router.push(p.m.href)}
                    data-mark={p.m.flagged ? "behind" : "on"}
                  >
                    <title>{p.m.text}</title>
                    {isActive ? <circle cx={p.x} cy={cy} r={R + 3} fill="none" stroke="var(--ring)" strokeWidth={2} /> : null}
                    {p.m.flagged ? (
                      <rect x={p.x - R} y={cy - R} width={R * 2} height={R * 2} rx={1} fill={fill} stroke="var(--background)" strokeWidth={1} transform={`rotate(45 ${p.x} ${cy})`} />
                    ) : (
                      <circle cx={p.x} cy={cy} r={R} fill={fill} stroke="var(--background)" strokeWidth={1} />
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        ))}
        <svg width={width} height={18} className="block max-w-full overflow-visible" aria-hidden="true">
          {ticks.map((t) => (
            <text key={t} x={xOf(t)} y={13} textAnchor="middle" fontSize={12} fill={zero && t === zero.value ? "var(--foreground)" : "var(--muted-foreground)"}>
              {zero && t === zero.value ? zero.label : tickFormat(t)}
            </text>
          ))}
        </svg>
      </div>
      <p className="min-h-5 text-sm text-foreground" aria-live="polite" data-strip-readout>
        {current ? current.m.text : ""}
      </p>
    </figure>
  )
}

/** The legend inside the card: glyph plus word, never colour alone. */
export function StripLegend({ behindLabel, zeroLabel }: { behindLabel: string; zeroLabel?: string }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      <li className="flex items-center gap-1.5">
        <DotGlyph />
        On track
      </li>
      <li className="flex items-center gap-1.5">
        <DiamondGlyph />
        {behindLabel}
      </li>
      {zeroLabel ? (
        <li className="flex items-center gap-1.5">
          <svg width="10" height="12" aria-hidden="true"><line x1="5" x2="5" y1="0" y2="12" stroke={VIZ.zero} strokeWidth="1" strokeDasharray="3 3" /></svg>
          {zeroLabel}
        </li>
      ) : null}
    </ul>
  )
}
