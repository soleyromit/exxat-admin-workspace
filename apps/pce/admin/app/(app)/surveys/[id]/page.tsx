'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Avatar, AvatarFallback,
  Badge,
  Card, CardHeader, CardTitle,
  KeyMetrics,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import { QuestionChartBlock } from '@/components/pce/question-chart-block'
import { SurveyResponseRail, type SurveyRailGroup } from '@/components/pce/survey-response-rail'
import {
  CloseSurveyDialog,
  AddGuestSheet,
  SendReminderPopover,
  ReleaseSheet,
} from '@/components/pce/pce-modals'
import {
  MOCK_RESPONSES,
  MOCK_OPEN_TEXT_RESPONSES,
  MOCK_SURVEY_QUESTION_DATA,
  type ResponseComment,
  type SubjectKey,
} from '@/lib/pce-mock-data'

// ── Theme derivation (AI layer — no NLP in mock, keyword-based proxy) ─────────
interface ThemeRow {
  label: string
  sentiment: 'positive' | 'neutral' | 'concern'
  occurrences: number
}

const THEME_PATTERNS: { label: string; keywords: string[] }[] = [
  { label: 'Pacing',             keywords: ['pacing', 'pace', 'fast', 'rushed', 'slow'] },
  { label: 'Faculty engagement', keywords: ['engaging', 'communicat', 'helpful', 'responsive', 'organized', 'approachable'] },
  { label: 'Course materials',   keywords: ['material', 'resource', 'lab', 'structure', 'reading'] },
  { label: 'Assessment quality', keywords: ['assessment', 'exam', 'quiz', 'example', 'worked', 'difficulty'] },
  { label: 'Office hours',       keywords: ['office hours', 'available', 'accessible'] },
]

function deriveThemes(comments: ResponseComment[]): ThemeRow[] {
  return THEME_PATTERNS.flatMap(theme => {
    const matched = comments.filter(c =>
      theme.keywords.some(kw => c.text.toLowerCase().includes(kw))
    )
    if (matched.length === 0) return []
    const hasConcern = matched.some(c => c.sentiment === 'concern')
    const hasPositive = matched.some(c => c.sentiment === 'positive')
    const dominant: ThemeRow['sentiment'] = hasConcern ? 'concern' : hasPositive ? 'positive' : 'neutral'
    return [{ label: theme.label, sentiment: dominant, occurrences: matched.length }]
  })
}

// ── Response trajectory ───────────────────────────────────────────────────────
function trajectoryText(responseCount: number, openDate?: string, deadline?: string): string | null {
  const threshold = 5
  if (responseCount >= threshold || !openDate || !deadline) return null

  const open = new Date(openDate).getTime()
  const now = Date.now()
  const daysElapsed = (now - open) / 86_400_000
  if (daysElapsed <= 0) return null

  const ratePerDay = responseCount / daysElapsed
  if (ratePerDay <= 0) return null

  const daysNeeded = threshold / ratePerDay
  const thresholdDate = new Date(open + daysNeeded * 86_400_000)
  const closeDate = new Date(deadline)

  if (thresholdDate > closeDate) {
    return `At the current pace, the 5-response threshold may not be reached before closing.`
  }
  const label = thresholdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `At this pace, you'll reach the 5-response threshold by ${label}.`
}

// ── Days remaining ────────────────────────────────────────────────────────────
function daysUntil(deadline: string): number {
  return Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 86_400_000))
}

// ── Sentiment dot ─────────────────────────────────────────────────────────────
function SentimentDot({ sentiment }: { sentiment: 'positive' | 'neutral' | 'concern' }) {
  const color =
    sentiment === 'positive' ? 'var(--chart-2)' :
    sentiment === 'concern'  ? 'var(--chart-4)' :
    'var(--muted-foreground)'
  return (
    <span
      style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
      aria-hidden="true"
    />
  )
}

