'use client'

import { useParams } from 'next/navigation'
import { Badge, Button, Separator, SidebarTrigger, Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'
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
  const { surveys, hiddenComments, toggleHideComment } = usePce()

  const survey = surveys.find(s => s.id === id)
  const responses = MOCK_RESPONSES.find(r => r.surveyId === id)
  const hidden = hiddenComments[id] ?? []

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
        <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="h-4" />
          <Link href="/surveys" className="text-sm text-muted-foreground">Surveys</Link>
          <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
          <Link href={`/surveys/${id}`} className="text-sm text-muted-foreground">{survey.courseCode}</Link>
          <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold">Responses</span>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
          <i className="fa-light fa-chart-bar text-4xl text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">No responses yet</p>
          <p className="text-sm text-muted-foreground">
            Responses will appear here once students begin submitting.
          </p>
        </div>
      </>
    )
  }

  const hiddenCount = hidden.length

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/surveys" className="text-sm text-muted-foreground">Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <Link href={`/surveys/${id}`} className="text-sm text-muted-foreground">{survey.courseCode}</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1">Responses</span>
        {hiddenCount > 0 && (
          <Badge variant="secondary">
            {hiddenCount} hidden from faculty
          </Badge>
        )}
        <SurveyStatusBadge status={survey.status} />
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
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
                  <p className="text-xs text-muted-foreground">
                    {SECTION_LABELS[s.section]}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">{s.avg}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation note */}
          <div
            className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
          >
            <i className="fa-light fa-circle-info mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" style={{ fontSize: 13 }} />
            <p className="text-muted-foreground">
              Hide individual comments to remove them from the faculty view before releasing results. Hidden comments remain in the system and are never deleted.
            </p>
          </div>

          {/* Per-section scores */}
          {responses.sectionScores.map(sectionScore => {
            const sectionComments = responses.comments
              .map((c, globalIndex) => ({ ...c, globalIndex }))
              .filter(c => c.section === sectionScore.section)
            const visibleCount = sectionComments.filter(c => !hidden.includes(c.globalIndex)).length

            return (
              <div key={sectionScore.section} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">{SECTION_LABELS[sectionScore.section]}</h3>
                  <span className="text-sm tabular-nums font-semibold">
                    avg {sectionScore.avg}/5
                  </span>
                </div>

                {/* Score bar */}
                <div className="px-4 py-3 border-b border-border">
                  <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--muted)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(sectionScore.avg / 5) * 100}%`, borderRadius: 4, backgroundColor: 'var(--brand-color)' }} />
                  </div>
                </div>

                {/* Comments */}
                {sectionComments.length > 0 && (
                  <div className="px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Comments — {visibleCount} visible to faculty
                        {sectionComments.length - visibleCount > 0 && (
                          <span> · {sectionComments.length - visibleCount} hidden</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {sectionComments.map((comment) => {
                        const isHidden = hidden.includes(comment.globalIndex)
                        const sStyle = SENTIMENT_STYLE[comment.sentiment]
                        return (
                          <div
                            key={comment.globalIndex}
                            className="group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-colors"
                            style={{
                              backgroundColor: isHidden ? 'var(--muted)' : 'transparent',
                            }}
                          >
                            <i
                              className={`fa-light ${sStyle.icon} mt-0.5 shrink-0 ${isHidden ? 'text-muted-foreground' : ''}`}
                              aria-hidden="true"
                              style={{ color: isHidden ? undefined : sStyle.color, fontSize: 13 }}
                            />
                            <span
                              className={isHidden ? 'text-muted-foreground' : 'text-foreground'}
                              style={{
                                flex: 1,
                                fontSize: 13,
                                textDecoration: isHidden ? 'line-through' : 'none',
                                fontStyle: 'italic',
                              }}
                            >
                              &ldquo;{comment.text}&rdquo;
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={isHidden ? 'Restore comment' : 'Hide from faculty'}
                                  onClick={() => toggleHideComment(id, comment.globalIndex)}
                                  className="opacity-0 group-hover:opacity-100 shrink-0"
                                  style={{ transition: 'opacity 150ms' }}
                                >
                                  <i
                                    className={`fa-light ${isHidden ? 'fa-eye' : 'fa-eye-slash'}`}
                                    aria-hidden="true"
                                    style={{ fontSize: 12 }}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isHidden ? 'Restore — show to faculty' : 'Hide from faculty view'}
                              </TooltipContent>
                            </Tooltip>
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
      </main>
    </>
  )
}
