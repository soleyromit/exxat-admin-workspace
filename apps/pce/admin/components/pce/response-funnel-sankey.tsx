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
 * HAND-ROLLED SVG — documented per docs/governance/ds-adoption.md § Visualization ("sankey"
 * is explicitly HAND-ROLL ALLOWED) and logged in apps/pce/docs/patterns/viz-handrolled.md.
 * This replaces a recharts `<Sankey>` implementation. Recharts was the only recharts import
 * on THIS tab (Overview) and its By Term/By Faculty/By Course siblings under
 * app/(app)/analytics/page.tsx — every other chart across those four tabs is already
 * Observable Plot, which ships no Sankey mark — and pulled recharts' core runtime
 * (state/cartesian/component/util chunks, ~2MB decoded in dev) into the bundle for this one
 * chart. (The separate app/(app)/analytics/programmatic/ route still has its own recharts
 * charts — out of scope here, not part of the four-tab page this fix targeted.) Per
 * docs/patterns/viz/progression-sankey.md:106 ("If recharts/Sankey isn't sufficient... use
 * react-d3-sankey or hand-roll. Discuss with Himanshu before adding a new dep"), hand-rolling
 * is the endorsed path that avoids a new dependency entirely — and the topology here is fixed
 * and small (4 main-chain nodes, one drop-off terminal after each of the first three; 7 nodes,
 * 6 links total), so a generic graph-layout library buys nothing a few lines of arithmetic
 * can't do.
 *
 * This version also closes a gap the recharts one had: `isDropoff`/`isLargestDropoff` were
 * computed per link but never actually applied to rendering — every link painted the same
 * flat `--chart-1`. This version applies the pattern's real spec (see "Pattern rules" below).
 *
 * Pattern rules honoured:
 *   · every drop-off NODE is amber `--chart-4` fill + a dashed `--conditional-rule-orange`
 *     border, NEVER red — a categorical, redundant cue that a node is an exit, not a stage
 *     (VIZ-004 + A11Y-008: colour is never the only signal)
 *   · the single LARGEST drop-off LINK carries that same dashed-orange outline too, layering
 *     severity on top of the categorical node treatment — the pattern's annotation discipline
 *   · every node labelled with its count and its delta from the previous stage
 *   · stages in chronological order — never reordered by count
 *   · no legend — node labels carry meaning directly
 *   · one-line takeaway below (rendered by the caller), naming the largest drop-off
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@exxatdesignux/ui'
import { CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { FUNNEL_STAGE_MEANING, type FunnelStage, type ResponseFunnel } from '@/lib/pce-funnel'

/** Fixed topology: main chain (col 0-3) + one drop-off terminal after each of the first three. */
type NodeId = 'invited' | 'opened' | 'started' | 'completed' | 'dropAfterInvited' | 'dropAfterOpened' | 'dropAfterStarted'

interface LaidOutNode {
  id: NodeId
  name: string
  count: number
  delta: number | null
  isDropoff: boolean
  col: number
  x: number
  yTop: number
  yBottom: number
}

interface LaidOutLink {
  id: string
  sourceId: NodeId
  targetId: NodeId
  isDropoff: boolean
  isLargestDropoff: boolean
  path: string
}

const NODE_WIDTH = 12
const GAP = 8
const MARGIN = { top: 32, right: 176, bottom: 8, left: 4 }

/** Standard sankey-ribbon shape: two mirrored cubic beziers forming a closed band. */
function ribbonPath(x0: number, y0Top: number, y0Bottom: number, x1: number, y1Top: number, y1Bottom: number): string {
  const xm = (x0 + x1) / 2
  return [
    `M${x0},${y0Top}`,
    `C${xm},${y0Top} ${xm},${y1Top} ${x1},${y1Top}`,
    `L${x1},${y1Bottom}`,
    `C${xm},${y1Bottom} ${xm},${y0Bottom} ${x0},${y0Bottom}`,
    'Z',
  ].join('')
}

function useMeasuredWidth() {
  const holder = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = holder.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth((prev) => (Math.abs(prev - w) < 1 ? prev : w))
    })
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return { holder, width }
}

