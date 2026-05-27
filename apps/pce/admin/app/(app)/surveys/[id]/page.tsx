'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Button, Separator, SidebarTrigger, Avatar, AvatarFallback, Badge,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { BulletGauge } from '@/components/pce/bullet-gauge'
import { SectionScoreStrip } from '@/components/pce/section-score-strip'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import {
  CloseSurveyDialog,
  AddGuestSheet,
  SendReminderPopover,
  ReleaseSheet,
} from '@/components/pce/pce-modals'
import {
  MOCK_RESPONSES,
  MOCK_OPEN_TEXT_RESPONSES,
  type ResponseComment,
  type SubjectKey,
} from '@/lib/pce-mock-data'
import Link from 'next/link'

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
  course_instructor:  'Course Instructor',
  course_coordinator: 'Course Coordinator',
  teaching_assistant: 'Teaching Assistant',
  lab_instructor:     'Lab Instructor',
  course_director:    'Course Director',
  faculty_performance: 'Faculty Performance',
}

// Legacy section key → current SubjectKey (mock data uses old 'faculty_performance' key)
const LEGACY_SECTION_MAP: Record<string, string> = {
  faculty_performance: 'course_instructor',
}

// ── KPI card shell ────────────────────────────────────────────────────────────
function KpiCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 flex flex-col gap-3 bg-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

// ── Sentiment color ───────────────────────────────────────────────────────────
const SENTIMENT_COLOR: Record<string, string> = {
  positive: 'var(--chart-2)',
  neutral:  'var(--muted-foreground)',
  concern:  'var(--chart-4)',
}

