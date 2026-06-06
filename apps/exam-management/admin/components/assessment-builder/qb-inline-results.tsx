'use client'

import { Badge, Button } from '@exxatdesignux/ui'
import type { Question } from '@/lib/qb-types'

interface QbInlineResultsProps {
  results: Question[]
  totalCount: number
  /** Index of the result row whose detail panel is open (-1 = none) */
  activeIndex: number
  onResultClick: (question: Question, index: number) => void
}

const MAX_VISIBLE = 3

export function QbInlineResults({
  results,
  totalCount,
  activeIndex,
  onResultClick,
}: QbInlineResultsProps) {
  if (results.length === 0) return null

  const visible = results.slice(0, MAX_VISIBLE)
  const hiddenCount = totalCount - MAX_VISIBLE

  return (
    <div className="border-b border-[var(--border)]">
      <div className="px-3 py-1.5">
        <span className="text-xs text-[var(--muted-foreground)]">
          {totalCount} result{totalCount !== 1 ? 's' : ''} from question bank
        </span>
      </div>

      {visible.map((q, i) => (
        <Button
          key={q.id}
          variant="ghost"
          onClick={() => onResultClick(q, i)}
          className={[
            'w-full flex items-center gap-3 px-3 py-2 text-left h-auto justify-start',
            'border-t border-[var(--border)] transition-colors rounded-none',
            'hover:bg-[var(--muted)]',
            activeIndex === i ? 'bg-[var(--muted)]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={activeIndex === i}
          aria-label={`View question: ${q.title}`}
        >
          {/* Row number */}
          <span className="shrink-0 w-4 text-xs text-[var(--muted-foreground)] text-right">
            {i + 1}
          </span>

          {/* Truncated stem */}
          <span className="flex-1 text-sm truncate text-[var(--foreground)]">
            {q.title}
          </span>

          {/* Type badge */}
          <Badge variant="outline" className="shrink-0 text-xs h-5 px-1.5">
            {q.type}
          </Badge>

          {/* Difficulty badge */}
          <Badge
            variant="outline"
            className="shrink-0 text-xs h-5 px-1.5"
            style={{
              color:
                q.difficulty === 'Hard'
                  ? 'var(--destructive)'
                  : q.difficulty === 'Easy'
                  ? 'var(--brand-color)'
                  : 'var(--foreground)',
            }}
          >
            {q.difficulty}
          </Badge>
        </Button>
      ))}

      {hiddenCount > 0 && (
        <div className="px-3 py-1.5 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)]">
            {hiddenCount} more result{hiddenCount !== 1 ? 's' : ''} ↓
          </span>
        </div>
      )}
    </div>
  )
}
