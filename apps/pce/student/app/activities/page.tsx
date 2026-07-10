'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { buttonVariants } from '@exxat/student/components/ui/button'
import { badgeVariants } from '@exxat/student/components/ui/badge'
import Link from 'next/link'
import { MOCK_STUDENT_SURVEYS } from '@/lib/mock-surveys'

// Mock token → student identity lookup
const TOKEN_STUDENT: Record<string, { name: string; email: string }> = {
  'abc123': { name: 'Alex Johnson',   email: 'alex.johnson@university.edu' },
  'def456': { name: 'Maria Garcia',   email: 'maria.garcia@university.edu' },
  'ghi789': { name: 'James Williams', email: 'james.williams@university.edu' },
}

function ActivitiesContent() {
  const params    = useSearchParams()
  const token     = params?.get('token') ?? ''
  const student   = TOKEN_STUDENT[token] ?? null
  const openCount = MOCK_STUDENT_SURVEYS.filter(s => s.status === 'open').length

  // Invalid / expired token
  if (!student) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center py-20">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--muted)' }}
          >
            <i className="fa-light fa-link-slash" aria-hidden="true" style={{ fontSize: 24, color: 'var(--muted-foreground)' }} />
          </div>
          <div className="flex flex-col gap-1.5" style={{ maxWidth: 320 }}>
            <p className="text-base font-semibold text-foreground">This link has expired</p>
            <p className="text-sm text-muted-foreground">
              Evaluation links are valid for 30 days. Please check your email for a newer link, or contact your program administrator.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const open      = MOCK_STUDENT_SURVEYS.filter(s => s.status === 'open')
  const completed = MOCK_STUDENT_SURVEYS.filter(s => s.status === 'submitted' || s.status === 'closed')

  return (
    <div className="flex min-h-screen flex-col">
      <Header email={student.email} />

      {/* Greeting bar */}
      <div
        className="border-b px-6 py-5"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-0.5">
          <h1 className="text-base font-semibold text-foreground">
            Hi, {student.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {openCount === 0
              ? 'You have no pending evaluations right now.'
              : openCount === 1
                ? 'You have 1 evaluation awaiting your response.'
                : `You have ${openCount} evaluations awaiting your response.`
            }
          </p>
        </div>
      </div>

      <main className="flex flex-1 flex-col px-6 py-6 gap-6 max-w-2xl w-full mx-auto">

        {/* Open surveys */}
        {open.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Awaiting your response</h2>
              <span className="text-xs text-muted-foreground">
                {open.length} evaluation{open.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {open.map(survey => {
                const totalQuestions = survey.sections.reduce((a, s) => a + s.questions.length, 0)
                return (
                  <div
                    key={survey.id}
                    className="flex items-center justify-between gap-4 rounded-lg border px-5 py-4"
                    style={{ borderColor: 'var(--brand-color-soft)', backgroundColor: 'var(--brand-color-light)' }}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate text-foreground">
                          {survey.courseCode}
                        </span>
                        <span
                          className={badgeVariants({ variant: 'default' })}
                          style={{ fontSize: 11 }}
                        >
                          Open
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground truncate">{survey.courseName}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                        <span>
                          <i className="fa-light fa-users me-1" aria-hidden="true" />
                          {survey.instructors.map(i => i.name).join(', ')}
                        </span>
                        <span>·</span>
                        <span>
                          <i className="fa-light fa-circle-question me-1" aria-hidden="true" />
                          {totalQuestions} questions
                        </span>
                        <span>·</span>
                        <span style={{ color: 'var(--chart-4)' }}>
                          <i className="fa-light fa-calendar-days me-1" aria-hidden="true" />
                          Due {survey.deadline}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/surveys/${survey.id}`}
                      className={buttonVariants({ variant: 'default', size: 'sm' })}
                    >
                      Start
                      <i className="fa-light fa-arrow-right ms-1" aria-hidden="true" style={{ fontSize: 11 }} />
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {open.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--brand-tint)' }}
            >
              <i
                className="fa-light fa-circle-check"
                aria-hidden="true"
                style={{ fontSize: 28, color: 'var(--brand-color)' }}
              />
            </div>
            <p className="text-base font-semibold text-foreground">All done</p>
            <p className="text-sm text-muted-foreground" style={{ maxWidth: 280 }}>
              You have no pending evaluations right now. Check back after your courses conclude.
            </p>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Completed</h2>
            <div className="flex flex-col gap-1.5">
              {completed.map(survey => (
                <div
                  key={survey.id}
                  className="flex items-center justify-between gap-4 rounded-lg border px-5 py-3"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
                >
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{survey.courseCode}</span>
                      <span className={badgeVariants({ variant: 'secondary' })} style={{ fontSize: 11 }}>
                        {survey.status === 'submitted' ? 'Submitted' : 'Closed'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{survey.courseName}</span>
                  </div>
                  {survey.submittedAt && (
                    <span className="text-xs text-muted-foreground shrink-0">{survey.submittedAt}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer
        className="border-t px-6 py-4 text-center"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs text-muted-foreground">
          Sent to {student.email} · Questions? Contact your program administrator.
        </p>
      </footer>
    </div>
  )
}

function Header({ email }: { email?: string }) {
  return (
    <header
      className="flex items-center justify-between border-b px-6 py-4 sticky top-0 z-10"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{ backgroundColor: 'var(--brand-color)' }}
        >
          <i className="fa-light fa-paper-plane text-white text-sm" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Exxat</p>
          <p className="text-sm font-semibold text-foreground">Course Evaluations</p>
        </div>
      </div>
      {email && (
        <p className="text-xs text-muted-foreground hidden sm:block">{email}</p>
      )}
    </header>
  )
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <i className="fa-light fa-spinner-third fa-spin text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
      </div>
    }>
      <ActivitiesContent />
    </Suspense>
  )
}
