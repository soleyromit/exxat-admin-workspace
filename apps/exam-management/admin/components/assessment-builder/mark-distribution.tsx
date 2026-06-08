'use client'

import { useState } from 'react'
import { Button } from '@exxatdesignux/ui'
import type { AssessmentDraft } from '@/lib/qb-types'

interface Props {
  asmt: AssessmentDraft
}

// Section accent palette — brand + chart tokens, no red (per score-viz rule).
const SEG_COLORS = ['var(--brand-color)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-1)', 'var(--chart-3)']

/**
 * Mark Distribution — stacked bar of per-section marks + a stats row,
 * mirroring the Claude Design assessment-builder.html Structure-tab card.
 */
export function MarkDistribution({ asmt }: Props) {
  const [asPct, setAsPct] = useState(false)

  const pointsOf = (qid: string) => asmt.questions.find(q => q.questionId === qid)?.points ?? 0
  const rows = asmt.sections.map((s, i) => {
    const marks = s.questionIds.reduce((sum, qid) => sum + pointsOf(qid), 0)
    return { id: s.id, title: s.title, marks, count: s.questionIds.length, color: SEG_COLORS[i % SEG_COLORS.length] }
  })
  const total = rows.reduce((s, r) => s + r.marks, 0)
  if (rows.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <span className="text-sm font-semibold text-foreground">Mark Distribution</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAsPct(v => !v)}
            aria-pressed={asPct}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            Show as {asPct ? 'marks' : '%'}
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">Total <span className="font-semibold text-foreground">{total}</span> marks</span>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="px-5 pt-2.5 pb-3">
        <div className="flex h-7 gap-[3px]">
          {rows.map(r => {
            const pct = total > 0 ? (r.marks / total) * 100 : 0
            return (
              <div
                key={r.id}
                className="flex items-center justify-center rounded-md text-[11px] font-semibold text-white overflow-hidden whitespace-nowrap"
                style={{ width: `${pct}%`, background: r.color, minWidth: pct > 0 ? 28 : 0 }}
                title={`${r.title} — ${r.marks} marks (${Math.round(pct)}%)`}
              >
                {pct >= 8 && (asPct ? `${Math.round(pct)}%` : r.marks)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-section stats */}
      <div className="grid border-t border-border" style={{ gridTemplateColumns: `repeat(${rows.length}, 1fr)` }}>
        {rows.map((r, i) => {
          const pct = total > 0 ? Math.round((r.marks / total) * 100) : 0
          return (
            <div key={r.id} className={`px-5 py-2.5 ${i < rows.length - 1 ? 'border-r border-border' : ''}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="size-2 rounded-full shrink-0" style={{ background: r.color }} aria-hidden="true" />
                <span className="text-xs font-medium text-foreground truncate">{r.title}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-foreground tabular-nums">{r.marks}</span>
                <span className="text-xs text-muted-foreground">marks · {pct}%</span>
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">{r.count} question{r.count !== 1 ? 's' : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
