"use client"
import * as React from "react"
import { Bar, BarChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@exxatdesignux/ui/components/ui/chart"
import { TONE_COLOR, type VizTone } from "./tokens"

export type BulletMeterProps = {
  /** Visible name, also the accessible name. */
  label: string
  value: number
  /** Required minimum: drawn as a tick, and the scale ends at max(required, value, pace) unless `max` is set. */
  required: number
  /** Optional pace marker ("expected by now"). */
  pace?: number
  max?: number
  tone?: VizTone
  /** Printed count beside the meter. Defaults to "value of required". */
  valueText?: string
  unit?: string
  className?: string
}

/** DS chart primitive (Recharts): one bar on a muted track, a solid tick at the minimum and a dashed tick at pace. */
export function BulletMeter({ label, value, required, pace, max, tone = "magnitude", valueText, unit = "", className }: BulletMeterProps) {
  const scale = max ?? Math.max(required, value, pace ?? 0, 1)
  const text = valueText ?? `${value} of ${required}`
  const spoken = `${label}: ${value}${unit} counted, minimum ${required}${unit}${pace !== undefined ? `, expected by now ${pace}${unit}` : ""}`
  const met = value >= required
  const config: ChartConfig = { value: { label: "Counted", color: TONE_COLOR[tone] } }
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`} data-viz="bullet-meter">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {met ? <i className="fa-solid fa-circle-check mr-1" style={{ color: TONE_COLOR.met }} aria-hidden="true" /> : null}
          {text}
        </span>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={scale} aria-valuenow={Math.min(value, scale)} aria-valuetext={spoken}>
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height: 16 }}>
          <BarChart accessibilityLayer={false} data={[{ name: label, value: Math.min(value, scale) }]} layout="vertical" margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <XAxis type="number" hide domain={[0, scale]} />
            <YAxis type="category" dataKey="name" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={() => <span className="tabular-nums">{spoken}</span>} />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} background={{ fill: "var(--muted)", radius: 4 }} barSize={8} isAnimationActive={false} />
            <ReferenceLine x={required} stroke="var(--foreground)" strokeWidth={2} ifOverflow="visible" />
            {pace !== undefined ? <ReferenceLine x={pace} stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="3 2" ifOverflow="visible" /> : null}
          </BarChart>
        </ChartContainer>
      </div>
      <p className="sr-only">{spoken}</p>
    </div>
  )
}
