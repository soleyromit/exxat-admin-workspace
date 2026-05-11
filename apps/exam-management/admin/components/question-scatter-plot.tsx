'use client'

/**
 * QUESTION SCATTER PLOT — distinctive per-question viz.
 *
 * Aarti's "embedded workflow intelligence" framing: surface the data inline,
 * not in a separate Reports section. This 2D plot shows every item's
 * difficulty (x-axis) vs point-biserial (y-axis) at a glance. Quadrant tints
 * make problem zones immediately obvious:
 *
 *   - Ideal zone: difficulty 0.40–0.85, pbis ≥ 0.20  → success tint
 *   - Too easy:   difficulty ≥ 0.85                  → neutral tint
 *   - Too hard:   difficulty < 0.40                  → warning tint
 *   - Negative discriminator: pbis < 0               → destructive tint (item likely flawed)
 *
 * Each dot represents one question; the dot size encodes historical usage
 * (`timesUsed`) via Recharts ZAxis. Hovering reveals the question stem.
 * Clicking selects the item (handled by parent).
 *
 * Migrated from hand-rolled SVG to ChartContainer + Recharts ScatterChart
 * per chart.md depth audit (2026-05-11). LOC trimmed ~280 → ~195; gains
 * `accessibilityLayer` (keyboard nav) and themed via `var(--color-<key>)`.
 */

import { useMemo } from 'react'
import {
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import {
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@exxat/ds/packages/ui/src'

export interface QuestionItem {
  order: number
  questionId: string
  code: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  difficultyIndex: number   // 0..1
  pointBiserial: number     // -0.2..0.7 typical
  negativeDiscriminator: boolean
  /** times used historically — drives dot size */
  timesUsed?: number
}

export interface QuestionScatterPlotProps {
  items: QuestionItem[]
  onSelect?: (item: QuestionItem) => void
}

type BandKey = 'ideal' | 'tooEasy' | 'tooHard' | 'flagged'

const BAND_COLORS: Record<BandKey, string> = {
  ideal:       'var(--chart-2)',
  tooEasy:     'var(--muted-foreground)',
  tooHard:     'var(--chart-4)',
  flagged:     'var(--destructive)',
}

const CHART_CONFIG = {
  ideal:   { label: 'Ideal',     color: 'var(--chart-2)' },
  tooEasy: { label: 'Too easy',  color: 'var(--muted-foreground)' },
  tooHard: { label: 'Too hard',  color: 'var(--chart-4)' },
  flagged: { label: 'Flagged',   color: 'var(--destructive)' },
} satisfies ChartConfig

function classify(item: QuestionItem): BandKey {
  if (item.negativeDiscriminator) return 'flagged'
  if (item.difficultyIndex >= 0.4 && item.difficultyIndex <= 0.85 && item.pointBiserial >= 0.2) return 'ideal'
  if (item.difficultyIndex > 0.85) return 'tooEasy'
  return 'tooHard'
}

export function QuestionScatterPlot({ items, onSelect }: QuestionScatterPlotProps) {
  // Stats for header badges
  const stats = useMemo(() => {
    const ideal = items.filter(i => classify(i) === 'ideal').length
    const flagged = items.filter(i => classify(i) === 'flagged').length
    const tooEasy = items.filter(i => classify(i) === 'tooEasy').length
    const tooHard = items.filter(i => classify(i) === 'tooHard').length
    return { ideal, flagged, tooEasy, tooHard }
  }, [items])

  // Pre-classified for Cell coloring + tooltip metadata
  const data = useMemo(
    () => items.map(item => ({
      ...item,
      band: classify(item),
      // Recharts ZAxis range maps `usage` value → dot area; log-scale prep.
      usage: Math.max(1, item.timesUsed ?? 1),
    })),
    [items]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold">
          Item map · Difficulty × Point-biserial
        </CardTitle>
        <CardDescription className="text-xs">
          Each dot is a question. Hover for details. Items in the green band are well-calibrated.
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold uppercase tracking-wider">
            <Stat tone="success" count={stats.ideal} label="Ideal" />
            <Stat tone="neutral" count={stats.tooEasy} label="Too easy" />
            <Stat tone="warning" count={stats.tooHard} label="Too hard" />
            <Stat tone="destructive" count={stats.flagged} label="Flagged" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={CHART_CONFIG}
          className="aspect-auto h-[320px] w-full"
        >
          <ScatterChart
            accessibilityLayer
            margin={{ top: 18, right: 16, bottom: 28, left: 12 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            {/* Quadrant tints (drawn behind dots) */}
            <ReferenceArea
              x1={0.4} x2={0.85} y1={0.2} y2={0.7}
              fill="var(--chart-2)"
              fillOpacity={0.1}
              stroke="none"
              ifOverflow="hidden"
            />
            <ReferenceArea
              x1={0} x2={1} y1={-0.2} y2={0}
              fill="var(--destructive)"
              fillOpacity={0.08}
              stroke="none"
              ifOverflow="hidden"
            />

            {/* Reference lines: pbis=0 (discrimination floor) and pbis=0.2 (acceptable floor) */}
            <ReferenceLine
              y={0}
              stroke="var(--destructive)"
              strokeOpacity={0.3}
              strokeDasharray="4 3"
              strokeWidth={1}
            />
            <ReferenceLine
              y={0.2}
              stroke="var(--chart-2)"
              strokeOpacity={0.35}
              strokeDasharray="2 3"
              strokeWidth={1}
            />

            <XAxis
              type="number"
              dataKey="difficultyIndex"
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              label={{
                value: 'Difficulty index — proportion correct',
                position: 'insideBottom',
                offset: -16,
                style: { fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 },
              }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              type="number"
              dataKey="pointBiserial"
              domain={[-0.2, 0.7]}
              ticks={[-0.2, 0, 0.2, 0.4, 0.6]}
              tickFormatter={(v) => Number(v).toFixed(1)}
              label={{
                value: 'Point-biserial (discrimination)',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: { fill: 'var(--foreground)', fontSize: 11, fontWeight: 600, textAnchor: 'middle' },
              }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            {/* Dot size = historical usage. Range maps to area (px²). */}
            <ZAxis type="number" dataKey="usage" range={[40, 220]} name="Times used" />

            <ChartTooltip
              cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(_value, _name, item) => {
                    const p = item.payload as (typeof data)[number]
                    return (
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded font-mono text-[10px] font-bold px-1 py-0.5 bg-muted text-foreground">
                            Q{p.order}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{p.code}</span>
                        </div>
                        <p className="text-xs text-foreground line-clamp-2 leading-snug max-w-[220px]">{p.title}</p>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span><span className="text-muted-foreground">D:</span> <strong className="text-foreground tabular-nums">{Math.round(p.difficultyIndex * 100)}%</strong></span>
                          <span><span className="text-muted-foreground">pbis:</span> <strong className="text-foreground tabular-nums">{p.pointBiserial.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    )
                  }}
                />
              }
            />

            <Scatter
              data={data}
              fillOpacity={0.75}
              onClick={(payload) => onSelect?.(payload as unknown as QuestionItem)}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={`${d.questionId}-${d.order}`} fill={BAND_COLORS[d.band]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function Stat({ tone, count, label }: { tone: 'success' | 'neutral' | 'warning' | 'destructive'; count: number; label: string }) {
  const fg =
    tone === 'success' ? 'text-chart-2' :
    tone === 'warning' ? 'text-chart-4' :
    tone === 'destructive' ? 'text-destructive' :
    'text-muted-foreground'
  return (
    <span className="inline-flex items-center gap-1.5 px-1">
      <span className={`font-bold tabular-nums ${fg}`}>{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}
