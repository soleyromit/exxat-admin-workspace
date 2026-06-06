'use client'

import {
  Sheet,
  SheetContent,
  SheetClose,
  Button,
  Badge,
  Separator,
} from '@exxatdesignux/ui'
import type { Question } from '@/lib/qb-types'

interface QBResultDetailPanelProps {
  question: Question | null
  results: Question[]
  index: number
  onIndexChange: (index: number) => void
  onAdd: (question: Question) => void
  onClose: () => void
}

// ── Read-only renderers ──────────────────────────────────────────────────────

function MCQReadOnly({ question }: { question: Question }) {
  return (
    <div className="space-y-1.5">
      {(question.options ?? []).map(opt => (
        <div
          key={opt.key}
          className={[
            'flex items-start gap-2.5 px-3 py-2 rounded-md border text-sm',
            opt.isCorrect
              ? 'border-green-500/40 bg-green-50/60 text-green-800'
              : 'border-[var(--border)] text-[var(--foreground)]',
          ].join(' ')}
        >
          <span className="shrink-0 w-4 font-medium">{opt.key}</span>
          <span className="flex-1">{opt.text}</span>
          {opt.isCorrect && (
            <i className="fa-regular fa-check text-green-600 mt-0.5 shrink-0" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}

function MSQReadOnly({ question }: { question: Question }) {
  const correctCount = (question.options ?? []).filter(o => o.isCorrect).length
  const total = (question.options ?? []).length
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[var(--muted-foreground)] mb-2">
        {correctCount} of {total} correct (select all that apply)
      </p>
      {(question.options ?? []).map(opt => (
        <div
          key={opt.key}
          className={[
            'flex items-start gap-2.5 px-3 py-2 rounded-md border text-sm',
            opt.isCorrect
              ? 'border-green-500/40 bg-green-50/60 text-green-800'
              : 'border-[var(--border)] text-[var(--foreground)]',
          ].join(' ')}
        >
          <i
            className={`fa-regular ${opt.isCorrect ? 'fa-square-check text-green-600' : 'fa-square'} mt-0.5 shrink-0`}
            aria-hidden="true"
          />
          <span className="flex-1">{opt.text}</span>
        </div>
      ))}
    </div>
  )
}

function FillBlankReadOnly({ question }: { question: Question }) {
  return (
    <div className="space-y-2">
      {question.stemText && (
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          {question.stemText}
        </p>
      )}
      {question.modelAnswer && (
        <div className="px-3 py-2 rounded-md border border-green-500/40 bg-green-50/60">
          <p className="text-xs text-green-700 font-medium mb-0.5">Model answer</p>
          <p className="text-sm text-green-800">{question.modelAnswer}</p>
        </div>
      )}
    </div>
  )
}

function MatchingReadOnly({ question }: { question: Question }) {
  return (
    <div className="space-y-1.5">
      {(question.options ?? []).map((opt, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="flex-1 px-3 py-2 rounded-md border border-[var(--border)] text-[var(--foreground)]">
            {opt.key}. {opt.text}
          </span>
          <i className="fa-regular fa-arrow-right text-[var(--muted-foreground)]" aria-hidden="true" />
          <span className="flex-1 px-3 py-2 rounded-md border border-green-500/40 bg-green-50/60 text-green-800">
            {opt.text}
          </span>
        </div>
      ))}
      {(!question.options || question.options.length === 0) && (
        <p className="text-sm text-[var(--muted-foreground)]">No pairs defined.</p>
      )}
    </div>
  )
}

function HotspotReadOnly() {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] flex items-center justify-center h-32 text-sm text-[var(--muted-foreground)]">
      <div className="text-center space-y-1">
        <i className="fa-regular fa-image text-2xl" aria-hidden="true" />
        <p>Hotspot diagram</p>
        <p className="text-xs">Correct region highlighted in assessment taker</p>
      </div>
    </div>
  )
}

function EssayReadOnly({ question }: { question: Question }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--muted-foreground)]">
        Essay response area (open-ended)
      </div>
      {(question.minWordCount || question.wordLimitMax) && (
        <p className="text-xs text-[var(--muted-foreground)]">
          {question.minWordCount ? `Min ${question.minWordCount} words` : ''}
          {question.minWordCount && question.wordLimitMax ? ' · ' : ''}
          {question.wordLimitMax ? `Max ${question.wordLimitMax} words` : ''}
        </p>
      )}
      {question.rubric && question.rubric.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--foreground)]">Rubric</p>
          {question.rubric.map((r, i) => (
            <div key={i} className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span>{r.criterion}</span>
              <span>{r.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReadOnlyQuestionBody({ question }: { question: Question }) {
  switch (question.type) {
    case 'MCQ':
    case 'True/False':
      return <MCQReadOnly question={question} />
    case 'MSQ':
      return <MSQReadOnly question={question} />
    case 'Fill blank':
    case 'Short Answer':
      return <FillBlankReadOnly question={question} />
    case 'Matching':
      return <MatchingReadOnly question={question} />
    case 'Hotspot':
      return <HotspotReadOnly />
    case 'Essay':
      return <EssayReadOnly question={question} />
    default:
      return (
        <p className="text-sm text-[var(--muted-foreground)]">
          Preview not available for this question type.
        </p>
      )
  }
}

// ── Panel ────────────────────────────────────────────────────────────────────

export function QBResultDetailPanel({
  question,
  results,
  index,
  onIndexChange,
  onAdd,
  onClose,
}: QBResultDetailPanelProps) {
  const hasPrev = index > 0
  const hasNext = index < results.length - 1

  return (
    <Sheet open={question !== null} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[420px] sm:w-[480px] flex flex-col gap-0 p-0 overflow-hidden"
      >
        {question && (
          <>
            {/* Header */}
            <div className="flex items-start gap-2 px-4 pt-4 pb-3 border-b border-[var(--border)]">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-xs h-5 px-1.5">
                    {question.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs h-5 px-1.5">
                    {question.difficulty}
                  </Badge>
                  {question.blooms && (
                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                      Bloom&apos;s {question.blooms}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium leading-snug text-[var(--foreground)]">
                  {question.title}
                </p>
              </div>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close question detail"
                  className="shrink-0 w-7 h-7"
                >
                  <i className="fa-regular fa-xmark" aria-hidden="true" />
                </Button>
              </SheetClose>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Stem */}
              {question.stemText && (
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {question.stemText}
                </p>
              )}
              <Separator />

              {/* Type-specific body */}
              <ReadOnlyQuestionBody question={question} />

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {question.pbis !== null && question.pbis !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {question.pbis.toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">PBI</p>
                  </div>
                )}
                {question.correctness !== null && question.correctness !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {Math.round(question.correctness * 100)}%
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Avg correct</p>
                  </div>
                )}
                {question.usage !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {question.usage}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Assessments</p>
                  </div>
                )}
                {question.totalAttempts !== null && question.totalAttempts !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {question.totalAttempts}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Students</p>
                  </div>
                )}
              </div>

              {question.age && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Last used: {question.age}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)]">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrev}
                onClick={() => onIndexChange(index - 1)}
                aria-label="Previous question"
              >
                <i className="fa-regular fa-arrow-left text-xs" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext}
                onClick={() => onIndexChange(index + 1)}
                aria-label="Next question"
              >
                <i className="fa-regular fa-arrow-right text-xs" aria-hidden="true" />
              </Button>
              <div className="flex-1" />
              <Button
                variant="default"
                size="sm"
                onClick={() => onAdd(question)}
              >
                + Add
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
