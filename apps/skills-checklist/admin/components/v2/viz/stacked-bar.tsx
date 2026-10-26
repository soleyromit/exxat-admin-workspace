"use client"
import * as React from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@exxatdesignux/ui/components/ui/chart"
import { TONE_COLOR, hatch, plural, type VizTone } from "./tokens"

export type StackedSegment = { id: string; label: string; value: number; tone?: VizTone; /** Texture instead of (or on top of) colour. */ hatched?: boolean }

export type StackedBarProps = {
  /** Names the whole bar, for example "Skills by level". */
  label: string
  segments: StackedSegment[]
  /** Unit noun for the legend and table, for example "skill". */
  unit?: string
  /** Show the visible legend under the bar. Default true. The bar keeps its accessible name either way. */
  showLegend?: boolean
  className?: string
}

const DEFAULT_TONES: VizTone[] = ["magnitude", "series2", "neutral"]

/** DS chart primitive (Recharts) with one stacked horizontal bar. Hatched segments use an SVG pattern so identity survives without colour. */
export function StackedBar({ label, segments, unit = "item", showLegend = true, className }: StackedBarProps) {
  const uid = React.useId().replace(/:/g, "")
  const total = segments.reduce((s, x) => s + x.value, 0)
  const tone = (s: StackedSegment, i: number) => TONE_COLOR[s.tone ?? DEFAULT_TONES[i % DEFAULT_TONES.length]]
  const summary = `${label}: ${segments.map((s) => `${s.value} ${s.label}`).join(", ")}, ${total} ${plural(total, unit, unit + "s")} in all`
  const key = (s: StackedSegment) => `s_${s.id}`
  const config: ChartConfig = Object.fromEntries(segments.map((s, i) => [key(s), { label: s.label, color: tone(s, i) }]))
  const row = Object.fromEntries([["name", label], ...segments.map((s) => [key(s), s.value])])
  const visible = segments.filter((s) => s.value > 0)
  return (
    <figure className={`flex flex-col gap-2 ${className ?? ""}`} data-viz="stacked-bar">
      <div role="img" aria-label={summary}>
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height: 24 }}>
          <BarChart accessibilityLayer={false} data={[row]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={0}>
            <defs>
              {segments.filter((s) => s.hatched).map((s) => (
                <pattern key={s.id} id={`${uid}-${s.id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="var(--background)" />
                  <rect width="2" height="6" fill={tone(s, segments.indexOf(s))} />
                </pattern>
              ))}
            </defs>
            <XAxis type="number" hide domain={[0, Math.max(total, 1)]} />
            <YAxis type="category" dataKey="name" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            {visible.map((s, n) => {
              const c = tone(s, segments.indexOf(s))
              return (
                <Bar
                  key={s.id}
                  dataKey={key(s)}
                  stackId="a"
                  fill={s.hatched ? `url(#${uid}-${s.id})` : c}
                  stroke={s.hatched ? c : "var(--background)"}
                  strokeWidth={s.hatched ? 1 : 1}
                  radius={n === 0 ? [4, 0, 0, 4] : n === visible.length - 1 ? [0, 4, 4, 0] : 0}
                  isAnimationActive={false}
                />
              )
            })}
          </BarChart>
        </ChartContainer>
      </div>
      {showLegend ? <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-hidden="true">
        {segments.map((s, i) => {
          const c = tone(s, i)
          return (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm" style={{ background: s.hatched ? "var(--background)" : c, border: s.hatched ? `1px solid ${c}` : undefined, ...(s.hatched ? hatch(c) : null) }} />
              <span className="text-foreground">{s.label}</span>
              <span className="tabular-nums text-muted-foreground">{s.value}</span>
            </li>
          )
        })}
      </ul> : null}
      <ul className="sr-only">
        {segments.map((s) => (
          <li key={s.id}>{`${s.label}: ${s.value} ${plural(s.value, unit, unit + "s")}`}</li>
        ))}
      </ul>
    </figure>
  )
}
