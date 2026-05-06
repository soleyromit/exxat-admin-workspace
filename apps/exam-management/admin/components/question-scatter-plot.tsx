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
 * Each dot represents one question. Hovering reveals the question stem.
 * Clicking selects the item (handled by parent — currently shows an alert).
 */

import { useMemo, useState } from 'react'

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

const W = 760
const H = 320
const PAD_L = 56
const PAD_R = 16
const PAD_T = 24
const PAD_B = 44
const X_MIN = 0
const X_MAX = 1
const Y_MIN = -0.2
const Y_MAX = 0.7

const xScale = (v: number) => PAD_L + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - PAD_L - PAD_R)
const yScale = (v: number) => PAD_T + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD_T - PAD_B)

export function QuestionScatterPlot({ items, onSelect }: QuestionScatterPlotProps) {
  const [hovered, setHovered] = useState<QuestionItem | null>(null)

  // Quadrant rectangles (computed once)
  const idealRect = useMemo(() => ({
    x: xScale(0.40),
    y: yScale(0.7),
    width: xScale(0.85) - xScale(0.40),
    height: yScale(0.20) - yScale(0.7),
  }), [])

  const negativeRect = useMemo(() => ({
    x: PAD_L,
    y: yScale(0),
    width: W - PAD_L - PAD_R,
    height: yScale(Y_MIN) - yScale(0),
  }), [])

  // Stats for badges
  const stats = useMemo(() => {
    const ideal = items.filter(i => i.difficultyIndex >= 0.40 && i.difficultyIndex <= 0.85 && i.pointBiserial >= 0.2 && !i.negativeDiscriminator).length
    const flagged = items.filter(i => i.negativeDiscriminator).length
    const tooEasy = items.filter(i => i.difficultyIndex > 0.85).length
    const tooHard = items.filter(i => i.difficultyIndex < 0.4 && !i.negativeDiscriminator).length
    return { ideal, flagged, tooEasy, tooHard }
  }, [items])

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <header className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">
            Item map · Difficulty × Point-biserial
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each dot is a question. Hover for details. Items in the green band are well-calibrated.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold uppercase tracking-wider">
          <Stat tone="success" count={stats.ideal} label="Ideal" />
          <Stat tone="neutral" count={stats.tooEasy} label="Too easy" />
          <Stat tone="warning" count={stats.tooHard} label="Too hard" />
          <Stat tone="destructive" count={stats.flagged} label="Flagged" />
        </div>
      </header>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Difficulty vs point-biserial scatter plot"
        >
          {/* Quadrant tints */}
          <rect
            {...idealRect}
            className="fill-chart-2/10"
          />
          <rect
            {...negativeRect}
            className="fill-destructive/8"
          />

          {/* Y=0 reference line (pbis = 0 — discrimination floor) */}
          <line
            x1={PAD_L} y1={yScale(0)} x2={W - PAD_R} y2={yScale(0)}
            className="stroke-destructive/30"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          {/* Y=0.2 reference (acceptable pbis floor) */}
          <line
            x1={PAD_L} y1={yScale(0.2)} x2={W - PAD_R} y2={yScale(0.2)}
            className="stroke-chart-2/35"
            strokeWidth={1}
            strokeDasharray="2 3"
          />

          {/* Gridlines */}
          {[0.25, 0.5, 0.75].map(v => (
            <line
              key={`xg-${v}`}
              x1={xScale(v)} y1={PAD_T} x2={xScale(v)} y2={H - PAD_B}
              className="stroke-border/50"
              strokeWidth={0.5}
            />
          ))}
          {[0.4, 0.6].map(v => (
            <line
              key={`yg-${v}`}
              x1={PAD_L} y1={yScale(v)} x2={W - PAD_R} y2={yScale(v)}
              className="stroke-border/50"
              strokeWidth={0.5}
            />
          ))}

          {/* Axes */}
          <line
            x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B}
            className="stroke-border" strokeWidth={1}
          />
          <line
            x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B}
            className="stroke-border" strokeWidth={1}
          />

          {/* X-axis labels */}
          <g className="fill-muted-foreground text-[10px]">
            {[0, 0.25, 0.5, 0.75, 1].map(v => (
              <text key={v} x={xScale(v)} y={H - PAD_B + 14} textAnchor="middle">
                {Math.round(v * 100)}%
              </text>
            ))}
          </g>
          <text
            x={(PAD_L + W - PAD_R) / 2} y={H - 8}
            className="fill-foreground text-[11px] font-semibold"
            textAnchor="middle"
          >
            Difficulty index — proportion correct
          </text>

          {/* Y-axis labels */}
          <g className="fill-muted-foreground text-[10px]">
            {[-0.2, 0, 0.2, 0.4, 0.6].map(v => (
              <text key={v} x={PAD_L - 8} y={yScale(v) + 3} textAnchor="end">
                {v.toFixed(1)}
              </text>
            ))}
          </g>
          <text
            x={14} y={(PAD_T + H - PAD_B) / 2}
            className="fill-foreground text-[11px] font-semibold"
            textAnchor="middle"
            transform={`rotate(-90 14 ${(PAD_T + H - PAD_B) / 2})`}
          >
            Point-biserial (discrimination)
          </text>

          {/* Zone labels (subtle, top-left of each region) */}
          <g className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider">
            <text x={idealRect.x + 6} y={idealRect.y + 14} className="fill-chart-2/80">Ideal zone</text>
            <text x={negativeRect.x + 6} y={negativeRect.y + 14} className="fill-destructive/80">Negative discrimination</text>
          </g>

          {/* Dots */}
          <g>
            {items.map(item => {
              const cx = xScale(item.difficultyIndex)
              const cy = yScale(item.pointBiserial)
              const isHover = hovered?.questionId === item.questionId && hovered.order === item.order
              const usage = item.timesUsed ?? 1
              const r = 4 + Math.min(4, Math.log2(usage + 1))

              const fillClass =
                item.negativeDiscriminator ? 'fill-destructive' :
                item.difficultyIndex >= 0.40 && item.difficultyIndex <= 0.85 && item.pointBiserial >= 0.2 ? 'fill-chart-2' :
                item.difficultyIndex > 0.85 ? 'fill-muted-foreground' :
                'fill-chart-4'

              return (
                <g
                  key={`${item.questionId}-${item.order}`}
                  onMouseEnter={() => setHovered(item)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect?.(item)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={cx} cy={cy} r={r + (isHover ? 3 : 0)}
                    className={`${fillClass} transition-all`}
                    opacity={isHover ? 0.95 : 0.75}
                  />
                  {isHover && (
                    <circle
                      cx={cx} cy={cy} r={r + 6}
                      className={`${fillClass} opacity-15`}
                    />
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Hover tooltip */}
        {hovered && (
          <div
            className="absolute pointer-events-none rounded-lg border border-border bg-card shadow-lg px-3 py-2 max-w-xs"
            style={{
              left: `${(xScale(hovered.difficultyIndex) / W) * 100}%`,
              top: `${(yScale(hovered.pointBiserial) / H) * 100}%`,
              transform: 'translate(12px, -100%)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded font-mono text-[10px] font-bold px-1 py-0.5 bg-muted text-foreground">
                Q{hovered.order}
              </span>
              <span className="text-[10px] text-muted-foreground">{hovered.code}</span>
            </div>
            <p className="text-xs text-foreground line-clamp-2 leading-snug mb-1">{hovered.title}</p>
            <div className="flex items-center gap-3 text-[10px]">
              <span><span className="text-muted-foreground">D:</span> <strong className="text-foreground">{Math.round(hovered.difficultyIndex * 100)}%</strong></span>
              <span><span className="text-muted-foreground">pbis:</span> <strong className={hovered.pointBiserial < 0 ? 'text-destructive' : hovered.pointBiserial < 0.2 ? 'text-chart-4' : 'text-chart-2'}>{hovered.pointBiserial.toFixed(2)}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
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
