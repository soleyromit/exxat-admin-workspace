'use client'

/**
 * OVERVIEW TAB — the curricular assessment loop made visible.
 *
 * Aarti's central differentiator: "A three-way connection between what is
 * taught (course objectives), what is assessed (questions), and how students
 * perform. No current software provides this complete chain."
 *
 * Layout:
 *   1. KPI strip — at-a-glance summary
 *   2. Curricular Loop card — objectives × questions × performance
 *      (visual three-way link)
 *   3. Recent activity timeline — what just happened in this course
 *   4. Untested-objective callout (if any) — gap-fill prompt
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button, Badge, ToggleSwitch,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxat/ds/packages/ui/src'
import { AiGenerateModal } from '@/components/ai-generate-modal'
import { CurricularLoopDiagram } from '@/components/curricular-loop-diagram'
import { ObjectiveDeepDiveSheet } from '@/components/objective-deep-dive-sheet'
import { KpiTile, type Tone } from '@/components/faculty-ui-kit'
import { StubButton } from '@/components/stub-button'
import { useCommunicationPolicy } from '@/lib/communication-policy-store'
import { useFacultySession } from '@/lib/faculty-session'
import type { Course } from '@/lib/qb-types'
import type { Assessment } from '@/lib/qb-types'
import type { Student, CourseObjective, AssessmentReview } from '@/lib/faculty-mock-data'

interface OverviewTabProps {
  course: Course
  students: Student[]
  assessments: Array<Assessment | { id: string; courseId: string; offeringId: string; title: string; questionCount: number; durationMinutes: number }>
  objectives: CourseObjective[]
  reviewByAssessment: Map<string, AssessmentReview>
  onJumpToTab: (tab: string) => void
}

export function OverviewTab({
  course, students, assessments, objectives, reviewByAssessment, onJumpToTab,
}: OverviewTabProps) {
  const router = useRouter()
  const [aiOpen, setAiOpen] = useState(false)
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null)
  const selectedObjective = selectedObjectiveId
    ? objectives.find(o => o.id === selectedObjectiveId) ?? null
    : null
  // Cohort average performance
  const courseAvg = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.avgScore[course.id] ?? 0), 0) / students.length)
    : 0

  // Bottom-20% count (at-risk students)
  const atRiskCount = students.filter(s => s.status === 'at-risk').length

  // Untested objectives
  const untested = objectives.filter(o => !o.lastAssessed)

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Hero KPI strip ─────────────────────────────────────────────── */}
      <section
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        <KpiTile
          icon="fa-chart-line"
          label="Cohort average"
          value={courseAvg > 0 ? `${courseAvg}%` : '—'}
          tone={courseAvg >= 80 ? 'success' : courseAvg >= 70 ? 'info' : courseAvg > 0 ? 'warning' : 'neutral'}
          sub={courseAvg > 0 ? `${students.length} students assessed` : 'No assessments yet'}
        />
        <KpiTile
          icon="fa-triangle-exclamation"
          label="At-risk students"
          value={atRiskCount}
          tone={atRiskCount > 0 ? 'warning' : 'success'}
          sub={atRiskCount > 0 ? 'Bottom 20% by performance' : 'None flagged'}
          onClick={atRiskCount > 0 ? () => onJumpToTab('students') : undefined}
        />
      </section>

      {/* ─── Untested objectives gap-fill callout ───────────────────────── */}
      {untested.length > 0 && (
        <Card className="border-l-3 border-l-chart-4">
          <CardContent className="flex items-start gap-3">
            <i
              className="fa-light fa-bullseye-pointer text-chart-4 text-sm mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground text-sm">
                  {untested.length} {untested.length === 1 ? 'objective hasn\'t' : 'objectives haven\'t'} been assessed yet
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold cursor-help"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <i className="fa-light fa-circle-info" aria-hidden="true" />
                      Data source
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Reads curriculum-mapping data from Prism (course objective → standard mapping).
                    Faculty must map their course objectives in Prism for this insight to populate.
                    Mocked here while the integration is finalized.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Generate questions from these objectives to close curriculum gaps before your next exam.
              </p>
              <ul className="flex flex-col gap-1.5 mt-2">
                {untested.slice(0, 3).map(o => (
                  <li
                    key={o.id}
                    className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground"
                  >
                    <i className="fa-light fa-circle-dashed text-chart-4 shrink-0" aria-hidden="true" style={{ fontSize: 10 }} />
                    <span className="line-clamp-1">{o.title}</span>
                  </li>
                ))}
                {untested.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    +{untested.length - 3} more
                  </li>
                )}
              </ul>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" className="gap-2" onClick={() => setAiOpen(true)}>
                <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />
                Generate with AI
              </Button>
              <Button variant="outline" size="sm" onClick={() => onJumpToTab('questions')} className="gap-2">
                Browse questions
                <i className="fa-light fa-arrow-right" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Curricular Loop card — Aarti's central differentiator ──────── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
            <i
              className="fa-duotone fa-solid fa-grid-2 text-brand text-sm"
              aria-hidden="true"
            />
            Curricular assessment matrix
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium ms-1">
              Differentiator
            </span>
          </CardTitle>
          <CardDescription className="text-xs max-w-2xl">
            Each objective plotted by how often it&apos;s assessed and how students perform on it.
            The four quadrants tell you where to invest next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurricularLoopDiagram
            objectives={objectives}
            students={students}
            assessments={assessments}
            cohortAvg={courseAvg}
            reviewByAssessment={reviewByAssessment}
            onObjectiveClick={(objectiveId) => setSelectedObjectiveId(objectiveId)}
          />
        </CardContent>
      </Card>

      {/* Objective deep-dive — opened from any matrix cell or row.
          Replaces the previous "jump to sibling tab" routing which silently
          went to a non-existent Questions tab (Vishaka removed it; see
          comment in course-detail-client.tsx). "Open in Question Bank"
          routes to the global QB hub instead. */}
      <ObjectiveDeepDiveSheet
        objective={selectedObjective}
        students={students}
        assessments={assessments}
        onClose={() => setSelectedObjectiveId(null)}
        onOpenInQB={() => { setSelectedObjectiveId(null); router.push('/question-bank') }}
        onReviewStudents={() => { setSelectedObjectiveId(null); onJumpToTab('students') }}
        onGenerateMore={() => { setSelectedObjectiveId(null); setAiOpen(true) }}
      />

      {/* ─── Course communication preferences ─────────────────────────────
           Per Aarti+Vishaka: post-results chat is configurable at institution
           OR course level. Institution-wide gate lives in /settings; this row
           lets the course coordinator override on a per-course basis. */}
      <CourseChatToggleSection courseId={course.id} />

      {/* ─── Recent activity ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">Recent activity</CardTitle>
          <StubButton variant="ghost" size="sm" className="col-start-2 row-start-1 self-start justify-self-end">
            View all
            <i className="fa-light fa-arrow-right ms-1" aria-hidden="true" style={{ fontSize: 10 }} />
          </StubButton>
        </CardHeader>
        <CardContent>
          <ActivityTimeline reviewByAssessment={reviewByAssessment} assessments={assessments} />
        </CardContent>
      </Card>

      {/* AI generation modal — controlled by aiOpen */}
      <AiGenerateModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        objectives={untested}
      />
    </div>
  )
}

