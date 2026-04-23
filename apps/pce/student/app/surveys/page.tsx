'use client'

import Link from 'next/link'
import { badgeVariants } from '@exxat/student/components/ui/badge'
import { buttonVariants } from '@exxat/student/components/ui/button'
import { MOCK_STUDENT_SURVEYS, STUDENT_METRICS } from '@/lib/mock-surveys'
import type { StudentSurvey } from '@/lib/mock-surveys'

const STATUS_CONFIG: Record<StudentSurvey['status'], { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  open:      { label: 'Open',      variant: 'default'   },
  submitted: { label: 'Submitted', variant: 'secondary' },
  closed:    { label: 'Closed',    variant: 'outline'   },
}

export default function SurveysPage() {
  const open      = MOCK_STUDENT_SURVEYS.filter(s => s.status === 'open')
  const completed = MOCK_STUDENT_SURVEYS.filter(s => s.status !== 'open')

  return (
    <div className="flex min-h-screen flex-col">

      {/* Top header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--brand-color)' }}
          >
            <i className="fa-light fa-paper-plane text-white text-sm" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Exxat</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Post Course Evaluations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: 'var(--brand-color-surface)', color: 'var(--brand-color-dark)' }}
            aria-label="Alex Johnson"
          >
            AJ
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Alex Johnson</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Spring 2026</p>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <div className="flex border-b border-[var(--border)]" style={{ backgroundColor: 'var(--muted)' }}>
        {STUDENT_METRICS.map((m, i) => (
          <div
            key={m.id}
            className="flex flex-1 flex-col gap-0.5 px-6 py-4"
            style={{ backgroundColor: 'var(--background)', borderRight: i < STUDENT_METRICS.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{m.label}</span>
            <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{m.value}</span>
          </div>
        ))}
      </div>

      <main className="flex flex-1 flex-col px-6 py-6 gap-8 max-w-2xl w-full mx-auto">

        {/* Open surveys */}
        {open.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                Awaiting your response
              </h2>
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {open.length} survey{open.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {open.map(survey => (
                <SurveyCard key={survey.id} survey={survey} />
              ))}
            </div>
          </section>
        )}

        {/* Completed surveys */}
        {completed.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              Completed
            </h2>
            <div className="flex flex-col gap-2">
              {completed.map(survey => (
                <SurveyCard key={survey.id} survey={survey} />
              ))}
            </div>
          </section>
        )}

        {MOCK_STUDENT_SURVEYS.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i
              className="fa-light fa-circle-check"
              aria-hidden="true"
              style={{ fontSize: 40, color: 'var(--brand-color)' }}
            />
            <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              All done — no surveys to complete
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Check back after your courses conclude for new evaluations.
            </p>
          </div>
        )}

      </main>
    </div>
  )
}

function SurveyCard({ survey }: { survey: StudentSurvey }) {
  const cfg = STATUS_CONFIG[survey.status]
  const totalQuestions = survey.sections.reduce((acc, s) => acc + s.questions.length, 0)
  const isOpen = survey.status === 'open'

  return (
    <div
      className="flex items-center justify-between rounded-xl border px-5 py-4 gap-4 transition-shadow hover:shadow-sm"
      style={{
        borderColor: isOpen ? 'var(--brand-color-soft)' : 'var(--border)',
        backgroundColor: isOpen ? 'var(--brand-color-light)' : 'var(--card)',
      }}
    >
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            {survey.courseCode}
          </span>
          <div className={badgeVariants({ variant: cfg.variant })}>{cfg.label}</div>
        </div>
        <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
          {survey.courseName}
        </span>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>
            <i className="fa-light fa-users me-1" aria-hidden="true" />
            {survey.instructors.map(i => i.name).join(', ')}
          </span>
          {isOpen && (
            <>
              <span>·</span>
              <span>
                <i className="fa-light fa-circle-question me-1" aria-hidden="true" />
                {totalQuestions} questions
              </span>
              <span>·</span>
              <span>
                <i className="fa-light fa-calendar-days me-1" aria-hidden="true" />
                Due {survey.deadline}
              </span>
            </>
          )}
          {survey.submittedAt && (
            <>
              <span>·</span>
              <span>Submitted {survey.submittedAt}</span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {isOpen && (
          <Link href={`/surveys/${survey.id}`} className={buttonVariants({ variant: 'default', size: 'sm' })}>
            Start
            <i className="fa-light fa-arrow-right ms-1" aria-hidden="true" style={{ fontSize: 11 }} />
          </Link>
        )}
        {survey.status === 'submitted' && (
          <Link href={`/surveys/${survey.id}/submitted`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View
          </Link>
        )}
        {survey.status === 'closed' && (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Closed</span>
        )}
      </div>
    </div>
  )
}
