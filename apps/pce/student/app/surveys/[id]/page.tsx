'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { buttonVariants } from '@exxat/student/components/ui/button'
import { MOCK_STUDENT_SURVEYS } from '@/lib/mock-surveys'
import type { SurveySection, Question } from '@/lib/mock-surveys'
import Link from 'next/link'

type Answers = Record<string, number | string>

const RATING_LABELS = ['', 'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']

export default function TakeSurveyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const survey = MOCK_STUDENT_SURVEYS.find(s => s.id === id)

  const [currentSection, setCurrentSection] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)

  if (!survey) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3 text-center px-6">
        <i className="fa-light fa-circle-exclamation" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
        <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Survey not found</p>
        <Link href="/surveys" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to Surveys
        </Link>
      </div>
    )
  }

  if (survey.status !== 'open') {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3 text-center px-6">
        <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
        <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          {survey.status === 'submitted' ? 'Already submitted' : 'This survey is closed'}
        </p>
        <Link href="/surveys" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to Surveys
        </Link>
      </div>
    )
  }

  const section = survey.sections[currentSection]
  const totalSections = survey.sections.length
  const progress = Math.round(((currentSection + 1) / totalSections) * 100)

  const sectionAnswered = section.questions
    .filter(q => q.type === 'rating')
    .every(q => answers[q.id] !== undefined)

  const isLastSection = currentSection === totalSections - 1

  const handleNext = () => {
    if (isLastSection) {
      setSubmitting(true)
      setTimeout(() => {
        router.push(`/surveys/${id}/submitted`)
      }, 800)
    } else {
      setCurrentSection(c => c + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">

      {/* Top bar */}
      <header
        className="flex items-center justify-between border-b px-6 py-4 sticky top-0 z-10"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/surveys"
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
            Surveys
          </Link>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span className="text-sm font-semibold truncate max-w-40" style={{ color: 'var(--foreground)' }}>
            {survey.courseCode}
          </span>
        </div>
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {currentSection + 1} of {totalSections}
        </span>
      </header>

      {/* Progress bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: 'var(--muted)' }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Survey progress"
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: 'var(--brand-color)' }}
        />
      </div>

      {/* Section breadcrumb */}
      <div
        className="flex items-center gap-2 overflow-x-auto px-6 py-3 border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--brand-color-surface)' }}
      >
        {survey.sections.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 shrink-0">
            {i > 0 && (
              <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            )}
            <button
              onClick={() => i < currentSection && setCurrentSection(i)}
              className="text-xs px-2 py-1 rounded-full transition-colors"
              style={{
                backgroundColor: i === currentSection
                  ? 'var(--brand-color)'
                  : i < currentSection
                    ? 'var(--brand-color-soft)'
                    : 'transparent',
                color: i === currentSection
                  ? 'white'
                  : i < currentSection
                    ? 'var(--brand-color-dark)'
                    : 'var(--muted-foreground)',
                cursor: i < currentSection ? 'pointer' : 'default',
              }}
            >
              {i < currentSection && (
                <i className="fa-solid fa-check me-1 text-xs" aria-hidden="true" />
              )}
              {s.title.split(' — ')[0]}
            </button>
          </div>
        ))}
      </div>

      {/* Section content */}
      <main className="flex-1 px-6 py-8 max-w-2xl w-full mx-auto">
        <SectionForm
          section={section}
          answers={answers}
          onAnswer={(qId, value) => setAnswers(prev => ({ ...prev, [qId]: value }))}
        />
      </main>

      {/* Footer nav */}
      <footer
        className="sticky bottom-0 flex items-center justify-between border-t px-6 py-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      >
        <button
          onClick={() => setCurrentSection(c => c - 1)}
          disabled={currentSection === 0}
          className="text-sm"
          style={{
            color: currentSection === 0 ? 'var(--muted-foreground)' : 'var(--brand-color)',
            background: 'none',
            border: 'none',
            cursor: currentSection === 0 ? 'default' : 'pointer',
            padding: 0,
          }}
        >
          <i className="fa-light fa-arrow-left me-1" aria-hidden="true" style={{ fontSize: 12 }} />
          Previous
        </button>

        <div className="flex items-center gap-1.5">
          {survey.sections.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: i <= currentSection ? 'var(--brand-color)' : 'var(--muted)',
                transition: 'background-color 200ms',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!sectionAnswered || submitting}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            backgroundColor: sectionAnswered && !submitting ? 'var(--brand-color)' : 'var(--muted)',
            color: sectionAnswered && !submitting ? 'white' : 'var(--muted-foreground)',
            border: 'none',
            cursor: sectionAnswered && !submitting ? 'pointer' : 'default',
          }}
        >
          {submitting ? (
            <>
              <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" style={{ fontSize: 12 }} />
              Submitting…
            </>
          ) : isLastSection ? (
            <>
              Submit
              <i className="fa-light fa-check ms-1" aria-hidden="true" style={{ fontSize: 12 }} />
            </>
          ) : (
            <>
              Next
              <i className="fa-light fa-arrow-right ms-1" aria-hidden="true" style={{ fontSize: 12 }} />
            </>
          )}
        </button>
      </footer>
    </div>
  )
}