// (Local KpiTile + TONE removed — now uses shared kit KpiTile.)
type KpiTone = Tone

// ─── Activity timeline ───────────────────────────────────────────────────────
function ActivityTimeline({
  reviewByAssessment, assessments,
}: {
  reviewByAssessment: Map<string, AssessmentReview>
  assessments: OverviewTabProps['assessments']
}) {
  // Build activity items from review states
  const items = assessments
    .map(a => {
      const r = reviewByAssessment.get(a.id)
      if (!r) return null
      return { assessment: a, review: r }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aDate = a!.review.publishedAt ?? a!.review.reviewedAt ?? a!.review.submittedAt ?? ''
      const bDate = b!.review.publishedAt ?? b!.review.reviewedAt ?? b!.review.submittedAt ?? ''
      return bDate.localeCompare(aDate)
    })
    .slice(0, 5)

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">No recent activity in this course.</p>
    )
  }

  return (
    <div className="flex flex-col">
      {items.map((item, idx) => {
        if (!item) return null
        const { assessment, review } = item
        const event = describeEvent(review)
        return (
          <div key={assessment.id} className="flex items-start gap-3 py-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full shrink-0"
              style={{ background: event.bg }}
            >
              <i className={`fa-light ${event.icon}`} aria-hidden="true" style={{ fontSize: 12, color: event.fg }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium text-foreground">{assessment.title}</span>
                <span className="text-muted-foreground"> · {event.label}</span>
              </p>
              {review.reviewNotes && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate italic">
                  &ldquo;{review.reviewNotes}&rdquo;
                </p>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {relativeTime(review.publishedAt ?? review.reviewedAt ?? review.submittedAt)}
            </span>
            {idx < items.length - 1 && (
              <div
                aria-hidden="true"
                className="absolute"
                style={{ display: 'none' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function describeEvent(r: AssessmentReview) {
  if (r.state === 'results-published') return { label: 'Results published', icon: 'fa-eye', bg: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))', fg: 'var(--chart-2)' }
  if (r.state === 'in-progress') return { label: 'Live now', icon: 'fa-play', bg: 'color-mix(in oklch, var(--chart-1) 14%, var(--background))', fg: 'var(--chart-1)' }
  if (r.state === 'submitted') return { label: 'All students submitted', icon: 'fa-check-double', bg: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))', fg: 'var(--chart-2)' }
  if (r.state === 'published') return { label: 'Published', icon: 'fa-bullhorn', bg: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))', fg: 'var(--brand-color)' }
  if (r.state === 'approved') return { label: 'Approved by chair', icon: 'fa-check-circle', bg: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))', fg: 'var(--chart-2)' }
  if (r.state === 'changes-requested') return { label: 'Chair requested changes', icon: 'fa-arrows-rotate', bg: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', fg: 'var(--chart-4)' }
  if (r.state === 'pending-chair') return { label: 'Sent for chair review', icon: 'fa-hourglass-half', bg: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', fg: 'var(--chart-4)' }
  return { label: 'Draft saved', icon: 'fa-file-pen', bg: 'var(--muted)', fg: 'var(--muted-foreground)' }
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const days = Math.round((now - then) / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return `${Math.round(days / 30)}mo ago`
}

// ─── Course-level chat policy toggle ─────────────────────────────────────────
//
// Per-course override on the institution chat capability. Cascades through to
// the assessment-taker's "Faculty Q&A" banner. Read-only for non-admin view.
function CourseChatToggleSection({ courseId }: { courseId: string }) {
  const { role } = useFacultySession()
  const isReadOnly = role !== 'admin'
  const {
    institutionAllowChat,
    institutionDefault,
    courseOverrides,
    setCourseChatOverride,
    isChatEnabledForCourse,
  } = useCommunicationPolicy()

  const override = courseOverrides.find(o => o.courseId === courseId)
  const effective = isChatEnabledForCourse(courseId)
  const usingDefault = !override

  const handleToggle = (next: boolean) => {
    // If the next value matches institution default, clear override (revert)
    if (next === (institutionDefault === 'on')) {
      setCourseChatOverride(courseId, null)
    } else {
      setCourseChatOverride(courseId, next)
    }
  }

  if (!institutionAllowChat) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3">
          <i className="fa-light fa-comment-slash text-muted-foreground text-sm mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Post-results chat is disabled at the institution level
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cannot be enabled per course while the institution master switch is off. Contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <i
          className="fa-duotone fa-solid fa-comments text-sm shrink-0"
          style={{ color: effective ? 'var(--brand-color)' : 'var(--muted-foreground)' }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">Post-results faculty Q&amp;A for this course</p>
            <Badge
              variant="secondary"
              className="rounded font-mono text-[9px] uppercase tracking-wider"
              style={{
                backgroundColor: effective
                  ? 'color-mix(in oklch, var(--chart-2) 14%, var(--background))'
                  : 'var(--muted)',
                color: effective ? 'var(--chart-2)' : 'var(--muted-foreground)',
              }}
            >
              {effective ? 'Enabled' : 'Disabled'}
            </Badge>
            {usingDefault && (
              <span className="text-[10px] text-muted-foreground">
                · using institution default ({institutionDefault})
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isReadOnly
              ? 'Read-only — only an Administrator can change this.'
              : effective
                ? 'Students see a "Message faculty" CTA on their published-results page.'
                : 'Students will not see a chat option after results publish.'}
          </p>
        </div>
        <div className="shrink-0">
          {isReadOnly ? (
            <Badge
              variant="secondary"
              className="rounded-full gap-1.5"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              <i className="fa-light fa-eye" aria-hidden="true" style={{ fontSize: 11 }} />
              View only
            </Badge>
          ) : (
            <ToggleSwitch
              checked={effective}
              onChange={handleToggle}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
