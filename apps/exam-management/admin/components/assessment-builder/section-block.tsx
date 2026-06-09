'use client'

import { Button } from '@exxatdesignux/ui'
import { QuestionCard, type QuestionCardProps } from './question-card'

interface SectionBlockProps {
  index: number
  title: string
  facultyLabel?: string | null
  ready: boolean
  questionCount: number
  target?: number | null
  cards: Array<QuestionCardProps & { rowKey: string }>
  onAnalysis?: () => void
  onAdd?: (mode: 'qb' | 'ai' | 'write' | 'pdf') => void
}

const ADD_ACTIONS: { mode: 'qb' | 'ai' | 'write' | 'pdf'; icon: string; label: string }[] = [
  { mode: 'qb', icon: 'fa-magnifying-glass', label: 'Search QB' },
  { mode: 'ai', icon: 'fa-sparkles', label: 'AI Generate' },
  { mode: 'write', icon: 'fa-pen-line', label: 'New question' },
  { mode: 'pdf', icon: 'fa-file-arrow-up', label: 'Upload doc' },
]

/**
 * One section in the Build-tab canvas (D1): a card-top header + its question
 * cards, stacked. All sections render together in one scrolling column,
 * mirroring the Claude Design builder. The parent computes each card's props.
 */
export function SectionBlock(p: SectionBlockProps) {
  return (
    <section className="px-3.5 pt-4">
      {/* Section header */}
      <div className="flex items-center gap-2 px-0.5 pb-2">
        <span className="text-sm font-semibold text-foreground">{p.index + 1}. {p.title}</span>
        {p.facultyLabel && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-border" aria-hidden="true">·</span>
            <i className="fa-light fa-user text-[11px]" aria-hidden="true" />
            {p.facultyLabel}
          </span>
        )}
        <div className="flex-1" />
        {p.ready ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-[var(--chart-2)]">
            <i className="fa-solid fa-circle-check text-[11px]" aria-hidden="true" />
            Ready
          </span>
        ) : (
          <span className="text-xs text-muted-foreground tabular-nums">
            {p.questionCount}{p.target ? `/${p.target}` : ''} Q
          </span>
        )}
        {p.questionCount > 0 && p.onAnalysis && (
          <Button variant="ghost" size="icon-xs" aria-label={`Analysis for ${p.title}`} title="View section analysis" onClick={p.onAnalysis} className="text-muted-foreground">
            <i className="fa-light fa-chart-simple" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Per-section add toolbar */}
      {p.onAdd && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {ADD_ACTIONS.map(a => (
            <Button key={a.mode} variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => p.onAdd!(a.mode)}>
              <i className={`fa-light ${a.icon} text-[11px]`} aria-hidden="true" />
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {/* Question cards (or per-section empty) */}
      {p.cards.length === 0 ? (
        <p className="px-4 py-5 text-center text-sm text-muted-foreground">No questions yet — add from the toolbar above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {p.cards.map(({ rowKey, ...card }) => <QuestionCard key={rowKey} {...card} />)}
        </div>
      )}
    </section>
  )
}