function layout(funnel: ResponseFunnel, width: number, height: number) {
  const { counts, worst } = funnel
  const chartW = Math.max(width - MARGIN.left - MARGIN.right - NODE_WIDTH, 1)
  const chartH = Math.max(height - MARGIN.top - MARGIN.bottom, 1)
  const colX = (col: number) => MARGIN.left + col * (chartW / 3)

  // Invited is always the largest count (every later stage is a subset of it), so it anchors
  // the scale — GAP is reserved once because column 1 (opened + its drop-off) is the tightest
  // fit: opened + (invited − opened) sums to exactly `invited`, with no slack of its own.
  const scale = (chartH - GAP) / Math.max(counts.invited, 1)

  const mainVals: Record<'invited' | 'opened' | 'started' | 'completed', number> = counts
  const dropVals = {
    dropAfterInvited: counts.invited - counts.opened,
    dropAfterOpened: counts.opened - counts.started,
    dropAfterStarted: counts.started - counts.completed,
  }

  const mainCols: Array<{ id: 'invited' | 'opened' | 'started' | 'completed'; name: string; col: number; prev: number | null }> = [
    { id: 'invited', name: 'Invited', col: 0, prev: null },
    { id: 'opened', name: 'Opened', col: 1, prev: counts.invited },
    { id: 'started', name: 'Started', col: 2, prev: counts.opened },
    { id: 'completed', name: 'Completed', col: 3, prev: counts.started },
  ]

  const nodes: LaidOutNode[] = mainCols.map(({ id, name, col, prev }) => {
    const x = colX(col)
    const h = mainVals[id] * scale
    return {
      id,
      name,
      count: mainVals[id],
      delta: prev == null ? null : mainVals[id] - prev,
      isDropoff: false,
      col,
      x,
      yTop: MARGIN.top,
      yBottom: MARGIN.top + h,
    }
  })

  const dropDefs: Array<{ id: NodeId; name: string; sourceCol: number; value: number }> = [
    { id: 'dropAfterInvited', name: 'Never opened', sourceCol: 0, value: dropVals.dropAfterInvited },
    { id: 'dropAfterOpened', name: 'Opened, never started', sourceCol: 1, value: dropVals.dropAfterOpened },
    { id: 'dropAfterStarted', name: 'Started, abandoned', sourceCol: 2, value: dropVals.dropAfterStarted },
  ]

  dropDefs.forEach(({ id, name, sourceCol, value }) => {
    const mainAtTarget = nodes[sourceCol + 1]! // the main node sharing this drop node's column
    const h = value * scale
    const yTop = mainAtTarget.yBottom + GAP
    nodes.push({
      id,
      name,
      count: value,
      delta: null,
      isDropoff: true,
      col: sourceCol + 1,
      x: mainAtTarget.x,
      yTop,
      yBottom: yTop + h,
    })
  })

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<NodeId, LaidOutNode>

  const linkDefs: Array<{ sourceId: NodeId; targetId: NodeId; stage: FunnelStage | null }> = [
    { sourceId: 'invited', targetId: 'opened', stage: null },
    { sourceId: 'opened', targetId: 'started', stage: null },
    { sourceId: 'started', targetId: 'completed', stage: null },
    { sourceId: 'invited', targetId: 'dropAfterInvited', stage: 'Invited' },
    { sourceId: 'opened', targetId: 'dropAfterOpened', stage: 'Opened' },
    { sourceId: 'started', targetId: 'dropAfterStarted', stage: 'Started' },
  ]

  const links: LaidOutLink[] = linkDefs.map(({ sourceId, targetId, stage }) => {
    const source = byId[sourceId]
    const target = byId[targetId]
    const x0 = source.x + NODE_WIDTH
    const x1 = target.x
    // The continuing flow always occupies the TOP of the source node (its full remaining
    // value after this stage); the drop flow occupies whatever is left below it — so a
    // drop-off node's height and its source sliver's height match exactly, by construction.
    const isContinue = stage == null
    const srcTop = isContinue ? source.yTop : source.yTop + (target.yBottom - target.yTop)
    const srcBottom = isContinue ? source.yTop + (target.yBottom - target.yTop) : source.yBottom
    return {
      id: `${sourceId}->${targetId}`,
      sourceId,
      targetId,
      isDropoff: stage != null,
      isLargestDropoff: stage != null && worst?.after === stage,
      path: ribbonPath(x0, srcTop, srcBottom, x1, target.yTop, target.yBottom),
    }
  })

  return { nodes, links }
}

