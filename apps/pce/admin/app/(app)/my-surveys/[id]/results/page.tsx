'use client'

import { useParams } from 'next/navigation'
import { Button, Separator, SidebarTrigger } from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { MOCK_RESPONSES, SECTION_LABELS } from '@/lib/pce-mock-data'
import Link from 'next/link'

const SENTIMENT_STYLE: Record<string, { color: string; icon: string }> = {
  positive: { color: 'var(--pce-status-released-fg)', icon: 'fa-face-smile' },
  neutral:  { color: 'var(--muted-foreground)',        icon: 'fa-face-meh'   },
  concern:  { color: 'var(--destructive)',             icon: 'fa-face-frown' },
}

export default function FacultyResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, templates } = usePce()

  const survey = surveys.find(s => s.id === id)
  const template = survey ? templates.find(t => t.id === survey.templateId) : null
  const isReleased = survey?.status === 'released' || survey?.status === 'closed'
  const responses = isReleased ? MOCK_RESPONSES.find(r => r.surveyId === id) : null

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/my-surveys">Back to My Surveys</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/my-surveys" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>My Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-sm font-semibold flex-1 truncate">
          {survey.courseCode} — {survey.courseName}
        </span>
        <SurveyStatusBadge status={survey.status} />
      </header>

      <main className="flex-1 overflow-auto p-6">
        {!isReleased ? (
          /* Locked state */
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ backgroundColor: 'var(--pce-locked-bg)' }}
            >
              <i
                className="fa-light fa-lock-keyhole"
                aria-hidden="true"
                style={{ fontSize: 28, color: 'var(--muted-foreground)' }}
              />
            </div>
            <div className="flex flex-col gap-2 max-w-sm">
              <p className="text-base font-semibold">Results aren&apos;t available yet</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                The program administrator reviews all responses before releasing them to instructors.
                You&apos;ll be notified by email when your results are ready.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-surveys">Back to My Surveys</Link>
            </Button>
          </div>
        ) : !responses ? (
          /* Released but no responses */
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i className="fa-light fa-chart-bar text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-medium">No responses were collected for this survey.</p>
          </div>
        ) : (
          /* Released with responses */
          <div className="max-w-2xl flex flex-col gap-6">

            {/* Release meta */}
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Released {survey.releasedAt ?? ''}
            </div>

            {/* Section results */}
            {template?.sections.map(section => {
              const sectionScore = responses.sectionScores.find(s => s.section === section)
              const sectionComments = responses.comments.filter(c => c.section === section)
              if (!sectionScore) return null

              return (
                <div key={section} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-sm font-semibold">{SECTION_LABELS[section]}</h2>
                    <span className="text-sm font-bold tabular-nums">avg {sectionScore.avg}/5</span>
                  </div>

                  {/* Score bar */}
                  <div className="px-4 py-4 border-b border-border flex flex-col gap-2">
                    <div
                      style={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'var(--pce-rate-bar-track)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(sectionScore.avg / 5) * 100}%`,
                          borderRadius: 4,
                          backgroundColor: 'var(--pce-rate-bar-fill)',
                          transition: 'width 600ms ease',
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Based on {sectionScore.count} responses
                    </p>
                  </div>

                  {/* Comments */}
                  {sectionComments.length > 0 && (
                    <div className="px-4 py-4">
                      <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
                        Comments ({sectionComments.length})
                      </p>
                      <div className="flex flex-col gap-3">
                        {sectionComments.map((comment, i) => {
                          const style = SENTIMENT_STYLE[comment.sentiment]
                          return (
                            <div key={i} className="flex items-start gap-2.5 text-sm">
                              <i
                                className={`fa-light ${style.icon} mt-0.5 shrink-0`}
                                aria-hidden="true"
                                style={{ color: style.color, fontSize: 14 }}
                              />
                              <span style={{ color: 'var(--foreground)', fontStyle: 'italic' }}>
                                &ldquo;{comment.text}&rdquo;
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

          </div>
        )}
      </main>
    </>
  )
}
