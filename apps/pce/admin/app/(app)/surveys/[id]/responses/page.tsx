'use client'

import { useParams } from 'next/navigation'
import { Button, Separator, SidebarTrigger, Badge } from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { MOCK_RESPONSES, SECTION_LABELS } from '@/lib/pce-mock-data'
import Link from 'next/link'

const SENTIMENT_STYLE: Record<string, { color: string; icon: string }> = {
  positive: { color: 'var(--pce-status-released-fg)', icon: 'fa-face-smile' },
  neutral:  { color: 'var(--muted-foreground)',        icon: 'fa-face-meh'   },
  concern:  { color: 'var(--destructive)',             icon: 'fa-face-frown' },
}

export default function SurveyResponsesPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, templates } = usePce()

  const survey = surveys.find(s => s.id === id)
  const template = survey ? templates.find(t => t.id === survey.templateId) : null
  const responses = MOCK_RESPONSES.find(r => r.surveyId === id)

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/surveys">Back to Surveys</Link>
        </Button>
      </div>
    )
  }

  if (!responses) {
    return (
      <>
        <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="h-4" />
          <Link href="/surveys" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Surveys</Link>
          <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
          <Link href={`/surveys/${id}`} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{survey.courseCode}</Link>
          <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
          <span className="text-sm font-semibold">Responses</span>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
          <i className="fa-light fa-chart-bar text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm font-medium">No responses yet</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Responses will appear here once students begin submitting.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/surveys" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <Link href={`/surveys/${id}`} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{survey.courseCode}</Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-sm font-semibold flex-1">Responses</span>
        <SurveyStatusBadge status={survey.status} />
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl flex flex-col gap-6">

          {/* Overall summary */}
          <div className="border border-border rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Overall</h2>
              <ResponseGauge
                rate={survey.responseRate}
                responseCount={survey.responseCount}
                enrollmentCount={survey.enrollmentCount}
                showBar={false}
              />
            </div>
            <div className="flex gap-6">
              {responses.sectionScores.map(s => (
                <div key={s.section} className="flex flex-col gap-0.5">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {SECTION_LABELS[s.section]}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">{s.avg}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-section scores */}
          {responses.sectionScores.map(sectionScore => (
            <div key={sectionScore.section} className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">{SECTION_LABELS[sectionScore.section]}</h3>
                <span className="text-sm tabular-nums font-semibold">
                  avg {sectionScore.avg}/5
                </span>
              </div>

              {/* Score bar */}
              <div className="px-4 py-3 border-b border-border">
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
                    }}
                  />
                </div>
              </div>

              {/* Comments for this section */}
              {responses.comments.filter(c => c.section === sectionScore.section).length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                    Comments ({responses.comments.filter(c => c.section === sectionScore.section).length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {responses.comments
                      .filter(c => c.section === sectionScore.section)
                      .map((comment, i) => {
                        const style = SENTIMENT_STYLE[comment.sentiment]
                        return (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <i
                              className={`fa-light ${style.icon} mt-0.5 shrink-0`}
                              aria-hidden="true"
                              style={{ color: style.color, fontSize: 13 }}
                            />
                            <span style={{ color: 'var(--foreground)' }}>&ldquo;{comment.text}&rdquo;</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
