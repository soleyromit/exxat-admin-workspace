"use client"
import * as React from "react"
import { CartesianGrid, LabelList, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@exxatdesignux/ui/components/ui/chart"
import { TONE_COLOR } from "./tokens"

export type Dot = { id: string; label: string; /** 0 to 100 */ value: number; /** Behind pace: drawn as a diamond in amber and labelled. */ flagged?: boolean; /** Extra words for the label, for example "short by 2". */ note?: string }

export type DotStripProps = {
  label: string
  dots: Dot[]
  /** Pace marker on the 0 to 100 axis. */
  pace?: number
  paceLabel?: string
  minLabel?: string
  maxLabel?: string
  /** Shown instead of the strip when there are no dots. */
  emptyText?: string
  className?: string
}

const LANE = 22
const config: ChartConfig = {
  on: { label: "On pace", color: TONE_COLOR.magnitude },
  behind: { label: "Behind pace", color: TONE_COLOR.notMet },
}
const clamp = (n: number) => Math.max(0, Math.min(100, n))

export function DotStrip({ label, dots, pace, paceLabel = "Expected by now", minLabel = "0%", maxLabel = "100%", emptyText = "No students to show.", className }: DotStripProps) {
  // Measure the strip so a label reserves its real width (about 6.6px a character) instead of a fixed share.
  const box = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(600)
  React.useLayoutEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === "undefined") return
    const read = () => { if (el.clientWidth > 0) setWidth(el.clientWidth) }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Greedy lanes: labelled dots reserve more horizontal room than plain ones.
  const placed = React.useMemo(() => {
    const ends: number[] = []
    return [...dots]
      .sort((a, b) => a.value - b.value)
      .map((d) => {
        const v = clamp(d.value)
        const text = d.flagged ? `${d.label}${d.note ? `, ${d.note}` : ""}` : ""
        const room = text ? Math.min(90, ((text.length * 6.6 + 30) / width) * 100) : 0
        const flip = !!d.flagged && v + room > 100
        const start = d.flagged && flip ? v - room : v - 2
        const end = d.flagged && !flip ? v + room : v + 2
        let lane = ends.findIndex((e) => e <= start)
        if (lane === -1) lane = ends.length
        ends[lane] = end
        return { d, v, lane, flip: !!flip }
      })
  }, [dots, width])
  const lanes = Math.max(1, ...placed.map((p) => p.lane + 1))
  const behind = dots.filter((d) => d.flagged).length
  const summary = `${label}: ${dots.length} ${dots.length === 1 ? "person" : "people"}${pace !== undefined ? `, ${behind} behind the expected ${pace}%` : ""}`
  const spokenOf = (d: Dot) => `${d.label}: ${Math.round(d.value)}%${d.flagged ? ", behind pace" : ""}${d.note ? `, ${d.note}` : ""}`
  if (dots.length === 0) return <p className={`text-sm text-muted-foreground ${className ?? ""}`} data-viz="dot-strip" data-empty>{emptyText}</p>
  const pts = placed.map(({ d, v, lane, flip }) => ({ id: d.id, x: v, y: lane, name: d.label, text: `${d.label}${d.note ? `, ${d.note}` : ""}`, spoken: spokenOf(d), flagged: !!d.flagged, flip }))
  const on = pts.filter((p) => !p.flagged)
  const off = pts.filter((p) => p.flagged)
  const circle = (props: { cx?: number; cy?: number }) => <circle cx={props.cx} cy={props.cy} r={6} fill="var(--color-on)" stroke="var(--background)" strokeWidth={2} />
  const diamond = (props: { cx?: number; cy?: number }) => {
    const { cx = 0, cy = 0 } = props
    return <rect x={cx - 5} y={cy - 5} width={10} height={10} rx={1.5} fill="var(--color-behind)" stroke="var(--background)" strokeWidth={2} transform={`rotate(45 ${cx} ${cy})`} />
  }
  // Labels sit beside the diamond; flipped ones sit on its left so they stay inside the strip.
  const renderLabel = (props: { x?: number | string; y?: number | string; index?: number }) => {
    const p = off[props.index ?? 0]
    if (!p) return null
    const x = Number(props.x), y = Number(props.y)
    return <text x={p.flip ? x - 10 : x + 10} y={y} dy={4} textAnchor={p.flip ? "end" : "start"} fontSize={12} fill="var(--foreground)">{p.text}</text>
  }
  return (
    <figure className={`flex flex-col gap-1 ${className ?? ""}`} data-viz="dot-strip">
      <div ref={box} role="group" aria-label={summary}>
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height: lanes * LANE + 16 }}>
          <ScatterChart accessibilityLayer={false} margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
            <YAxis type="number" dataKey="y" domain={[-0.5, lanes - 0.5]} reversed hide />
            {pace !== undefined ? <ReferenceLine x={clamp(pace)} stroke="var(--foreground)" strokeWidth={2} strokeDasharray="5 3" ifOverflow="visible" /> : null}
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(_v, _n, item) => <span>{(item?.payload as { spoken?: string } | undefined)?.spoken}</span>} />} />
            <Scatter data={on} shape={circle} isAnimationActive={false} />
            <Scatter data={off} shape={diamond} isAnimationActive={false}>
              <LabelList content={renderLabel} />
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </div>
      <div className="mx-3 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{minLabel}</span>
        {pace !== undefined ? <span className="text-foreground">{paceLabel} ({pace}%)</span> : null}
        <span>{maxLabel}</span>
      </div>
      <ul className="sr-only">
        {dots.map((d) => (
          <li key={d.id}>{spokenOf(d)}</li>
        ))}
      </ul>
    </figure>
  )
}
