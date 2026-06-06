'use client'

import { useState } from 'react'
import { Button, Badge, Separator } from '@exxatdesignux/ui'
import type { GeneratedQuestion } from '@/lib/add-questions-types'

interface RunwayReviewProps {
  questions: GeneratedQuestion[]
  onAddOne: (question: GeneratedQuestion) => void
  onSkipOne: () => void
  onAddAll: (remaining: GeneratedQuestion[]) => void
  onEditCurrent: (question: GeneratedQuestion) => void
}

export function RunwayReview({
  questions,
  onAddOne,
  onSkipOne,
  onAddAll,
  onEditCurrent,
}: RunwayReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [addedCount, setAddedCount] = useState(0)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  // TODO: localCorrectKey only supports single-select override; MSQ multi-correct editing deferred to V1
  const [localCorrectKey, setLocalCorrectKey] = useState<string | null>(null)

  const current = questions[currentIndex]
  const isLast = currentIndex >= questions.length - 1
  const remaining = questions.filter((q, i) => i > currentIndex && !skippedIds.has(q.id))

  if (!current) return null

  function effectiveIsCorrect(opt: { key: string; isCorrect: boolean; isSuggestedCorrect?: boolean }) {
    if (localCorrectKey !== null) return opt.key === localCorrectKey
    return opt.isCorrect
  }

  function handleAddNext() {
    onAddOne(current)
    setAddedCount(c => c + 1)
    setLocalCorrectKey(null)
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  function handleSkip() {
    setSkippedIds(prev => new Set([...prev, current.id]))
    onSkipOne()
    setLocalCorrectKey(null)
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  function handleAddAll() {
    const toAdd = [current, ...remaining]
    toAdd.forEach(q => onAddOne(q))
    onAddAll(toAdd)
  }

  return (
    <div className="border-b border-[var(--border)]">
      {/* Navigation header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] flex-wrap">
        <span className="text-xs text-[var(--muted-foreground)]">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <Badge variant="outline" className="text-xs h-5 px-1.5">
          {current.source === 'ai' ? 'AI-generated' : 'PDF-extracted'}
        </Badge>
        <Badge variant="outline" className="text-xs h-5 px-1.5">
          {current.type}
        </Badge>
        <Badge variant="outline" className="text-xs h-5 px-1.5">
          {current.difficulty}
        </Badge>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(i => i - 1); setLocalCorrectKey(null) }}
          aria-label="Previous generated question"
        >
          <i className="fa-regular fa-arrow-left text-xs" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          disabled={isLast}
          onClick={() => { setCurrentIndex(i => i + 1); setLocalCorrectKey(null) }}
          aria-label="Next generated question"
        >
          <i className="fa-regular fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>

      {/* Question body */}
      <div className="px-3 py-3 space-y-3">
        {/* Stem */}
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          {current.stemText}
        </p>

        {/* Options (MCQ / MSQ / True-False) */}
        {current.options && current.options.length > 0 && (
          <div className="space-y-1.5">
            {current.options.map(opt => {
              const isCorrect = effectiveIsCorrect(opt)
              return (
                <Button
                  key={opt.key}
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setLocalCorrectKey(opt.key)}
                  className={[
                    'w-full flex items-start gap-2.5 px-3 py-2 rounded-md border text-sm text-left transition-colors h-auto justify-start',
                    isCorrect
                      ? 'border-green-500/40 bg-green-50/60 text-green-800 hover:bg-green-50/60'
                      : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)]',
                  ].join(' ')}
                  aria-pressed={isCorrect}
                  aria-label={`Option ${opt.key}: ${opt.text}${isCorrect ? ' (marked correct)' : ''}`}
                >
                  <span className="shrink-0 font-medium w-4">{opt.key}</span>
                  <span className="flex-1">{opt.text}</span>
                  {opt.isSuggestedCorrect && isCorrect && (
                    <span className="text-xs text-green-600 shrink-0">✓ suggested</span>
                  )}
                </Button>
              )
            })}
          </div>
        )}

        {/* Essay / fill-blank model answer */}
        {current.modelAnswer && (
          <div className="px-3 py-2 border-l-2 border-green-500/60 bg-green-50/60">
            <p className="text-xs text-green-700 font-medium mb-0.5">Model answer</p>
            <p className="text-sm text-green-800">{current.modelAnswer}</p>
          </div>
        )}

        {/* Matching pairs */}
        {current.matchPairs && current.matchPairs.length > 0 && (
          <div className="space-y-1.5">
            {current.matchPairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="flex-1 px-3 py-1.5 rounded-md border border-[var(--border)]">
                  {pair.left}
                </span>
                <i className="fa-regular fa-arrow-right text-[var(--muted-foreground)]" aria-hidden="true" />
                <span className="flex-1 px-3 py-1.5 rounded-md border border-green-500/40 bg-green-50/60 text-green-800">
                  {pair.right}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Essay limits */}
        {current.type === 'Essay' && (current.wordLimitMin || current.wordLimitMax) && (
          <p className="text-xs text-[var(--muted-foreground)]">
            {current.wordLimitMin ? `Min ${current.wordLimitMin} words` : ''}
            {current.wordLimitMin && current.wordLimitMax ? ' · ' : ''}
            {current.wordLimitMax ? `Max ${current.wordLimitMax} words` : ''}
          </p>
        )}
      </div>

      <Separator />

      {/* Action footer */}
      <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onEditCurrent(current)}
        >
          Edit question
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-[var(--muted-foreground)]"
          onClick={handleSkip}
        >
          Skip
        </Button>
        <Button
          variant="default"
          size="sm"
          className="text-xs gap-1"
          onClick={handleAddNext}
        >
          Add{!isLast ? ' + Next' : ''}
          {!isLast && <i className="fa-regular fa-arrow-right text-xs" aria-hidden="true" />}
        </Button>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border)] bg-[var(--muted)]">
        <span className="text-xs text-[var(--muted-foreground)]">
          {addedCount} of {questions.length} added so far
        </span>
        {remaining.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={handleAddAll}
          >
            Add all remaining
            <i className="fa-regular fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}
