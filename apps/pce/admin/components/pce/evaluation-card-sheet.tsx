'use client'

import { useMemo } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  KeyMetrics, Badge, StatusBadge,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import {
  MOCK_SURVEYS, MOCK_SURVEY_QUESTION_DATA, MOCK_RESPONSES, MOCK_FACULTY, MOCK_TEMPLATES,
  MOCK_OPEN_TEXT_RESPONSES,
} from '@/lib/pce-mock-data'
import type { QuestionScore, TemplateQuestion } from '@/lib/pce-mock-data'
import { SENTIMENT_CHIP } from '@/components/pce/pce-badges'

const tierColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chart-4)'

const SUBJECT_LABEL: Record<string, string> = {
  course_content: 'Course content',
  faculty: 'Faculty',
  faculty_performance: 'Faculty',
  course_instructor: 'Course instructor',
  course_coordinator: 'Course coordinator',
  lab_instructor: 'Labs & materials',
  course_director: 'Overall experience',
}

// Faculty-type sections are scored per-instructor (qData.instructorBlocks). The
// subjectKey is inconsistent across templates: 'faculty' (tmpl1/tmpl2),
// 'faculty_performance', or 'course_instructor' (tmplrich) — all mean the same.
const FACULTY_SUBJECTS = new Set(['course_instructor', 'faculty', 'faculty_performance'])

/* ── Average-on-scale bar (compact, sheet-scale). Reads left→right as "where on
   the 1–5 scale this question lands"; n = response count. The full per-rating
   distribution lives on the survey detail page — this card is a quick scan. ── */
