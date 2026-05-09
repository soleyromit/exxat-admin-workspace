'use client'

/**
 * ProgressionSankey — sequential-stage flow with attrition.
 *
 * Implements docs/patterns/viz/progression-sankey.md (VIZ-PATTERN-008).
 * Binds DESIGN.md VIZ-009 (sequential stages MUST use flow viz, not separated cards).
 *
 * Hand-rolled SVG (lightweight) instead of bringing in a Sankey lib — workspace
 * constraint of ≤4 stages typical for survey funnels makes this manageable.
 *
 * Drop-off color discipline: --chart-4 amber + dashed border (NEVER red, VIZ-004).
 * The largest drop-off arc gets --conditional-rule-orange dashed border for
 * redundant encoding (A11Y-008).
 */

import * as React from 'react'

export interface SankeyStage {
  id: string
  label: string
  count: number
}

interface Props {
  /** In chronological order, oldest → newest. Drops are computed pairwise. */
  stages: SankeyStage[]
  /** Total height for the SVG */
  height?: number
  /** Hand-set width; if omitted, fills container */
  width?: number
  /** Label for the largest drop-off (computed) */
  ariaLabel: string
  className?: string
}

export function ProgressionSankey({
  stages,
  height = 280,
  width: widthProp,
  ariaLabel,
  className,
}: Props) {
  if (stages.length < 2) {
    return (
      <div className="text-sm text-muted-foreground italic" role="status">
        At least 2 stages required for flow viz.
      </div>
    )
  }

  const width = widthProp ?? 720
  const padX = 8
  const padY = 24
  const drawW = width - padX * 2
  const drawH = height - padY * 2
  const total = stages[0].count
  const stageW = 96
  const gapW = (drawW - stageW * stages.length) / (stages.length - 1)

  // Compute pairwise drops
  const drops = stages.slice(0, -1).map((stage, i) => {
    const next = stages[i + 1]
    return {
      from: stage,
      to: next,
      lost: stage.count - next.count,
      percent: ((stage.count - next.count) / stage.count) * 100,
    }
  })

  // Find largest drop (for amber-dashed highlight)
  const largestLossIdx = drops.reduce((best, d, i, arr) =>
    d.lost > arr[best].lost ? i : best, 0
  )

  // Position calc — node y centered, height proportional to count
  const heightFor = (count: number) => Math.max(20, (count / total) * drawH)
  const nodeYFor = (count: number) => padY + (drawH - heightFor(count)) / 2

  // x coords for each stage's left edge
  const stageX = stages.map((_, i) => padX + i * (stageW + gapW))

  return (
    <section role="region" aria-label={ariaLabel} className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Funnel: ${stages.map(s => `${s.label} ${s.count}`).join(', ')}. Largest drop-off: ${drops[largestLossIdx].from.label} to ${drops[largestLossIdx].to.label}, lost ${drops[largestLossIdx].lost}.`}
        className="w-full"
        style={{ height }}
      >
        {/* Flow links between adjacent stages */}
        {drops.map((drop, i) => {
          const x1 = stageX[i] + stageW
          const x2 = stageX[i + 1]
          const y1Top = nodeYFor(drop.from.count)
          const y1Bot = y1Top + heightFor(drop.from.count)
          const y2Top = nodeYFor(drop.to.count)
          const y2Bot = y2Top + heightFor(drop.to.count)
          const isLargest = i === largestLossIdx

          // Through-flow path
          const cpOffset = (x2 - x1) * 0.5
          const throughPath = `
            M ${x1} ${y1Top}
            C ${x1 + cpOffset} ${y1Top}, ${x2 - cpOffset} ${y2Top}, ${x2} ${y2Top}
            L ${x2} ${y2Bot}
            C ${x2 - cpOffset} ${y2Bot}, ${x1 + cpOffset} ${y1Bot - (drop.lost / drop.from.count) * heightFor(drop.from.count)}, ${x1} ${y1Bot - (drop.lost / drop.from.count) * heightFor(drop.from.count)}
            Z
          `

          // Drop-off path (the leak)
          const dropTop = y1Bot - (drop.lost / drop.from.count) * heightFor(drop.from.count)
          const dropPath = `
            M ${x1} ${dropTop}
            L ${x1} ${y1Bot}
            L ${x1 + (x2 - x1) * 0.55} ${y1Bot - 4}
            L ${x1 + (x2 - x1) * 0.55} ${dropTop + (y1Bot - dropTop) * 0.3}
            Z
          `

          return (
            <g key={i}>
              <path d={throughPath} fill="var(--chart-1)" opacity={0.3} />
              {drop.lost > 0 && (
                <>
                  <path
                    d={dropPath}
                    fill="var(--chart-4)"
                    opacity={isLargest ? 0.5 : 0.35}
                    style={
                      isLargest
                        ? { stroke: 'var(--conditional-rule-orange)', strokeWidth: 1, strokeDasharray: '3 2' }
                        : undefined
                    }
                  />
                  <text
                    x={x1 + (x2 - x1) * 0.3}
                    y={y1Bot - 4}
                    fill="var(--chart-4)"
                    fontSize="11"
                    fontWeight={isLargest ? 600 : 400}
                  >
                    −{drop.lost}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* Stage nodes */}
        {stages.map((stage, i) => {
          const x = stageX[i]
          const y = nodeYFor(stage.count)
          const h = heightFor(stage.count)
          const isFinal = i === stages.length - 1
          return (
            <g key={stage.id}>
              <rect
                x={x}
                y={y}
                width={stageW}
                height={h}
                rx={4}
                fill={isFinal ? 'var(--muted)' : 'var(--chart-1)'}
              />
              <text
                x={x + stageW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight={500}
                fill="var(--foreground)"
              >
                {stage.label}
              </text>
              <text
                x={x + stageW / 2}
                y={y + h + 14}
                textAnchor="middle"
                fontSize="11"
                fill="var(--muted-foreground)"
              >
                {stage.count.toLocaleString()}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Takeaway sentence (chart-self-explains, per VIZ-008) */}
      <p className="text-xs text-muted-foreground mt-2 px-2">
        Largest drop-off:{' '}
        <strong style={{ color: 'var(--chart-4)' }}>
          {drops[largestLossIdx].from.label} → {drops[largestLossIdx].to.label}
        </strong>{' '}
        ({drops[largestLossIdx].lost} of {drops[largestLossIdx].from.count.toLocaleString()},
        {' '}{drops[largestLossIdx].percent.toFixed(1)}%).
      </p>
    </section>
  )
}