function SectionForm({
  section,
  answers,
  onAnswer,
}: {
  section: SurveySection
  answers: Answers
  onAnswer: (qId: string, value: number | string) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      {/* Section header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          {section.title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {section.description}
        </p>
      </div>

      {/* Questions */}
      {section.questions.map((q, i) => (
        <QuestionItem
          key={q.id}
          question={q}
          index={i}
          value={answers[q.id]}
          onAnswer={(v) => onAnswer(q.id, v)}
        />
      ))}
    </div>
  )
}

function QuestionItem({
  question,
  index,
  value,
  onAnswer,
}: {
  question: Question
  index: number
  value: number | string | undefined
  onAnswer: (v: number | string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <span
          className="text-sm font-medium tabular-nums mt-0.5 shrink-0 w-5 text-right"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {index + 1}.
        </span>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {question.text}
          {question.type === 'rating' && (
            <span className="ms-1 text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>
              (required)
            </span>
          )}
        </p>
      </div>

      {question.type === 'rating' ? (
        <RatingInput value={value as number | undefined} onChange={onAnswer} />
      ) : (
        <div className="ms-8">
          <textarea
            className="w-full rounded-lg border px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 transition-shadow"
            style={{
              borderColor: 'var(--border-control-3)',
              backgroundColor: 'var(--input-background)',
              color: 'var(--foreground)',
              minHeight: 80,
            }}
            placeholder="Share your thoughts… (optional)"
            value={(value as string) ?? ''}
            onChange={e => onAnswer(e.target.value)}
            rows={3}
          />
        </div>
      )}
    </div>
  )
}

function RatingInput({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (v: number) => void
}) {
  return (
    <div className="ms-8 flex flex-col gap-2">
      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-1.5 sm:hidden">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors"
            style={{
              borderColor: value === n ? 'var(--brand-color)' : 'var(--border)',
              backgroundColor: value === n ? 'var(--brand-color-surface)' : 'var(--background)',
              color: 'var(--foreground)',
            }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: value === n ? 'var(--brand-color)' : 'var(--muted)',
                color: value === n ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {n}
            </span>
            {RATING_LABELS[n]}
          </button>
        ))}
      </div>

      {/* Desktop: horizontal pills */}
      <div className="hidden sm:flex flex-col gap-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all"
              style={{
                borderColor: value === n ? 'var(--brand-color)' : 'var(--border)',
                backgroundColor: value === n ? 'var(--brand-color-surface)' : 'var(--background)',
              }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: value === n ? 'var(--brand-color)' : 'var(--muted)',
                  color: value === n ? 'white' : 'var(--muted-foreground)',
                }}
              >
                {n}
              </span>
              <span className="text-xs text-center px-1 leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                {RATING_LABELS[n]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>
      </div>
    </div>
  )
}
