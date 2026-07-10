'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@exxat/student/components/ui/button'
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from '@exxat/student/components/ui/card'
import { MOCK_STUDENT_SURVEYS } from '@/lib/mock-surveys'

export default function SubmittedPage() {
  const { id } = useParams<{ id: string }>()
  const survey = MOCK_STUDENT_SURVEYS.find(s => s.id === id)

  const courseName = survey?.courseName ?? 'your course'
  const courseCode = survey?.courseCode ?? ''

  return (
    <div className="flex min-h-screen flex-col">

      {/* Top bar */}
      <header
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--brand-color)' }}
          >
            <i className="fa-light fa-paper-plane text-sm" aria-hidden="true" style={{ color: 'var(--background)' }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Exxat</p>
            <p className="text-sm font-semibold text-foreground">Post Course Evaluations</p>
          </div>
        </div>
      </header>

      {/* Confirmation content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full">

          {/* Success icon */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--brand-color-surface)' }}
          >
            <i
              className="fa-light fa-circle-check"
              aria-hidden="true"
              className="text-[40px]"
              style={{ color: 'var(--brand-color)' }}
            />
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Response submitted anonymously.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your evaluation for{' '}
              <span className="font-medium text-foreground">
                {courseCode && `${courseCode} — `}{courseName}
              </span>{' '}
              has been recorded. Your identity is never linked to your responses.
            </p>
          </div>

          {/* What happens next */}
          <Card className="w-full text-left gap-3 py-4">
            <CardHeader className="px-5 pt-0">
              <CardDescription className="text-xs font-semibold text-muted-foreground">
                What happens next
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-5 pb-0">
              {[
                {
                  icon: 'fa-lock-keyhole',
                  title: 'Responses are anonymous',
                  desc: 'Your identity is never shared with instructors.',
                },
                {
                  icon: 'fa-chart-bar',
                  title: 'Results are aggregated',
                  desc: 'Instructors see combined scores, not individual answers.',
                },
                {
                  icon: 'fa-calendar-check',
                  title: 'Released after the term',
                  desc: 'Results are shared once the evaluation window closes.',
                },
              ].map(item => (
                <div key={item.icon} className="flex items-start gap-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ backgroundColor: 'var(--brand-color-surface)' }}
                  >
                    <i
                      className={`fa-light ${item.icon}`}
                      aria-hidden="true"
                      className="text-[13px]"
                      style={{ color: 'var(--brand-color)' }}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CTA */}
          <Link
            href="/surveys"
            className={buttonVariants({ variant: 'default', size: 'default' })}
            style={{ width: '100%' }}
          >
            Back to Surveys
            <i className="fa-light fa-arrow-right ms-1.5 text-xs" aria-hidden="true" />
          </Link>

          {/* Re-edit path — only while survey is still editable */}
          {survey?.status === 'submitted' && (
            <>
              <div
                className="w-full rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm"
                style={{
                  backgroundColor: 'var(--muted)',
                  color: 'var(--chart-4)',
                }}
              >
                <i className="fa-light fa-pen-to-square shrink-0 mt-0.5 text-[13px]" aria-hidden="true" />
                <span>
                  Changed your mind? You can edit your responses until this survey closes
                  {survey.deadline ? ` on ${survey.deadline}` : ''}.
                </span>
              </div>
              <Link
                href={`/surveys/${id}`}
                className={buttonVariants({ variant: 'outline', size: 'default' })}
                style={{ width: '100%' }}
              >
                <i className="fa-light fa-pen me-1.5 text-xs" aria-hidden="true" />
                Edit my responses
              </Link>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Questions? Contact your program coordinator.
          </p>
        </div>
      </main>
    </div>
  )
}
