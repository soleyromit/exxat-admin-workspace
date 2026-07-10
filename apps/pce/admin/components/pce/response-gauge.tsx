'use client'

/**
 * ResponseGauge — response-rate readout: rate % + count text with an optional
 * fill bar above. The text carries the accessible value; the bar is decorative.
 *
 * Converted to the DS chart system (ChartContainer + recharts) — Romit
 * directive Jul 7 2026: no hand-rolled `<svg>`/`<div>` viz.
 */

import { ChartContainer } from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'

interface ResponseGaugeProps {
  rate: number
  responseCount: number
  enrollmentCount: number
  showBar?: boolean
  size?: 'sm' | 'md'
}

const gaugeConfig: ChartConfig = { v: { label: 'Response rate', color: 'var(--brand-color)' } }

export function ResponseGauge({
  rate,
  responseCount,
  enrollmentCount,
  showBar = true,
  size = 'sm',
}: ResponseGaugeProps) {
  const barHeight = size === 'md' ? 6 : 4

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {showBar && (
        <ChartContainer
          config={gaugeConfig}
          className="aspect-auto w-full"
          style={{ height: barHeight, minWidth: 80 }}
          aria-hidden="true"
        >
          <BarChart
            accessibilityLayer={false}
            layout="vertical"
            data={[{ name: 'rate', v: Math.min(Math.max(rate, 0), 100) }]}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar
              dataKey="v"
              fill="var(--color-v)"
              background={{ fill: 'var(--muted)', radius: 3 }}
              radius={3}
              barSize={barHeight}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      )}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-semibold tabular-nums text-foreground"
          style={{ fontSize: size === 'md' ? 14 : 13 }}
        >
          {rate}%
        </span>
        <span className="text-xs text-muted-foreground">
          {responseCount} / {enrollmentCount}
        </span>
      </div>
    </div>
  )
}