// =============================================================================

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, templates, removeInstructor } = usePce()

  const [closeOpen,    setCloseOpen]    = useState(false)
  const [addGuestOpen, setAddGuestOpen] = useState(false)
  const [releaseOpen,  setReleaseOpen]  = useState(false)
  const [localFlagged, setLocalFlagged] = useState<Set<string>>(new Set())
  const [activeTab,    setActiveTab]    = useState('overview')
  const [linkCopied,   setLinkCopied]   = useState(false)

  const survey        = surveys.find(s => s.id === id)
  const template      = survey ? templates.find(t => t.id === survey.templateId) : null
  const responses     = survey ? MOCK_RESPONSES.find(r => r.surveyId === survey.id) : null
  const openTextResps = survey ? MOCK_OPEN_TEXT_RESPONSES.filter(r => r.surveyId === survey.id) : []

  const themes         = useMemo(() => responses ? deriveThemes(responses.comments) : [], [responses])
  const trajectoryMsg  = survey ? trajectoryText(survey.responseCount, survey.openDate, survey.deadline) : null
  const days           = survey ? daysUntil(survey.deadline) : 0

  const positiveCount = responses?.comments.filter(c => c.sentiment === 'positive').length ?? 0
  const neutralCount  = responses?.comments.filter(c => c.sentiment === 'neutral').length  ?? 0
  const concernCount  = responses?.comments.filter(c => c.sentiment === 'concern').length  ?? 0

  const flaggedCount = openTextResps.filter(r => r.flagged || localFlagged.has(r.id)).length

  const templateSections = template?.templateSections?.length
    ? template.templateSections
    : template?.sections.map(s => ({
        id: s,
        subjectKey: s as SubjectKey,
        title: SUBJECT_LABEL[s as SubjectKey] ?? s,
        questions: Object.values(template?.questions ?? {}).flat().filter(q => q.id.startsWith(s[0])),
        order: 0,
      })) ?? []

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <i className="fa-light fa-circle-exclamation text-4xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/surveys">Back to Surveys</Link>
        </Button>
      </div>
    )
  }

  const canClose       = survey.status === 'collecting' || survey.status === 'active'
  const isPendingReview = survey.status === 'pending_review'
  const isReleased     = survey.status === 'released' || survey.status === 'closed'
  const isActive       = survey.status === 'active' || survey.status === 'collecting'

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

  return (
    <>
      {/* ── Header ── */}
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/surveys" className="text-sm text-muted-foreground hover:text-foreground">
          Surveys
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{survey.term}</span>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1
          className="text-sm font-semibold flex-1 truncate"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {survey.courseCode} — {survey.courseName}
        </h1>
        <SurveyStatusBadge status={survey.status} />
        <div className="flex items-center gap-2">
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
      </header>

      {/* ── Flagged responses alert banner ── */}
      {isPendingReview && flaggedCount > 0 && (
        <div
          role="alert"
          className="flex items-center justify-between px-7 py-2.5 text-sm border-b border-border"
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ color: 'var(--chart-4)' }} />
            <span>
              <strong>{flaggedCount} flagged response{flaggedCount > 1 ? 's' : ''}</strong> — review before sharing results.
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('moderate')}>
            Review now
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 11 }} />
          </Button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="border-b border-border px-7 shrink-0">
            <TabsList variant="line">
              <TabsTrigger value="overview">
                <i className="fa-light fa-chart-simple" aria-hidden="true" style={{ fontSize: 13 }} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="sections">
                <i className="fa-light fa-table-list" aria-hidden="true" style={{ fontSize: 13 }} />
                Sections
                {templateSections.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center">
                    {templateSections.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="responses">
                <i className="fa-light fa-comment-lines" aria-hidden="true" style={{ fontSize: 13 }} />
                Responses
                {responses && responses.comments.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center">
                    {responses.comments.length}
                  </Badge>
                )}
              </TabsTrigger>
              {isPendingReview && (
                <TabsTrigger value="moderate">
                  <i className="fa-light fa-shield-check" aria-hidden="true" style={{ fontSize: 13 }} />
                  Moderate
                  {flaggedCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center"
                      style={{ backgroundColor: 'var(--chart-4)', color: 'var(--background)' }}
                    >
                      {flaggedCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto px-7 py-5">

            {/* ── Overview ──────────────────────────────────────────────── */}
            <TabsContent value="overview" className="mt-0 outline-none">
              <div className="max-w-3xl flex flex-col gap-6">

                {/* 3 KPI cards */}
                <div className="grid grid-cols-3 gap-4">

                  {/* Response Rate */}
                  <KpiCard label="Response Rate">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-2xl font-semibold"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {survey.responseRate}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {survey.responseCount} / {survey.enrollmentCount}
                        </span>
                      </div>
                      <BulletGauge
                        responseCount={survey.responseCount}
                        enrollmentCount={survey.enrollmentCount}
                        width={180}
                        height={6}
                        ariaLabel={`Response rate: ${survey.responseRate}% — ${survey.responseCount} of ${survey.enrollmentCount} responded`}
                      />
                      <p className="text-xs text-muted-foreground">N=5 minimum threshold</p>
                    </div>
                  </KpiCard>

                  {/* Time Remaining */}
                  <KpiCard label={canClose ? 'Time Remaining' : 'Closed'}>
                    <div className="flex flex-col gap-1">
                      {canClose ? (
                        <>
                          <span
                            className="text-2xl font-semibold"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {days}d
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Closes {survey.deadline}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium">Survey closed</span>
                          <span className="text-sm text-muted-foreground">{survey.deadline}</span>
                        </>
                      )}
                    </div>
                    {canClose && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit text-destructive"
                        onClick={() => setCloseOpen(true)}
                      >
                        Close early
                      </Button>
                    )}
                  </KpiCard>

                  {/* Template */}
                  <KpiCard label="Template">
                    {template ? (
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/templates/${template.id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: 'var(--brand-color)' }}
                        >
                          {template.name}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {templateSections.length} section{templateSections.length !== 1 ? 's' : ''}
                          {' · '}
                          {template.questionCount} questions
                        </span>
                        {template.courseType && template.courseType !== 'any' && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {template.courseType}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No template assigned</span>
                    )}
                  </KpiCard>
                </div>

                {/* AI Insight */}
                {responses && responses.comments.length > 0 && (
                  <AiInsightCard
                    source={`${responses.comments.length} open-text response${responses.comments.length > 1 ? 's' : ''} · ${themes.length} theme${themes.length !== 1 ? 's' : ''} identified`}
                    body={
                      <div className="flex flex-col gap-3">
                        {/* Theme chips */}
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
                        {/* Trajectory or concern count */}
                        {trajectoryMsg && (
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {trajectoryMsg}
                          </p>
                        )}
                        {concernCount > 0 && (
                          <p className="text-sm">
                            <strong>{concernCount}</strong> response{concernCount > 1 ? 's raise concerns' : ' raises a concern'} — see Responses tab for details.
                          </p>
                        )}
                      </div>
                    }
                    actions={
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('responses')}>
                        View responses
                        <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 11 }} />
                      </Button>
                    }
                  />
                )}

                {/* Instructors */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-sm font-semibold">Instructors</h2>
                    {canClose && (
                      <Button variant="ghost" size="sm" onClick={() => setAddGuestOpen(true)}>
                        <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                        Add Guest
                      </Button>
                    )}
                  </div>
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
                </div>

              </div>
            </TabsContent>

            {/* ── Sections ──────────────────────────────────────────────── */}
            <TabsContent value="sections" className="mt-0 outline-none">
              <div className="max-w-3xl flex flex-col gap-4">
                <p className="text-xs text-muted-foreground">
                  Per-section Likert averages (1–5 scale). Scores appear once responses are collected.
                </p>

                {templateSections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-border rounded-lg">
                    <i className="fa-light fa-table-list text-3xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium">No template sections</p>
                    <p className="text-sm text-muted-foreground">Assign a template with sections to see scores here.</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {templateSections.map((section, idx) => {
                      const legacyKey = LEGACY_SECTION_MAP[section.subjectKey]
                      const score = responses?.sectionScores.find(
                        s => s.section === section.subjectKey ||
                             s.section === legacyKey ||
                             (s.section as string) === section.id
                      )
                      const qCount = section.questions.length
                      const likertCount = section.questions.filter(q => q.answerType === 'likert').length

                      return (
                        <div
                          key={section.id}
                          className="flex items-center gap-6 px-4 py-4"
                          style={{ borderBottom: idx < templateSections.length - 1 ? '1px solid var(--border)' : 'none' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{section.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {qCount > 0
                                ? `${qCount} question${qCount !== 1 ? 's' : ''}${likertCount > 0 ? ` · ${likertCount} rated` : ''}`
                                : 'No questions yet'
                              }
                            </p>
                          </div>
                          {score ? (
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <SectionScoreStrip
                                score={score.avg}
                                width={140}
                                ariaLabel={`${section.title}: ${score.avg.toFixed(1)} out of 5`}
                              />
                              <div className="text-right" style={{ minWidth: 52 }}>
                                <span
                                  className="text-base font-semibold"
                                  style={{ fontVariantNumeric: 'tabular-nums' }}
                                >
                                  {score.avg.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground"> / 5</span>
                              </div>
                              <span
                                className="text-xs text-muted-foreground text-right"
                                style={{ minWidth: 72 }}
                              >
                                {score.count} responses
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground flex-shrink-0">No data yet</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Responses ─────────────────────────────────────────────── */}
            <TabsContent value="responses" className="mt-0 outline-none">
              <div className="max-w-3xl flex flex-col gap-6">
                {responses && responses.comments.length > 0 ? (
                  <>
                    {/* Sentiment summary */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Positive', count: positiveCount, sentiment: 'positive', icon: 'fa-face-smile' },
                        { label: 'Neutral',  count: neutralCount,  sentiment: 'neutral',  icon: 'fa-face-meh' },
                        { label: 'Concerns', count: concernCount,  sentiment: 'concern',  icon: 'fa-face-worried' },
                      ].map(({ label, count, sentiment, icon }) => (
                        <div
                          key={label}
                          className="border border-border rounded-lg px-4 py-3 flex items-center gap-3 bg-card"
                        >
                          <i
                            className={`fa-light ${icon} text-2xl`}
                            aria-hidden="true"
                            style={{ color: SENTIMENT_COLOR[sentiment] }}
                          />
                          <div>
                            <p
                              className="text-2xl font-semibold"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {count}
                            </p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Themes table */}
                    {themes.length > 0 && (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border">
                          <div className="flex items-center gap-1.5">
                            <i
                              className="fa-light fa-sparkles text-xs"
                              aria-hidden="true"
                              style={{ color: 'var(--brand-color)' }}
                            />
                            <h2 className="text-sm font-semibold">Themes</h2>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">AI-identified from open-text responses</p>
                        </div>
                        <div className="grid grid-cols-[1fr_120px_80px] px-4 py-2 border-b border-border">
                          <span className="text-xs text-muted-foreground font-medium">Theme</span>
                          <span className="text-xs text-muted-foreground font-medium">Sentiment</span>
                          <span className="text-xs text-muted-foreground font-medium text-right">Occurrences</span>
                        </div>
                        {themes.map(t => (
                          <div
                            key={t.label}
                            className="grid grid-cols-[1fr_120px_80px] px-4 py-3 items-center"
                            style={{ borderBottom: '1px solid var(--border)' }}
                          >
                            <span className="text-sm">{t.label}</span>
                            <div className="flex items-center gap-2">
                              <SentimentDot sentiment={t.sentiment} />
                              <span
                                className="text-sm"
                                style={{ color: SENTIMENT_COLOR[t.sentiment] }}
                              >
                                {t.sentiment === 'concern' ? 'Concern' : t.sentiment === 'positive' ? 'Positive' : 'Neutral'}
                              </span>
                            </div>
                            <span
                              className="text-sm text-right"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {t.occurrences}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Open-text responses — clinical surveys gated to Moderate tab per HIPAA §10 */}
                    {survey.courseType === 'clinical' ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center border border-border rounded-lg">
                        <i className="fa-light fa-shield-halved text-3xl text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm font-medium">Clinical responses — moderation required</p>
                        <p className="text-sm text-muted-foreground" style={{ maxWidth: 340 }}>
                          Open-text responses from clinical surveys are reviewed in the Moderate tab before release.
                        </p>
                        {isPendingReview && (
                          <Button variant="outline" size="sm" onClick={() => setActiveTab('moderate')}>
                            Go to Moderate
                            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 11 }} />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border">
                          <h2 className="text-sm font-semibold">Open-text responses</h2>
                        </div>
                        {responses.comments.map((comment, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 flex gap-3 items-start"
                            style={{ borderBottom: idx < responses.comments.length - 1 ? '1px solid var(--border)' : 'none' }}
                          >
                            <SentimentDot sentiment={comment.sentiment} />
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <p className="text-sm">{comment.text}</p>
                              <p className="text-xs text-muted-foreground">
                                {(comment.section as string).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <i className="fa-light fa-comment-lines text-4xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium">No responses yet</p>
                    <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
                      Open-text responses will appear here as students submit the survey.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Moderate ──────────────────────────────────────────────── */}
            {isPendingReview && (
              <TabsContent value="moderate" className="mt-0 outline-none">
                <div className="max-w-3xl flex flex-col gap-4">
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
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-border rounded-lg">
                      <i className="fa-light fa-circle-check text-3xl text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm font-medium">Nothing to moderate</p>
                      <p className="text-sm text-muted-foreground">No open-text responses for this survey.</p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
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
                                <span
                                  className="text-xs px-2 py-0.5 rounded-md"
                                  style={{ backgroundColor: 'var(--muted)', color: 'var(--chart-4)' }}
                                >
                                  Flagged
                                </span>
                              )}
                              <Button
                                variant={isFlagged ? 'outline' : 'ghost'}
                                size="sm"
                                aria-label={isFlagged ? 'Remove flag from this response' : 'Flag this response'}
                                onClick={() => toggleFlag(resp.id)}
                                style={isFlagged ? { color: 'var(--chart-4)', borderColor: 'var(--chart-4)' } : {}}
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
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

          </div>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      <CloseSurveyDialog open={closeOpen} onOpenChange={setCloseOpen} survey={survey} />
      <AddGuestSheet open={addGuestOpen} onOpenChange={setAddGuestOpen} surveyId={survey.id} />
      <ReleaseSheet open={releaseOpen} onOpenChange={setReleaseOpen} survey={survey} />
    </>
  )
}
