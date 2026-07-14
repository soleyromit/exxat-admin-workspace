'use client'

/**
 * Response funnel — VIZ-PATTERN-008 (progression-sankey), binding VIZ-009.
 *
 * "Sequential stages (≥3 with attrition) must use Sankey/flow viz, not separated count
 * cards. Drop-off is the story." Every surface in this product measures response rate and
 * none of them shows WHERE it fails — and 71% is four different problems depending on
 * whether students never opened the invite, opened and ignored it, or started and quit.
 * Each has a different fix: deliverability, timing, or survey length.
 *
 * Built on recharts `<Sankey>` because the pattern doc names it ("recharts v2.x has
 * <Sankey>") and recharts is already a dependency — no new dep, and the alternative was a
 * hand-rolled SVG, which is banned. This is the one chart in the analytics set that is NOT
 * Observable Plot: Plot ships no sankey mark, and the DS shell is renderer-agnostic, so the
 * engine follows the chart rather than the other way round.
 *
 * Pattern rules honoured:
 *   · drop-off is amber `--chart-4` + a dashed border, NEVER red (VIZ-004 + A11Y-008's
 *     redundant encoding — colour is never the only signal)
 *   · every node labelled with its count and its delta from the previous stage
 *   · stages in chronological order — never reordered by count; the order IS the meaning
 *   · no legend — node labels carry meaning directly
 *   · one-line takeaway below, naming the largest drop-off
 */

import { useMemo } from 'react'
import { Sankey, Layer, Rectangle, Tooltip } from 'recharts'
import { ChartContainer, Card, CardContent } from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { FUNNEL_STAGE_MEANING, type ResponseFunnel } from '@/lib/pce-funnel'

const config: ChartConfig = {
  flow: { label: 'Students', color: 'var(--chart-1)' },
}

interface SankeyNodeDatum {
  name: string
  count: number
  delta?: number
  isDropoff?: boolean
}

/**
 * Node renderer. recharts hands us x/y/width/height already laid out; we own the paint.
 * Terminal drop-off nodes are amber + dashed so the reader can tell a leak from a stage
 * without reading the label — and can still tell them apart with colour vision differences,
 * because the dash carries the same information.
 */
function FunnelNode(props: {
  x: number
  y: number
  width: number
  height: number
  index: number
  payload: SankeyNodeDatum
}) {
  const { x, y, width, height, payload } = props
  const drop = !!payload.isDropoff
  const labelRight = x < 200

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={drop ? 'var(--chart-4)' : 'var(--chart-1)'}
        fillOpacity={drop ? 0.85 : 1}
        stroke={drop ? 'var(--conditional-rule-orange)' : 'none'}
        strokeDasharray={drop ? '3 2' : undefined}
        radius={2}
      />
      <text
        x={labelRight ? x + width + 8 : x - 8}
        y={y + height / 2 - 5}
        textAnchor={labelRight ? 'start' : 'end'}
        fill="var(--foreground)"
        fontSize={CHART_TICK_FONT_SIZE}
        fontWeight={500}
      >
        {payload.name}
      </text>
      <text
        x={labelRight ? x + width + 8 : x - 8}
        y={y + height / 2 + 9}
        textAnchor={labelRight ? 'start' : 'end'}
        fill="var(--muted-foreground)"
        fontSize={CHART_TICK_FONT_SIZE}
      >
        {payload.count.toLocaleString()}
        {payload.delta != null && payload.delta !== 0 ? ` (−${Math.abs(payload.delta).toLocaleString()})` : ''}
      </text>
    </Layer>
  )
}

export function ResponseFunnelSankey({
  funnel,
  height = 300,
}: {
  funnel: ResponseFunnel
  height?: number
}) {
  const data = useMemo(() => {
    const { counts, worst } = funnel
    /**
     * One terminal node per drop-off, per the pattern's anatomy — a leak has to land
     * somewhere or the flow silently evaporates and the reader cannot see the WHERE.
     */
    const nodes: SankeyNodeDatum[] = [
      { name: 'Invited', count: counts.invited },
      { name: 'Opened', count: counts.opened, delta: counts.invited - counts.opened },
      { name: 'Started', count: counts.started, delta: counts.opened - counts.started },
      { name: 'Completed', count: counts.completed, delta: counts.started - counts.completed },
      { name: 'Never opened', count: counts.invited - counts.opened, isDropoff: true },
      { name: 'Opened, never started', count: counts.opened - counts.started, isDropoff: true },
      { name: 'Started, abandoned', count: counts.started - counts.completed, isDropoff: true },
    ]

    const links = [
      { source: 0, target: 1, value: Math.max(counts.opened, 1) },
      { source: 1, target: 2, value: Math.max(counts.started, 1) },
      { source: 2, target: 3, value: Math.max(counts.completed, 1) },
      { source: 0, target: 4, value: Math.max(counts.invited - counts.opened, 1), drop: 'Invited' },
      { source: 1, target: 5, value: Math.max(counts.opened - counts.started, 1), drop: 'Opened' },
      { source: 2, target: 6, value: Math.max(counts.started - counts.completed, 1), drop: 'Started' },
    ].map((l) => ({
      ...l,
      isDropoff: !!l.drop,
      isLargestDropoff: !!l.drop && worst?.after === l.drop,
    }))

    return { nodes, links }
  }, [funnel])

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <Sankey
        data={data}
        nodePadding={26}
        nodeWidth={12}
        margin={{ top: 10, right: 130, bottom: 10, left: 66 }}
        node={FunnelNode as never}
        link={{
          stroke: 'var(--chart-1)',
          strokeOpacity: 0.28,
        }}
      >
        <Tooltip
          content={({ payload }) => {
            const p = payload?.[0]?.payload as
              | { name?: string; count?: number; payload?: { name?: string } }
              | undefined
            const name = p?.name ?? p?.payload?.name
            if (!name) return null
            const meaning = FUNNEL_STAGE_MEANING[name as keyof typeof FUNNEL_STAGE_MEANING]
            // DS Card, not a hand-rolled rounded+border div — that reads as Card chrome
            // without being one, which the DS touch-gate flags as card-shape masquerade.
            return (
              <Card size="sm" className="max-w-64">
                <CardContent className="px-3 py-2">
                  <p className="text-sm font-medium">{name}</p>
                  {p?.count != null && (
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {p.count.toLocaleString()} students
                    </p>
                  )}
                  {meaning && <p className="mt-1 text-xs text-muted-foreground">{meaning}</p>}
                </CardContent>
              </Card>
            )
          }}
        />
      </Sankey>
    </ChartContainer>
  )
}
