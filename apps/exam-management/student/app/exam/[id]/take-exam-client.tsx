'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@exxat/student/components/ui/button'
import { Textarea } from '@exxat/student/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@exxat/student/components/ui/radio-group'
import { MOCK_EXAM_QUESTIONS } from '@/lib/mock-exam-questions'
import { MOCK_ASSESSMENTS } from '@/lib/mock-assessments'

export function TakeExamClient({ id }: { id: string }) {
  const router = useRouter()
  const assessment = MOCK_ASSESSMENTS.find(a => a.id === id)
  const questions = MOCK_EXAM_QUESTIONS
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({})

  const q = questions[current]
  const progress = Math.round(((current + 1) / questions.length) * 100)

  function setAnswer(value: string | number | boolean) {
    setAnswers(prev => ({ ...prev, [q.id]: value }))
  }

  function handleSubmit() {
    router.push(`/exam/${id}/results`)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--foreground)]">{assessment?.title ?? 'Exam'}</span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--brand-color-surface)] text-[var(--brand-color-dark)]">
            <i className="fa-light fa-graduation-cap" aria-hidden="true" />
            Student DS
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <i className="fa-light fa-clock" aria-hidden="true" />
          <span>60:00</span>
        </div>
      </header>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full bg-[var(--muted)]"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Exam progress"
      >
        <div className="h-full bg-[var(--brand-color)] transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-start outline-none overflow-y-auto px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{Object.keys(answers).length} answered</span>
          </div>

          <p className="text-base font-medium text-[var(--foreground)] leading-relaxed">{q.text}</p>

          {q.type === 'mcq' && q.options && (
            <RadioGroup
              className="flex flex-col gap-2"
              value={answers[q.id] !== undefined ? String(answers[q.id]) : ''}
              onValueChange={(v) => setAnswer(Number(v))}
              aria-label="Answer options"
            >
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    answers[q.id] === i
                      ? 'border-[var(--brand-color)] bg-[var(--accent)]'
                      : 'border-[var(--border)] hover:bg-[var(--accent)]'
                  }`}
                >
                  <RadioGroupItem value={String(i)} />
                  <span className="text-sm text-[var(--foreground)]">{opt}</span>
                </label>
              ))}
            </RadioGroup>
          )}

          {q.type === 'true-false' && (
            <RadioGroup
              className="flex gap-3"
              value={answers[q.id] !== undefined ? String(answers[q.id]) : ''}
              onValueChange={(v) => setAnswer(v === 'true')}
              aria-label="True or false"
            >
              {([true, false] as const).map(val => (
                <label
                  key={String(val)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-4 cursor-pointer transition-colors ${
                    answers[q.id] === val
                      ? 'border-[var(--brand-color)] bg-[var(--accent)]'
                      : 'border-[var(--border)] hover:bg-[var(--accent)]'
                  }`}
                >
                  <RadioGroupItem value={String(val)} />
                  <span className="text-sm font-medium text-[var(--foreground)]">{val ? 'True' : 'False'}</span>
                </label>
              ))}
            </RadioGroup>
          )}

          {q.type === 'short-answer' && (
            <Textarea
              rows={4}
              value={String(answers[q.id] ?? '')}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              aria-label="Short answer"
              className="resize-none"
            />
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              Previous
            </Button>
            {current < questions.length - 1 ? (
              <Button
                type="button"
                variant="default"
                onClick={() => setCurrent(c => c + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={handleSubmit}
              >
                Submit Exam
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
