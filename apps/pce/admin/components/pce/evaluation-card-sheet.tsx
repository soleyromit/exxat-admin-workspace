'use client'

import { useMemo } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  KeyMetrics, Badge,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import {
  MOCK_SURVEYS, MOCK_SURVEY_QUESTION_DATA, MOCK_RESPONSES, MOCK_FACULTY,
} from '@/lib/pce-mock-data'
import type { QuestionScore } from '@/lib/pce-mock-data'

const tierColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chart-4)'

const QUESTION_TEXT: Record<string, string> = {
  q1: 'The course objectives were clearly stated.',
  q2: 'Course materials supported my learning.',
  q3: 'The workload was appropriate for the credit hours.',
  q4: 'Assessments were aligned with learning objectives.',
  q6: 'The instructor was well-prepared for each class.',
  q7: 'The instructor communicated expectations clearly.',
}

const FREE_TEXT_LABELS: Record<string, string> = {
  q5: 'What would you change about this course?',
  q8: 'What feedback do you have for the instructor?',
}

/* ── Distribution strip + avg score ── */
function DistBar({ score }: { score: QuestionScore }) {
  const total = score.distribution.reduce((s, v) => s + v, 0)
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="text-sm font-semibold tabular-nums w-7 text-right shrink-0"
        style={{ color: tierColor(score.avg) }}
      >
        {score.avg.toFixed(1)}
      </span>
      <div className="flex-1 flex h-[6px] rounded-full overflow-hidden gap-px min-w-0">
        {score.distribution.map((count, i) => (
          <div
            key={i}
            className="h-full shrink-0"
            style={{
              width: `${total > 0 ? (count / total) * 100 : 0}%`,
              backgroundColor:
                i >= 3 ? 'var(--chart-2)' :
                i === 2 ? 'var(--muted-foreground)' :
                'var(--chart-4)',
              opacity: i >= 3 ? 1 : i === 2 ? 0.4 : 0.55,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-5 text-right shrink-0">
        {total}
      </span>
    </div>
  )
}

function QuestionRow({ score }: { score: QuestionScore }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground leading-snug">
        {QUESTION_TEXT[score.questionId] ?? score.questionId}
      </p>
      <DistBar score={score} />
    </div>
  )
}

interface EvaluationCardSheetProps {
  surveyId: string | null
  onClose: () => void
}

export function EvaluationCardSheet({ surveyId, onClose }: EvaluationCardSheetProps) {
  const survey   = useMemo(() => MOCK_SURVEYS.find(s => s.id === surveyId) ?? null, [surveyId])
  const qData    = useMemo(() => MOCK_SURVEY_QUESTION_DATA.find(d => d.surveyId === surveyId) ?? null, [surveyId])
  const response = useMemo(() => MOCK_RESPONSES.find(r => r.surveyId === surveyId) ?? null, [surveyId])

  const kpis: MetricItem[] = useMemo(() => {
    if (!survey) return []
    const cc  = response?.sectionScores.find(s => s.section === 'course_content')
    const fp  = response?.sectionScores.find(s => s.section === 'faculty_performance')
    return [
      {
        id:    'rate',
        label: 'Completion',
        value: `${survey.responseRate}%`,
        delta: '', trend: 'neutral',
        description: `${survey.responseCount} of ${survey.enrollmentCount}`,
      },
      {
        id:    'cc-avg',
        label: 'Course avg',
        value: cc ? `${cc.avg.toFixed(1)}/5` : '—',
        delta: '', trend: 'neutral',
        description: 'course questions',
      },
      {
        id:    'fp-avg',
        label: 'Faculty avg',
        value: fp ? `${fp.avg.toFixed(1)}/5` : '—',
        delta: '', trend: 'neutral',
        description: 'faculty questions',
      },
    ]
  }, [survey, response])

  const primaryInstructor = survey?.instructors.find(i => i.role === 'primary')

  return (
    <Sheet open={!!surveyId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="w-full data-[side=right]:sm:max-w-[540px] flex flex-col gap-0 p-0 overflow-hidden"
      >
        {survey ? (
          <>
            {/* ── Header ── */}
            <SheetHeader className="shrink-0 border-b border-border px-5 pt-5 pb-4 gap-0">
              <div className="flex items-start gap-2 pr-8">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base font-semibold leading-tight">
                    {survey.courseCode}
                  </SheetTitle>
                  {survey.courseName && (
                    <SheetDescription className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {survey.courseName}
                    </SheetDescription>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-xs font-normal mt-0.5">
                  {survey.term}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <i className="fa-light fa-user-tie" aria-hidden="true" />
                  {primaryInstructor?.name ?? '—'}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <i className="fa-light fa-users" aria-hidden="true" />
                  {survey.enrollmentCount} enrolled
                </span>
              </div>
            </SheetHeader>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-auto">
              <div className="flex flex-col gap-6 px-5 py-5">

                <KeyMetrics variant="compact" metricsSingleRow metrics={kpis} />

                {/* Response collection velocity — cumulative responses across the
                    open→close window, with a projection (dashed) + 70% target. */}
                {(() => {
                  if (!survey.openDate || !survey.deadline) return null
                  const open  = new Date(survey.openDate).getTime()
                  const close = new Date(survey.deadline).getTime()
                  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) return null
                  const rate   = survey.responseRate
                  const closed = survey.status === 'closed' || survey.status === 'released'
                  const elapsed = closed ? 1 : Math.min(0.95, Math.max(0.1, (Date.now() - open) / (close - open)))
                  const TARGET = 70
                  const smooth = (x: number) => x * x * (3 - 2 * x)
                  const N = 10
                  const X = (t: number) => t * 100
                  const Y = (p: number) => 6 + (1 - Math.min(100, Math.max(0, p)) / 100) * 88
                  const solidPts = Array.from({ length: N + 1 }, (_, k) => {
                    const t = (k / N) * elapsed
                    return `${X(t)},${Y(rate * smooth(elapsed === 0 ? 0 : t / elapsed))}`
                  }).join(' ')
                  const projectedFinal = closed ? rate : Math.min(100, Math.round(rate / elapsed))
                  const projPts = `${X(elapsed)},${Y(rate)} ${X(1)},${Y(projectedFinal)}`
                  const fmtShort = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  return (
                    <section aria-labelledby="ec-collection-heading">
                      <div className="flex items-baseline justify-between mb-2">
                        <h3 id="ec-collection-heading" className="text-sm font-semibold">Response collection</h3>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {closed ? `${rate}% final` : `${rate}% now · ~${projectedFinal}% projected`}
                        </span>
                      </div>
                      <div className="flex flex-col" style={{ height: 128 }} role="img" aria-label={`Response collection ${closed ? `closed at ${rate}%` : `${rate}% now, projected ${projectedFinal}% by close`}`}>
                        <div className="flex flex-1 gap-1">
                          <div className="relative w-7 shrink-0">
                            {[100, 50, 0].map(v => (
                              <span key={v} className="absolute right-1 text-[10px] text-muted-foreground tabular-nums -translate-y-1/2" style={{ top: `${Y(v)}%` }}>{v}%</span>
                            ))}
                          </div>
                          <div className="relative flex-1">
                            {[100, 50, 0].map(v => (
                              <div key={v} className="absolute inset-x-0 border-t border-border" style={{ top: `${Y(v)}%` }} />
                            ))}
                            <div className="absolute inset-x-0 border-t border-dashed" style={{ top: `${Y(TARGET)}%`, borderColor: 'var(--muted-foreground)' }} />
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                              <polyline points={solidPts} fill="none" stroke="var(--brand-color)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                              {!closed && <polyline points={projPts} fill="none" stroke="var(--brand-color)" strokeWidth={2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
                            </svg>
                            <div className="absolute size-2 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: `${X(elapsed)}%`, top: `${Y(rate)}%`, background: 'var(--brand-color)' }} />
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-7 shrink-0" />
                          <div className="flex-1 flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>{fmtShort(open)} · open</span>
                            <span>{fmtShort(close)} · close</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                        <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: 'var(--muted-foreground)' }} aria-hidden="true" />
                        {TARGET}% target{!closed && ' · dashed = projected'}
                      </p>
                    </section>
                  )
                })()}

                {/* Course content questions */}
                {(qData?.sectionScores?.course_content?.length ?? 0) > 0 && (
                  <section aria-labelledby="ec-cc-heading">
                    <h3
                      id="ec-cc-heading"
                      className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                    >
                      Course Content
                    </h3>
                    <div className="flex flex-col gap-4">
                      {qData!.sectionScores.course_content
                        .filter(q => q.questionId in QUESTION_TEXT)
                        .map(q => <QuestionRow key={q.questionId} score={q} />)}
                    </div>
                    {qData?.freeTextCounts?.q5 != null && (
                      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                        <i className="fa-light fa-message-lines" aria-hidden="true" />
                        {qData.freeTextCounts.q5} written responses — &ldquo;{FREE_TEXT_LABELS.q5}&rdquo;
                      </p>
                    )}
                  </section>
                )}

                {/* Per-instructor question blocks */}
                {qData?.instructorBlocks?.map(block => {
                  const instructor =
                    survey.instructors.find(i => i.id === block.instructorId) ??
                    MOCK_FACULTY.find(f => f.id === block.instructorId)
                  const likertScores = block.scores.filter(q => q.questionId in QUESTION_TEXT)
                  if (likertScores.length === 0) return null
                  return (
                    <section key={block.instructorId} aria-labelledby={`ec-fi-${block.instructorId}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}
                          aria-hidden="true"
                        >
                          {instructor?.initials ?? '?'}
                        </div>
                        <h3
                          id={`ec-fi-${block.instructorId}`}
                          className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          {instructor?.name ?? block.instructorId}
                        </h3>
                        {instructor?.role && (
                          <span className="text-xs text-muted-foreground capitalize">
                            ({instructor.role})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-4">
                        {likertScores.map(q => <QuestionRow key={q.questionId} score={q} />)}
                      </div>
                      {qData?.freeTextCounts?.q8 != null && (
                        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                          <i className="fa-light fa-message-lines" aria-hidden="true" />
                          {qData.freeTextCounts.q8} written responses — &ldquo;{FREE_TEXT_LABELS.q8}&rdquo;
                        </p>
                      )}
                    </section>
                  )
                })}

                {/* Comments */}
                {(response?.comments?.length ?? 0) > 0 && (
                  <section aria-labelledby="ec-comments-heading">
                    <h3
                      id="ec-comments-heading"
                      className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                    >
                      Comments
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      {response!.comments.map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                c.sentiment === 'positive' ? 'var(--chart-2)' :
                                c.sentiment === 'concern'  ? 'var(--chart-4)' :
                                'var(--muted-foreground)',
                            }}
                            aria-hidden="true"
                          />
                          <p className="text-sm leading-snug">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty state — survey has no question data yet */}
                {!qData && !response && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                    <i className="fa-light fa-chart-bar text-3xl" aria-hidden="true" />
                    <p className="text-sm">Results not yet available for this evaluation.</p>
                  </div>
                )}

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No evaluation selected.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
