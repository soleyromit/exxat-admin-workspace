'use client'

import { useParams } from 'next/navigation'
import { Button, Badge } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { SectionScoreStrip } from '@/components/pce/section-score-strip'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import {
  MOCK_RESPONSES,
  MOCK_SUBJECTS,
  type ResponseComment,
  type TemplateSection,
  type SubjectKey,
} from '@/lib/pce-mock-data'
import Link from 'next/link'

// ── Likert distribution derivation ───────────────────────────────────────────
// Derives a plausible 1–5 distribution from a section average.
// In production this comes from the data layer. In mock, we approximate.
function deriveDistribution(avg: number, count: number): Record<number, number> {
  // Clamp avg to 1–5 and spread responses around it using a simple triangle.
  const clamped = Math.min(Math.max(avg, 1), 5)
  const weights: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  for (let v = 1; v <= 5; v++) {
    const dist = Math.abs(v - clamped)
    weights[v] = Math.max(0, 1 - dist * 0.45)
  }

  const total = Object.values(weights).reduce((s, w) => s + w, 0)
  const result: Record<number, number> = {}
  let remaining = count

  for (let v = 5; v >= 2; v--) {
    result[v] = Math.round((weights[v] / total) * count)
    remaining -= result[v]
  }
  result[1] = Math.max(0, remaining)

  return result
}

// ── AI theme derivation (same as survey detail) ───────────────────────────────
interface ThemeRow { label: string; sentiment: 'positive' | 'neutral' | 'concern'; occurrences: number }

const THEME_PATTERNS = [
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
    const hasConcern  = matched.some(c => c.sentiment === 'concern')
    const hasPositive = matched.some(c => c.sentiment === 'positive')
    return [{
      label: theme.label,
      sentiment: hasConcern ? 'concern' : hasPositive ? 'positive' : 'neutral',
      occurrences: matched.length,
    }]
  })
}

// ── Sentiment dot ─────────────────────────────────────────────────────────────
function SentimentDot({ sentiment }: { sentiment: 'positive' | 'neutral' | 'concern' }) {
  const color = sentiment === 'positive' ? 'var(--chart-2)' : sentiment === 'concern' ? 'var(--chart-4)' : 'var(--muted-foreground)'
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
    />
  )
}

// ── Subject label lookup ───────────────────────────────────────────────────────
const LEGACY_LABEL: Record<TemplateSection, string> = {
  course_content:     'Course Content',
  faculty_performance: 'Faculty Performance',
  course_director:    'Course Director',
}

const SUBJECT_LABEL: Record<SubjectKey, string> = {
  course_content:     'Course Content',
  course_instructor:  'Course Instructor',
  course_coordinator: 'Course Coordinator',
  teaching_assistant: 'Teaching Assistant',
  lab_instructor:     'Lab Instructor',
  course_director:    'Course Director',
}