function DistBar({ score }: { score: QuestionScore }) {
  const total = score.distribution.reduce((s, v) => s + v, 0)
  const pct = Math.max(0, Math.min(100, (score.avg / 5) * 100))
  return (
    <div
      className="flex items-center gap-2 min-w-0"
      role="img"
      aria-label={`Average ${score.avg.toFixed(1)} out of 5 from ${total} response${total !== 1 ? 's' : ''}`}
    >
      <span
        className="text-sm font-semibold tabular-nums w-7 text-right shrink-0"
        style={{ color: tierColor(score.avg) }}
      >
        {score.avg.toFixed(1)}
      </span>
      <div className="flex-1 h-[6px] rounded-full overflow-hidden min-w-0" style={{ background: 'var(--muted)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: tierColor(score.avg) }}
          aria-hidden="true"
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        n={total}
      </span>
    </div>
  )
}

interface SheetSection {
  key: string
  title: string
  subtitle?: string
  avg: number | null
  rows: {
    id: string
    text: string
    isFreeText: boolean
    score?: QuestionScore
    freeTextCount?: number
  }[]
}

interface EvaluationCardSheetProps {
  surveyId: string | null
  onClose: () => void
}

export function EvaluationCardSheet({ surveyId, onClose }: EvaluationCardSheetProps) {
  const survey   = useMemo(() => MOCK_SURVEYS.find(s => s.id === surveyId) ?? null, [surveyId])
  const qData    = useMemo(() => MOCK_SURVEY_QUESTION_DATA.find(d => d.surveyId === surveyId) ?? null, [surveyId])
  const response = useMemo(() => MOCK_RESPONSES.find(r => r.surveyId === surveyId) ?? null, [surveyId])
  const template = useMemo(
    () => (survey ? MOCK_TEMPLATES.find(t => t.id === survey.templateId) ?? null : null),
    [survey],
  )

  // Section model — data-driven from the assigned template (no hardcoded question
  // map), so it works for any template at any question count. Faculty sections
  // repeat once per instructor (using the per-instructor score blocks).
  const sections: SheetSection[] = useMemo(() => {
    if (!survey || !template) return []
    const tSections = template.templateSections?.length
      ? template.templateSections
      : template.sections.map(s => ({
          id: s, subjectKey: s as string, title: SUBJECT_LABEL[s] ?? s,
          questions: (template.questions?.[s] ?? []) as TemplateQuestion[], order: 0,
        }))

    const avgOf = (scores: QuestionScore[]) =>
      scores.length === 0 ? null : +(scores.reduce((a, s) => a + s.avg, 0) / scores.length).toFixed(1)

    const rowsFor = (questions: TemplateQuestion[], scores: QuestionScore[]) =>
      questions.map(q => ({
        id: q.id,
        text: q.text,
        isFreeText: q.answerType === 'free_text',
        score: scores.find(s => s.questionId === q.id),
        // Count from the actual records — never claim responses the
        // written-responses surfaces can't show.
        freeTextCount: MOCK_OPEN_TEXT_RESPONSES.filter(
          r => r.surveyId === surveyId && r.questionText === q.text,
        ).length,
      }))

    return tSections.flatMap(section => {
      const isFaculty = FACULTY_SUBJECTS.has(section.subjectKey)
      const blocks = qData?.instructorBlocks
      if (isFaculty && blocks && blocks.length > 0) {
        return blocks.map(block => {
          const instructor =
            survey.instructors.find(i => i.id === block.instructorId) ??
            MOCK_FACULTY.find(f => f.id === block.instructorId)
          return {
            key: `${section.id}-${block.instructorId}`,
            title: section.title,
            subtitle: instructor?.name,
            avg: avgOf(block.scores),
            rows: rowsFor(section.questions, block.scores),
          }
        })
      }
      const scores = qData?.sectionScores?.[section.subjectKey] ?? []
      return [{
        key: section.id,
        title: section.title,
        avg: avgOf(scores),
        rows: rowsFor(section.questions, scores),
      }]
    }).filter(s => s.rows.length > 0)
  }, [survey, template, qData])

  const kpis: MetricItem[] = useMemo(() => {
    if (!survey) return []
    const cc = response?.sectionScores.find(s => s.section === 'course_content')
    const fp = response?.sectionScores.find(s => s.section === 'faculty_performance')
    return [
      { id: 'rate',   label: 'Completion',  value: `${survey.responseRate}%`, delta: '', trend: 'neutral', description: `${survey.responseCount} of ${survey.enrollmentCount}` },
      { id: 'cc-avg', label: 'Course avg',  value: cc ? `${cc.avg.toFixed(1)}/5` : '—', delta: '', trend: 'neutral', description: 'course questions' },
      { id: 'fp-avg', label: 'Faculty avg', value: fp ? `${fp.avg.toFixed(1)}/5` : '—', delta: '', trend: 'neutral', description: 'faculty questions' },
    ]
  }, [survey, response])

  const primaryInstructor = survey?.instructors.find(i => i.role === 'primary')

  return (
    <Sheet open={!!surveyId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="w-full data-[side=right]:sm:max-w-[560px] flex flex-col gap-0 p-0 overflow-hidden"
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
              <div className="flex flex-col gap-5 px-5 py-5">

                <KeyMetrics variant="compact" metricsSingleRow metrics={kpis} />

                {/* ── Questions by section — collapsible so a 20-question survey stays
                    scannable: each header shows the section average + question count;
                    expand to see per-question distributions. ── */}
                {qData && sections.length > 0 ? (
                  <section aria-labelledby="ec-questions-heading">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 id="ec-questions-heading" className="text-sm font-semibold">Questions</h3>
                      <span className="text-xs text-muted-foreground">
                        {sections.reduce((n, s) => n + s.rows.length, 0)} across {sections.length} section{sections.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Accordion type="multiple" defaultValue={[sections[0].key]} className="flex flex-col">
                      {sections.map(s => (
                        <AccordionItem key={s.key} value={s.key}>
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <span className="flex flex-1 items-center gap-2 min-w-0 pr-2">
                              <span className="text-sm font-medium truncate">
                                {s.title}
                                {s.subtitle && (
                                  <span className="font-normal text-muted-foreground">{' · '}{s.subtitle}</span>
                                )}
                              </span>
                              <span className="ml-auto flex items-center gap-2 shrink-0">
                                {s.avg != null && (
                                  <span className="text-sm font-semibold tabular-nums" style={{ color: tierColor(s.avg) }}>
                                    {s.avg.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {s.rows.length} Q
                                </span>
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col gap-4 pb-1">
                              {s.rows.map(r => (
                                <div key={r.id} className="flex flex-col gap-1.5">
                                  <p className="text-sm leading-snug">{r.text}</p>
                                  {r.isFreeText ? (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <i className="fa-light fa-message-lines" aria-hidden="true" />
                                      {(r.freeTextCount ?? 0) === 0
                                        ? 'No responses yet'
                                        : `${r.freeTextCount} written response${r.freeTextCount !== 1 ? 's' : ''}`}
                                    </p>
                                  ) : r.score ? (
                                    <DistBar score={r.score} />
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No data yet</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </section>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                    <i className="fa-light fa-chart-bar text-3xl" aria-hidden="true" />
                    <p className="text-sm">Results not yet available for this evaluation.</p>
                  </div>
                )}

                {/* Comments */}
                {(response?.comments?.length ?? 0) > 0 && (
                  <section aria-labelledby="ec-comments-heading">
                    <h3 id="ec-comments-heading" className="text-sm font-semibold mb-3">Comments</h3>
                    <div className="flex flex-col gap-2.5">
                      {/* Same anatomy as the results-page comment list —
                          quote first, sentiment chip beneath. */}
                      {response!.comments.map((c, i) => {
                        const chip = c.sentiment ? SENTIMENT_CHIP[c.sentiment] : null
                        return (
                          <div key={i} className="flex flex-col gap-1.5">
                            <p className="text-sm leading-snug">&ldquo;{c.text}&rdquo;</p>
                            {chip && <StatusBadge label={chip.label} tone={chip.tone} className="self-start" />}
                          </div>
                        )
                      })}
                    </div>
                  </section>
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