export function ResponseFunnelSankey({
  funnel,
  height = 300,
}: {
  funnel: ResponseFunnel
  height?: number
}) {
  const { holder, width } = useMeasuredWidth()
  const [hoverId, setHoverId] = useState<NodeId | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)

  const { nodes, links } = useMemo(
    () => layout(funnel, width || 480, height),
    [funnel, width, height],
  )

  const hoveredNode = hoverId ? nodes.find((n) => n.id === hoverId) ?? null : null

  const onNodeHover = (n: LaidOutNode, e: React.MouseEvent<SVGElement>) => {
    const box = holder.current?.getBoundingClientRect()
    setHoverId(n.id)
    setHoverPos(box ? { x: e.clientX - box.left, y: e.clientY - box.top } : null)
  }

  return (
    <div ref={holder} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          onMouseLeave={() => setHoverId(null)}
        >
          {links.map((l) => (
            <path
              key={l.id}
              d={l.path}
              fill={l.isDropoff ? 'var(--chart-4)' : 'var(--chart-1)'}
              fillOpacity={hoverId && (hoverId === l.sourceId || hoverId === l.targetId) ? 0.55 : 0.28}
              stroke={l.isLargestDropoff ? 'var(--conditional-rule-orange)' : 'none'}
              strokeDasharray={l.isLargestDropoff ? '3 2' : undefined}
              strokeWidth={l.isLargestDropoff ? 1 : 0}
              style={{ transition: 'fill-opacity 120ms ease' }}
            />
          ))}
          {nodes.map((n) => (
            <g
              key={n.id}
              onMouseEnter={(e) => onNodeHover(n, e)}
              onMouseMove={(e) => onNodeHover(n, e)}
            >
              <rect
                x={n.x}
                y={n.yTop}
                width={NODE_WIDTH}
                height={Math.max(n.yBottom - n.yTop, 1.5)}
                rx={2}
                fill={n.isDropoff ? 'var(--chart-4)' : 'var(--chart-1)'}
                fillOpacity={n.isDropoff ? 0.85 : 1}
                stroke={n.isDropoff ? 'var(--conditional-rule-orange)' : 'none'}
                strokeDasharray={n.isDropoff ? '3 2' : undefined}
              />
              {n.isDropoff ? (
                <>
                  <text
                    x={n.x + NODE_WIDTH + 8}
                    y={(n.yTop + n.yBottom) / 2 - 5}
                    textAnchor="start"
                    fill="var(--foreground)"
                    fontSize={CHART_TICK_FONT_SIZE}
                    fontWeight={500}
                  >
                    {n.name}
                  </text>
                  <text
                    x={n.x + NODE_WIDTH + 8}
                    y={(n.yTop + n.yBottom) / 2 + 9}
                    textAnchor="start"
                    fill="var(--muted-foreground)"
                    fontSize={CHART_TICK_FONT_SIZE}
                  >
                    {n.count.toLocaleString()}
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={n.x + NODE_WIDTH / 2}
                    y={n.yTop - 20}
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fontSize={CHART_TICK_FONT_SIZE}
                    fontWeight={500}
                  >
                    {n.name}
                  </text>
                  <text
                    x={n.x + NODE_WIDTH / 2}
                    y={n.yTop - 6}
                    textAnchor="middle"
                    fill="var(--muted-foreground)"
                    fontSize={CHART_TICK_FONT_SIZE}
                  >
                    {n.count.toLocaleString()}
                    {n.delta != null && n.delta !== 0 ? ` (−${Math.abs(n.delta).toLocaleString()})` : ''}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
      )}

      {hoveredNode && hoverPos && (
        // DS Card, not a hand-rolled rounded+border div — that reads as Card chrome without
        // being one, which the DS touch-gate flags as card-shape masquerade.
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: hoverPos.x + 12, top: hoverPos.y + 12 }}
        >
          <Card size="sm" className="max-w-64">
            <CardContent className="px-3 py-2">
              <p className="text-sm font-medium">{hoveredNode.name}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {hoveredNode.count.toLocaleString()} students
              </p>
              {FUNNEL_STAGE_MEANING[hoveredNode.name as keyof typeof FUNNEL_STAGE_MEANING] && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {FUNNEL_STAGE_MEANING[hoveredNode.name as keyof typeof FUNNEL_STAGE_MEANING]}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
