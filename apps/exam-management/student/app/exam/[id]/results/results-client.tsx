'use client'

import Link from 'next/link'
import { MOCK_ASSESSMENTS } from '@/lib/mock-assessments'
import { MOCK_EXAM_QUESTIONS } from '@/lib/mock-exam-questions'

export function ResultsClient({ id }: { id: string }) {
  const assessment = MOCK_ASSESSMENTS.find(a => a.id === id)
  const score = 87
  const correct = 4
  const total = MOCK_EXAM_QUESTIONS.length

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center border-b border-[var(--border)] bg-[var(--background)] px-6">
        <span className="text-sm font-semibold text-[var(--foreground)]">{assessment?.title ?? 'Exam'} — Results</span>
      </header>

      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-start outline-none overflow-y-auto px-4 py-10">
        <div className="w-full max-w-2xl flex flex-col gap-8">

          {/* Score card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 flex flex-col items-center gap-3 text-center">
            <div className="text-5xl font-bold text-chart-2">{score}%</div>
            <div className="text-sm text-[var(--muted-foreground)]">{correct} of {total} correct</div>
            <div className="h-2 w-full max-w-xs rounded-full bg-[var(--muted)] overflow-hidden">
              <div className="h-full rounded-full bg-chart-2" style={{ width: `${score}%` }} />
            </div>
            <span className="rounded-full px-3 py-0.5 text-xs font-medium bg-chart-2/10 text-chart-2 mt-1">Passed</span>
          </div>

          {/* Question review */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Question Review</h2>
            {MOCK_EXAM_QUESTIONS.map((q, i) => {
              const isCorrect = i !== 3
              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-4 flex gap-3 ${
                    isCorrect
                      ? 'border-chart-2/30 bg-chart-2/5'
                      : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <i
                    className={`fa-light ${isCorrect ? 'fa-circle-check text-chart-2' : 'fa-circle-xmark text-destructive'} mt-0.5 shrink-0`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-[var(--foreground)]">{q.text}</p>
                    {!isCorrect && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Correct: {q.type === 'true-false'
                          ? (q.correctAnswer ? 'True' : 'False')
                          : q.options?.[q.correctIndex ?? 0]}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Link
            href="/assessments"
            className="self-center rounded-xl bg-[var(--brand-color)] px-8 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Back to Assessments
          </Link>
        </div>
      </main>
    </div>
  )
}