// ── Subject key → label ───────────────────────────────────────────────────────
const SUBJECT_LABEL: Record<SubjectKey | 'faculty_performance', string> = {
  course_content:     'Course Content',
  faculty:            'Faculty',
  course_instructor:  'Course Instructor',
  course_coordinator: 'Course Coordinator',
  teaching_assistant: 'Teaching Assistant',
  lab_instructor:     'Lab Instructor',
  course_director:    'Course Director',
  preceptor:          'Preceptor',
  clinical_supervisor: 'Clinical Supervisor',
  faculty_performance: 'Faculty Performance',
}

// ── Scroll anchor ids (shared by the rendered sections + the scrollspy rail) ──
const sectionAnchor   = (sid: string, instr?: string) => `sec-${sid}${instr ? `-${instr}` : ''}`
const questionAnchor  = (sid: string, qid: string, instr?: string) => `q-${sid}${instr ? `-${instr}` : ''}-${qid}`

// Faculty sections are scored per-instructor (instructorBlocks). subjectKey varies
// by template: 'faculty' (tmpl1/tmpl2), 'faculty_performance', or 'course_instructor'.
const isFacultySubject = (k: string) =>
  k === 'course_instructor' || k === 'faculty' || k === 'faculty_performance'

// =============================================================================

export default function SurveyDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { surveys, templates, removeInstructor } = usePce()

  const [closeOpen,    setCloseOpen]    = useState(false)
  const [addGuestOpen, setAddGuestOpen] = useState(false)
  const [releaseOpen,  setReleaseOpen]  = useState(false)
  const [localFlagged, setLocalFlagged] = useState<Set<string>>(new Set())
  const [linkCopied,   setLinkCopied]   = useState(false)

  const survey        = surveys.find(s => s.id === id)
  const template      = survey ? templates.find(t => t.id === survey.templateId) : null
  const responses     = survey ? MOCK_RESPONSES.find(r => r.surveyId === survey.id) : null
  const openTextResps = survey ? MOCK_OPEN_TEXT_RESPONSES.filter(r => r.surveyId === survey.id) : []

  const themes        = useMemo(() => responses ? deriveThemes(responses.comments) : [], [responses])
  const trajectoryMsg = survey ? trajectoryText(survey.responseCount, survey.openDate, survey.deadline) : null
  const days          = survey ? daysUntil(survey.deadline) : 0
  const questionData  = MOCK_SURVEY_QUESTION_DATA.find(d => d.surveyId === id) ?? null

  const concernCount  = responses?.comments.filter(c => c.sentiment === 'concern').length ?? 0
  const flaggedCount  = openTextResps.filter(r => r.flagged || localFlagged.has(r.id)).length

  const templateSections = template?.templateSections?.length
    ? template.templateSections
    : template?.sections.map(s => ({
        id: s,
        subjectKey: s as SubjectKey,
        title: SUBJECT_LABEL[s as SubjectKey] ?? s,
        questions: Object.values(template?.questions ?? {}).flat().filter(q => q.id.startsWith(s[0])),
        order: 0,
      })) ?? []

  const railGroups: SurveyRailGroup[] = useMemo(() => {
    if (!survey) return []
    return templateSections.flatMap(section => {
      const isFacultySection = isFacultySubject(section.subjectKey)
      const blocks = questionData?.instructorBlocks
      if (isFacultySection && blocks && blocks.length > 0) {
        return blocks.map(block => {
          const instructor = survey.instructors.find(i => i.id === block.instructorId)
          return {
            id: sectionAnchor(section.id, block.instructorId),
            title: section.title,
            subtitle: instructor?.name,
            items: section.questions.map((qq, qi) => ({
              anchorId: questionAnchor(section.id, qq.id, block.instructorId),
              qNumber: qi + 1,
              text: qq.text,
              avg: qq.answerType === 'free_text'
                ? undefined
                : block.scores.find(s => s.questionId === qq.id)?.avg,
            })),
          }
        })
      }
      const scores = questionData?.sectionScores[section.subjectKey] ?? []
      return [{
        id: sectionAnchor(section.id),
        title: section.title,
        items: section.questions.map((qq, qi) => ({
          anchorId: questionAnchor(section.id, qq.id),
          qNumber: qi + 1,
          text: qq.text,
          avg: qq.answerType === 'free_text'
            ? undefined
            : scores.find(s => s.questionId === qq.id)?.avg,
        })),
      }]
    })
  }, [survey, templateSections, questionData])

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <h1 className="sr-only">Survey not found</h1>
        <i className="fa-light fa-circle-exclamation text-4xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/surveys">Back to Surveys</Link>
        </Button>
      </div>
    )
  }

  const canClose        = survey.status === 'collecting' || survey.status === 'active'
  const isPendingReview = survey.status === 'pending_review'
  const isActive        = survey.status === 'active' || survey.status === 'collecting'

  const MOCK_SURVEY_LINK = `https://survey.exxat.com/s/${survey.id}`

  function handleCopyLink() {
    navigator.clipboard.writeText(MOCK_SURVEY_LINK).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function toggleFlag(responseId: string) {
    setLocalFlagged(prev => {
      const next = new Set(prev)
      next.has(responseId) ? next.delete(responseId) : next.add(responseId)
      return next
    })
  }

  // ── KPI strip — contextual per survey lifecycle stage ────────────────────────
  const thirdMetric: MetricItem = isPendingReview
    ? {
        id: 'flagged',
        label: 'Flagged responses',
        value: flaggedCount,
        delta: '',
        description: flaggedCount > 0 ? 'Pending review before release' : 'No flagged responses',
        trend: 'neutral',
      }
    : canClose
    ? {
        id: 'time',
        label: 'Time remaining',
        value: `${days}d`,
        delta: '',
        description: `Closes ${survey.deadline}`,
        trend: 'neutral',
      }
    : {
        id: 'closed',
        label: 'Survey closed',
        value: survey.responseCount,
        delta: '',
        description: `Final responses · ${survey.deadline}`,
        trend: 'neutral',
      }

  const kpiMetrics: MetricItem[] = [
    {
      id: 'response-rate',
      label: 'Response rate',
      value: `${survey.responseRate}%`,
      delta: '',
      description: `${survey.responseCount} of ${survey.enrollmentCount} responded`,
      trend: 'neutral',
      metricVariant: 'hero',
    },
    {
      id: 'sections',
      label: 'Template sections',
      value: templateSections.length,
      delta: '',
      description: template?.name ?? 'No template assigned',
      trend: 'neutral',
      href: template ? `/templates/${template.id}` : undefined,
    },
    thirdMetric,
  ]

  return (
    <>
      {/* ── Header ── */}
      <SiteHeader
        breadcrumbs={[
          survey.surveyType === 'programmatic'
            ? { label: 'Dashboard', href: '/analytics/programmatic' }
            : { label: 'Dashboard', href: '/analytics' },
        ]}
        title={`${survey.courseCode} — ${survey.courseName}`}
      />

      {/* ── Title row — h1 + badge left, actions right (matches templates/[id] pattern) ── */}
      <div style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 28, paddingBottom: 0 }}>
        <div className="flex items-center gap-3 mb-5">
          <h1
            className="min-w-0 truncate"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 32,
              fontWeight: 300,
              color: 'var(--foreground)',
              lineHeight: 1.2,
            }}
          >
            {survey.courseCode} — {survey.courseName}
          </h1>
          <SurveyStatusBadge status={survey.status} />
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                aria-label="Copy student survey link"
              >
                <i
                  className={`fa-light fa-${linkCopied ? 'check' : 'link'}`}
                  aria-hidden="true"
                  style={{ fontSize: 12, color: linkCopied ? 'var(--chart-2)' : undefined }}
                />
                {linkCopied ? 'Link copied' : 'Copy survey link'}
              </Button>
            )}
            {canClose && (
              <SendReminderPopover survey={survey}>
                <Button variant="outline" size="sm">
                  <i className="fa-light fa-bell" aria-hidden="true" style={{ fontSize: 12 }} />
                  Send Reminder
                </Button>
              </SendReminderPopover>
            )}
            {isPendingReview && (
              <Button variant="default" size="sm" onClick={() => setReleaseOpen(true)}>
                <i className="fa-light fa-share-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
                Share Results with Faculty
              </Button>
            )}
          </div>
        </div>
      </div>


      {/* ── Body — content + sticky scrollspy rail (page scrolls at window level) ── */}
      <div className="flex-1" style={{ padding: '4px 28px 28px' }}>
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* KPI strip */}
          <KeyMetrics
            variant="compact"
            metricsSingleRow
            metrics={kpiMetrics}
          />

          {/* Instructors */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Instructors</CardTitle>
                {canClose && (
                  <Button variant="ghost" size="sm" onClick={() => setAddGuestOpen(true)}>
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add Guest
                  </Button>
                )}
              </div>
            </CardHeader>
            {survey.instructors.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No instructors assigned.
              </div>
            ) : (
              survey.instructors.map((instructor, i) => (
                <div
                  key={instructor.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < survey.instructors.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className="text-xs"
                        style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                      >
                        {instructor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{instructor.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {instructor.role === 'primary' ? 'Primary instructor' : 'Guest lecturer'}
                      </span>
                    </div>
                  </div>
                  {instructor.role === 'guest' && canClose && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeInstructor(survey.id, instructor.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))
            )}
          </Card>

          {/* AI insight */}
          {responses && responses.comments.length > 0 && (
            <AiInsightCard
              source={`${responses.comments.length} open-text response${responses.comments.length > 1 ? 's' : ''} · ${themes.length} theme${themes.length !== 1 ? 's' : ''} identified`}
              body={
                <div className="flex flex-col gap-3">
                  {themes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {themes.map(t => (
                        <span
                          key={t.label}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                        >
                          <SentimentDot sentiment={t.sentiment} />
                          {t.label}
                          <span style={{ color: 'var(--muted-foreground)' }}>· {t.occurrences}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {trajectoryMsg && (
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {trajectoryMsg}
                    </p>
                  )}
                  {concernCount > 0 && (
                    <p className="text-sm">
                      <strong>{concernCount}</strong> response{concernCount > 1 ? 's raise concerns' : ' raises a concern'}.
                    </p>
                  )}
                </div>
              }
            />
          )}

          {/* ── Section blocks ── */}
          {templateSections.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <i className="fa-light fa-table-list text-3xl text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No template sections</p>
              <p className="text-sm text-muted-foreground">Assign a template with sections to see scores here.</p>
            </Card>
          ) : (
            templateSections.flatMap(section => {
              const isFacultySection = isFacultySubject(section.subjectKey)
              const blocks = questionData?.instructorBlocks

              // Faculty section — repeat once per instructor
              if (isFacultySection && blocks && blocks.length > 0) {
                return blocks.map(block => {
                  const instructor = survey.instructors.find(i => i.id === block.instructorId)
                  const instructorLabel = instructor
                    ? `${instructor.name} · ${instructor.role === 'primary' ? 'Primary instructor' : 'Guest lecturer'}`
                    : null

                  return (
                    <Card key={`${section.id}-${block.instructorId}`} id={sectionAnchor(section.id, block.instructorId)} className="overflow-hidden" style={{ scrollMarginTop: 16 }}>
                      <CardHeader className="border-b">
                        <div className="flex items-center gap-3">
                          {instructor && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback
                                className="text-xs"
                                style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                              >
                                {instructor.initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col gap-0.5">
                            <CardTitle className="text-sm">{section.title}</CardTitle>
                            {instructorLabel && (
                              <p className="text-xs text-muted-foreground">{instructorLabel}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {section.questions.map((q, qi) => (
                        <QuestionChartBlock
                          key={q.id}
                          anchorId={questionAnchor(section.id, q.id, block.instructorId)}
                          question={q}
                          questionNumber={qi + 1}
                          score={block.scores.find(s => s.questionId === q.id)}
                          freeTextCount={questionData?.freeTextCounts[q.id]}
                          surveyId={survey.id}
                          isLast={qi === section.questions.length - 1}
                        />
                      ))}
                    </Card>
                  )
                })
              }

              // All other sections
              const sectionScores = questionData?.sectionScores[section.subjectKey] ?? []
              return [
                <Card key={section.id} id={sectionAnchor(section.id)} className="overflow-hidden" style={{ scrollMarginTop: 16 }}>
                  <CardHeader className="border-b">
                    <CardTitle className="text-sm">{section.title}</CardTitle>
                  </CardHeader>
                  {section.questions.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">No questions in this section.</p>
                    </div>
                  ) : (
                    section.questions.map((q, qi) => (
                      <QuestionChartBlock
                        key={q.id}
                        anchorId={questionAnchor(section.id, q.id)}
                        question={q}
                        questionNumber={qi + 1}
                        score={sectionScores.find(s => s.questionId === q.id)}
                        freeTextCount={questionData?.freeTextCounts[q.id]}
                        surveyId={survey.id}
                        isLast={qi === section.questions.length - 1}
                      />
                    ))
                  )}
                </Card>,
              ]
            })
          )}

          {/* ── Moderation section (pending_review only) ── */}
          {isPendingReview && (
            <div id="moderation-section" className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Review open-text responses</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Flagged responses are hidden from faculty results. Approve all to share.
                  </p>
                </div>
                <Button variant="default" size="sm" onClick={() => setReleaseOpen(true)}>
                  <i className="fa-light fa-share-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
                  Share Results with Faculty
                </Button>
              </div>

              {openTextResps.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <i className="fa-light fa-circle-check text-3xl text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">Nothing to moderate</p>
                  <p className="text-sm text-muted-foreground">No open-text responses for this survey.</p>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  {openTextResps.map((resp, idx) => {
                    const isFlagged = resp.flagged || localFlagged.has(resp.id)
                    return (
                      <div
                        key={resp.id}
                        className="p-4 flex gap-4 items-start"
                        style={{
                          borderBottom: idx < openTextResps.length - 1 ? '1px solid var(--border)' : 'none',
                          backgroundColor: isFlagged ? 'var(--muted)' : undefined,
                        }}
                      >
                        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">
                            {SUBJECT_LABEL[resp.sectionSubject] ?? resp.sectionSubject}
                          </p>
                          <p className="text-xs text-muted-foreground">{resp.questionText}</p>
                          <p className="text-sm">{resp.text}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {isFlagged && (
                            <Badge variant="outline" className="rounded">
                              <i className="fa-light fa-flag" aria-hidden="true" />
                              Flagged
                            </Badge>
                          )}
                          <Button
                            variant={isFlagged ? 'outline' : 'ghost'}
                            size="sm"
                            aria-label={isFlagged ? 'Remove flag from this response' : 'Flag this response'}
                            onClick={() => toggleFlag(resp.id)}
                            style={isFlagged ? { borderColor: 'var(--chart-4)' } : {}}
                          >
                            <i
                              className={`fa-${isFlagged ? 'solid' : 'light'} fa-flag`}
                              aria-hidden="true"
                              style={{ fontSize: 12 }}
                            />
                            {isFlagged ? 'Unflag' : 'Flag'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </Card>
              )}
            </div>
          )}

          </div>

          {railGroups.length > 0 && (
            <SurveyResponseRail groups={railGroups} />
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      <CloseSurveyDialog open={closeOpen} onOpenChange={setCloseOpen} survey={survey} />
      <AddGuestSheet open={addGuestOpen} onOpenChange={setAddGuestOpen} surveyId={survey.id} />
      <ReleaseSheet open={releaseOpen} onOpenChange={setReleaseOpen} survey={survey} />
    </>
  )
}