// ── Likert distribution bar row ───────────────────────────────────────────────
function DistributionRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const barWidth = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground tabular-nums shrink-0" style={{ minWidth: 16, textAlign: 'right' }}>{label}</span>
      <div className="flex-1 relative" style={{ height: 6, backgroundColor: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${barWidth}%`, backgroundColor: 'var(--brand-color)', borderRadius: 3 }} />
      </div>
      <span className="text-xs tabular-nums shrink-0 text-muted-foreground" style={{ minWidth: 32, textAlign: 'right' }}>{pct}%</span>
      <span className="text-xs tabular-nums shrink-0 text-muted-foreground" style={{ minWidth: 48 }}>{count} {count === 1 ? 'resp.' : 'resp.'}</span>
    </div>
  )
}

// =============================================================================

export default function FacultyResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, templates, hiddenComments } = usePce()

  const survey   = surveys.find(s => s.id === id)
  const template = survey ? templates.find(t => t.id === survey.templateId) : null
  const isReleased = survey?.status === 'released' || survey?.status === 'closed'
  const responses  = isReleased ? MOCK_RESPONSES.find(r => r.surveyId === id) : null
  const hidden     = hiddenComments[id] ?? []

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <i className="fa-light fa-circle-exclamation text-4xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/my-surveys">Back to My Surveys</Link>
        </Button>
      </div>
    )
  }

  const themes = responses ? deriveThemes(
    responses.comments.filter((_, i) => !hidden.includes(i))
  ) : []

  // Prior term avg for this course (most recent prior offering)
  const priorOffering = survey.priorOfferings?.at(-1) ?? null

  // Template sections — prefer new model, fall back to legacy
  const templateSections = template?.templateSections?.length
    ? template.templateSections
    : template?.sections.map(s => ({
        id: s,
        subjectKey: s as SubjectKey,
        title: LEGACY_LABEL[s as TemplateSection] ?? s,
        questions: Object.values(template?.questions ?? {}).flat(),
        order: 0,
      })) ?? []

  return (
    <>
      {/* ── Header ── */}
      <SiteHeader title={`${survey.courseCode} — ${survey.courseName}`} />
      <div
        className="flex items-center gap-3 shrink-0"
        style={{ padding: '14px 28px 14px' }}
      >
        <Link href="/my-surveys" className="text-sm text-muted-foreground hover:text-foreground">
          My Surveys
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
          {survey.courseCode} — {survey.courseName}
        </h1>
        {survey.releasedAt ? (
          <Badge
            variant="secondary"
            className="rounded shrink-0"
            style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}
          >
            Shared {survey.releasedAt}
          </Badge>
        ) : (
          <Badge variant="secondary" className="rounded shrink-0"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {survey.term}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto" tabIndex={0} style={{ padding: '20px 28px 32px' }}>
        {!isReleased ? (
          // ── Not yet released ──────────────────────────────────────────────
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full"
              style={{ backgroundColor: 'var(--brand-tint)' }}
            >
              <i className="fa-light fa-lock-keyhole text-2xl" aria-hidden="true"
                style={{ color: 'var(--brand-color-dark)' }} />
            </div>
            <div className="flex flex-col gap-2" style={{ maxWidth: 340 }}>
              <p className="text-base font-semibold">Results aren't available yet</p>
              <p className="text-sm text-muted-foreground">
                Currently <span className="font-medium text-foreground">{survey.responseRate}%</span> response rate
                ({survey.responseCount} of {survey.enrollmentCount}).
                Deadline: {survey.deadline}.
              </p>
              <p className="text-sm text-muted-foreground">
                Your program administrator reviews responses before sharing with instructors.
                You'll be notified when results are ready.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-surveys">Back to My Surveys</Link>
            </Button>
          </div>

        ) : !responses ? (
          // ── Released but no response data ────────────────────────────────
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i className="fa-light fa-chart-bar text-4xl text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">No responses were collected for this survey.</p>
          </div>

        ) : (
          // ── Results ───────────────────────────────────────────────────────
          <div className="max-w-2xl flex flex-col gap-6">

            {/* KPI stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: 'Response rate',
                  value: `${survey.responseRate}%`,
                  sub: `${survey.responseCount} of ${survey.enrollmentCount} enrolled`,
                },
                {
                  label: 'Responses',
                  value: String(survey.responseCount),
                  sub: `${responses.comments.filter((_, i) => !hidden.includes(i)).length} with written feedback`,
                },
                {
                  label: 'Shared',
                  value: survey.releasedAt ?? survey.term,
                  sub: `${survey.term}`,
                },
              ].map(stat => (
                <div key={stat.label} className="border border-border rounded-lg p-4 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <span className="text-2xl font-semibold tabular-nums" style={{ fontFamily: 'var(--font-heading)' }}>{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.sub}</span>
                </div>
              ))}
            </div>

            {/* AI Insight — themes before per-section detail (Aarti D14) */}
            {themes.length > 0 && responses.comments.length > 0 && (
              <AiInsightCard
                source={`${responses.comments.filter((_, i) => !hidden.includes(i)).length} open-text response${responses.comments.length > 1 ? 's' : ''} · ${themes.length} theme${themes.length !== 1 ? 's' : ''} identified`}
                body={
                  <div className="flex flex-col gap-3">
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
                    {themes.filter(t => t.sentiment === 'concern').length > 0 && (
                      <p className="text-sm">
                        <strong>{themes.filter(t => t.sentiment === 'concern').length} theme{themes.filter(t => t.sentiment === 'concern').length > 1 ? 's' : ''}</strong> flagged
                        as areas for consideration — see written feedback below.
                      </p>
                    )}
                  </div>
                }
              />
            )}

            {/* Per-section results — 15Five pattern */}
            {templateSections.map(section => {
              const score = responses.sectionScores.find(
                s => s.section === section.subjectKey ||
                     s.section === (section.id as string) ||
                     (section.subjectKey === 'course_instructor' && s.section === 'faculty_performance')
              )
              if (!score) return null

              const subjectMeta = MOCK_SUBJECTS.find(s => s.key === section.subjectKey)
              const sectionComments = responses.comments
                .map((c, i) => ({ ...c, globalIndex: i }))
                .filter(c =>
                  !hidden.includes(c.globalIndex) &&
                  (c.section === section.subjectKey ||
                   c.section === (section.id as string) ||
                   (section.subjectKey === 'course_instructor' && c.section === 'faculty_performance'))
                )

              const positiveComments = sectionComments.filter(c => c.sentiment === 'positive')
              const concernComments  = sectionComments.filter(c => c.sentiment === 'concern')
              const neutralComments  = sectionComments.filter(c => c.sentiment === 'neutral')

              // Prior term avg for this section
              const priorAvg = section.subjectKey === 'course_content'
                ? priorOffering?.courseAvg
                : section.subjectKey === 'course_instructor'
                ? priorOffering?.facultyAvg
                : null

              // Per-question Likert questions
              const likertQuestions = section.questions.filter(q => q.answerType === 'likert')
              const openTextQuestions = section.questions.filter(q => q.answerType === 'free_text')

              return (
                <div key={section.id} className="flex flex-col gap-0">

                  {/* Section heading */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                        {section.title}
                      </h2>
                      {subjectMeta && (
                        <p className="text-xs text-muted-foreground mt-0.5">{subjectMeta.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {priorAvg && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          Prior term: {priorAvg.toFixed(1)}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-2xl font-semibold tabular-nums"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {score.avg.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 5</span>
                      </div>
                    </div>
                  </div>

                  {/* Score strip + prior comparison */}
                  <div className="flex flex-col gap-2 mb-4">
                    <SectionScoreStrip
                      score={score.avg}
                      width={560}
                      ariaLabel={`${section.title}: ${score.avg.toFixed(1)} out of 5`}
                    />
                    {priorAvg && (
                      <div className="flex items-center gap-2">
                        <SectionScoreStrip
                          score={priorAvg}
                          width={560}
                          ariaLabel={`Prior term: ${priorAvg.toFixed(1)} out of 5`}
                        />
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {priorAvg.toFixed(1)} prior
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Based on {score.count} response{score.count !== 1 ? 's' : ''}
                      {priorAvg && (
                        <span>
                          {' · '}
                          {score.avg > priorAvg
                            ? <span style={{ color: 'var(--chart-2)' }}>↑ {(score.avg - priorAvg).toFixed(1)} from prior term</span>
                            : score.avg < priorAvg
                            ? <span style={{ color: 'var(--chart-4)' }}>↓ {(priorAvg - score.avg).toFixed(1)} from prior term</span>
                            : <span>No change from prior term</span>
                          }
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Per-question Likert distribution — Sprig pattern */}
                  {likertQuestions.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden mb-4">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium">Rating distribution</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {likertQuestions.length} rated question{likertQuestions.length !== 1 ? 's' : ''} · {score.count} responses each
                        </p>
                      </div>
                      <div className="px-4 py-3 flex flex-col gap-4">
                        {likertQuestions.map((q, qi) => {
                          const dist = deriveDistribution(score.avg, score.count)
                          return (
                            <div key={q.id} className="flex flex-col gap-2">
                              <p className="text-sm leading-snug">{q.text}</p>
                              <div className="flex flex-col gap-1.5">
                                {[5, 4, 3, 2, 1].map(v => (
                                  <DistributionRow
                                    key={v}
                                    label={String(v)}
                                    count={dist[v] ?? 0}
                                    total={score.count}
                                  />
                                ))}
                              </div>
                              {qi < likertQuestions.length - 1 && (
                                <div style={{ borderBottom: '1px solid var(--border)', marginTop: 4 }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Open text responses grouped by sentiment */}
                  {sectionComments.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden mb-4">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium">Written feedback</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sectionComments.length} response{sectionComments.length !== 1 ? 's' : ''} · selected by your program administrator
                        </p>
                      </div>
                      {positiveComments.length > 0 && (
                        <div>
                          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                            <SentimentDot sentiment="positive" />
                            <span className="text-xs font-medium" style={{ color: 'var(--chart-2)' }}>
                              What students appreciated ({positiveComments.length})
                            </span>
                          </div>
                          {positiveComments.slice(0, 3).map((c, i) => (
                            <div
                              key={i}
                              className="px-4 py-3 text-sm"
                              style={{ borderBottom: i < Math.min(positiveComments.length, 3) - 1 ? '1px solid var(--border)' : 'none' }}
                            >
                              "{c.text}"
                            </div>
                          ))}
                        </div>
                      )}
                      {concernComments.length > 0 && (
                        <div style={{ borderTop: positiveComments.length > 0 ? '1px solid var(--border)' : undefined }}>
                          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                            <SentimentDot sentiment="concern" />
                            <span className="text-xs font-medium" style={{ color: 'var(--chart-4)' }}>
                              Areas for consideration ({concernComments.length})
                            </span>
                          </div>
                          {concernComments.slice(0, 3).map((c, i) => (
                            <div
                              key={i}
                              className="px-4 py-3 text-sm"
                              style={{ borderBottom: i < Math.min(concernComments.length, 3) - 1 ? '1px solid var(--border)' : 'none' }}
                            >
                              "{c.text}"
                            </div>
                          ))}
                        </div>
                      )}
                      {neutralComments.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                            <SentimentDot sentiment="neutral" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Also noted ({neutralComments.length})
                            </span>
                          </div>
                          {neutralComments.slice(0, 2).map((c, i) => (
                            <div
                              key={i}
                              className="px-4 py-3 text-sm"
                              style={{ borderBottom: i < Math.min(neutralComments.length, 2) - 1 ? '1px solid var(--border)' : 'none' }}
                            >
                              "{c.text}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section divider */}
                  <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 24 }} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
