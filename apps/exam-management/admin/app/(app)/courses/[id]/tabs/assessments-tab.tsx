'use client'

/**
 * ASSESSMENTS TAB — pre-publication chair approval workflow.
 *
 * Aarti's "Assessment review workflow — Pre-publication chair approval is not
 * available in ExamSoft and is a high-value feature for academic programs."
 *
 * State machine (from faculty-mock-data.ts AssessmentReviewState):
 *   draft → pending-chair → (changes-requested ⇄ pending-chair) → approved
 *         → published → in-progress → submitted → results-published
 *
 * Card layout per assessment:
 *   - Status pill (color-coded by state) + reviewer attribution
 *   - Title + key metrics (questions, duration, students)
 *   - Inline difficulty distribution mini-chart (embedded intelligence)
 *   - State-specific quick action (Submit, View notes, Approve, Publish, etc.)
 *   - Expandable revision history
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Button, Tooltip, TooltipTrigger, TooltipContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@exxat/ds/packages/ui/src'
import { StatusPill, type Tone } from '@/components/faculty-ui-kit'
import { WorkflowStepIndicator } from '@/components/workflow-step-indicator'
import type { Assessment, QDiff } from '@/lib/qb-types'
import type { AssessmentReview, AssessmentReviewState } from '@/lib/faculty-mock-data'

interface AssessmentsTabProps {
  assessments: Array<Assessment | { id: string; courseId: string; offeringId: string; title: string; questionCount: number; durationMinutes: number; diffDistribution?: Record<QDiff, number> }>
  reviewByAssessment: Map<string, AssessmentReview>
  isViewer: boolean
  courseId: string
}

// Group order for sections.
// Per Vishaka: order = live → drafts → completed. "Awaiting results" copy
// removed — confusing about who's awaiting (students vs faculty).
const GROUP_ORDER: { key: AssessmentReviewState | 'draft'; title: string; sub: string; icon: string }[] = [
  // ── LIVE — running or open
  { key: 'in-progress',         title: 'Live now',                sub: 'Students are currently taking these', icon: 'fa-play' },
  { key: 'published',           title: 'Open window',             sub: 'Window is open — students can start', icon: 'fa-bullhorn' },
  // ── IN PROGRESS — drafts + chair-review states
  { key: 'draft',               title: 'Drafts',                  sub: 'Not yet sent for review', icon: 'fa-file-pen' },
  { key: 'changes-requested',   title: 'Changes requested',       sub: 'Chair sent back with notes', icon: 'fa-arrows-rotate' },
  { key: 'pending-chair',       title: 'Pending chair review',    sub: 'Awaiting approval before publishing', icon: 'fa-hourglass-half' },
  { key: 'approved',            title: 'Approved · ready to publish', sub: 'Chair-approved, awaiting your publish action', icon: 'fa-check-circle' },
  // ── COMPLETED — submitted or fully published
  { key: 'submitted',           title: 'Submitted · pending publication', sub: 'All students submitted — review before publishing results', icon: 'fa-check-double' },
  { key: 'results-published',   title: 'Completed',               sub: 'Results visible to students', icon: 'fa-chart-line' },
]

export function AssessmentsTab({ assessments, reviewByAssessment, isViewer, courseId }: AssessmentsTabProps) {
  // Group assessments by state
  const grouped = new Map<AssessmentReviewState | 'draft', AssessmentsTabProps['assessments']>()
  for (const a of assessments) {
    const state = reviewByAssessment.get(a.id)?.state ?? 'draft'
    const arr = grouped.get(state) ?? []
    arr.push(a)
    grouped.set(state, arr)
  }

  // Hide groups that are empty
  const visibleGroups = GROUP_ORDER.filter(g => (grouped.get(g.key) ?? []).length > 0)

  if (assessments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full mx-auto mb-3 bg-muted">
          <i className="fa-light fa-clipboard-list text-muted-foreground text-xl" aria-hidden="true" />
        </div>
        <p className="font-heading text-lg font-semibold text-foreground">
          No assessments in this course yet
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          {isViewer
            ? 'No assessments have been created yet. You\'ll see them here once available.'
            : 'Build your first assessment from existing questions in the Question Bank.'}
        </p>
        {!isViewer && (
          <Button size="default" asChild className="mt-4 gap-2">
            <Link href={`/assessment-builder?courseId=${courseId}`}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Create assessment
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Persistent Create CTA — Vishaka: assessment creation is the meat of
          why faculty come into a course. Don't bury behind empty state. */}
      {!isViewer && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {assessments.length} {assessments.length === 1 ? 'assessment' : 'assessments'} in this course
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Build a new exam from this course&apos;s question bank
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href={`/assessment-builder?courseId=${courseId}`}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Create assessment
            </Link>
          </Button>
        </div>
      )}

      {visibleGroups.map(g => (
        <section key={g.key}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="font-heading text-base font-semibold text-foreground">
              {g.title}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              · {grouped.get(g.key)!.length}
            </span>
            <p className="text-sm text-muted-foreground">{g.sub}</p>
          </div>
          <div className="flex flex-col gap-2">
            {grouped.get(g.key)!.map(a => (
              <AssessmentCard
                key={a.id}
                assessment={a}
                review={reviewByAssessment.get(a.id) ?? null}
                isViewer={isViewer}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── Assessment card ─────────────────────────────────────────────────────────
function AssessmentCard({
  assessment, review, isViewer,
}: {
  assessment: AssessmentsTabProps['assessments'][number]
  review: AssessmentReview | null
  isViewer: boolean
}) {
  const [open, setOpen] = useState(false)
  const state = review?.state ?? 'draft'
  const tone = STATE_TONE[state]

  // Border-left class per tone (state's accent color shown as a 3px-left rail)
  const railClass = TONE_RAIL[tone]

  // Difficulty distribution (when available)
  const diffDist = (assessment as any).diffDistribution as Record<QDiff, number> | undefined

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`rounded-xl border bg-card transition-shadow hover:shadow-md border-l-3 ${railClass} ${open ? TONE_OPEN_BORDER[tone] : 'border-border'}`}
      >
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
          {/* Left: metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatePill state={state} />
              {state === 'in-progress' && review && (
                <span className="text-xs font-semibold flex items-center gap-1.5 text-chart-1">
                  <span className="inline-block size-1.5 rounded-full bg-chart-1 [animation:pulse-soft_1.6s_ease-in-out_infinite]" />
                  {review.inProgressCount} in progress · {review.submittedCount} submitted
                </span>
              )}
              {review?.reviewerName && state !== 'draft' && (
                <span className="text-xs text-muted-foreground">
                  <i className="fa-light fa-user-tie text-[10px]" aria-hidden="true" /> Reviewer: <span className="text-foreground font-medium">{review.reviewerName}</span>
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground leading-tight">{assessment.title}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <i className="fa-light fa-circle-question text-[10px]" aria-hidden="true" />
                {assessment.questionCount} questions
              </span>
              <span className="flex items-center gap-1">
                <i className="fa-light fa-clock text-[10px]" aria-hidden="true" />
                {assessment.durationMinutes} min
              </span>
              {review?.publishedAt && (
                <span className="flex items-center gap-1">
                  <i className="fa-light fa-calendar-check text-[10px]" aria-hidden="true" />
                  Published {relativeTime(review.publishedAt)}
                </span>
              )}
              {review?.submittedAt && state === 'pending-chair' && (
                <span className="flex items-center gap-1 text-chart-4">
                  <i className="fa-light fa-paper-plane text-[10px]" aria-hidden="true" />
                  Sent for review {relativeTime(review.submittedAt)}
                </span>
              )}
            </div>

            {/* Workflow step indicator — visualizes the chair-approval lifecycle */}
            <div className="mt-3 max-w-md">
              <WorkflowStepIndicator state={state} compact />
            </div>

            {/* Inline difficulty distribution — embedded intelligence */}
            {diffDist && (
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                  Difficulty mix
                </span>
                <DifficultyMiniBar dist={diffDist} />
              </div>
            )}
          </div>

          {/* Right: state-specific actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ActionsForState
              state={state}
              assessmentId={assessment.id}
              isViewer={isViewer}
            />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={open ? 'Collapse details' : 'Expand details'}>
                <i className={`fa-light fa-chevron-down transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border px-4 py-3 grid gap-4 grid-cols-[minmax(0,1fr)_240px]">
            {/* Reviewer notes */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Review notes
              </p>
              {review?.reviewNotes ? (
                <div
                  className={`rounded-lg p-3 text-sm leading-relaxed text-foreground border ${state === 'changes-requested' ? 'bg-chart-4/8 border-chart-4/26' : 'bg-muted border-border'}`}
                >
                  <div className="flex items-start gap-2">
                    <i className="fa-light fa-quote-left text-muted-foreground text-xs mt-0.5" aria-hidden="true" />
                    <span className="flex-1">{review.reviewNotes}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                    <span>— {review.reviewerName}</span>
                    {review.reviewedAt && <span>· {relativeTime(review.reviewedAt)}</span>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No reviewer notes yet.</p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Timeline
              </p>
              <div className="flex flex-col gap-1.5">
                {review?.publishedAt && <TimelineEvent label="Published to students" when={review.publishedAt} icon="fa-bullhorn" />}
                {review?.reviewedAt && state !== 'changes-requested' && <TimelineEvent label="Approved by chair" when={review.reviewedAt} icon="fa-check-circle" />}
                {review?.reviewedAt && state === 'changes-requested' && <TimelineEvent label="Chair requested changes" when={review.reviewedAt} icon="fa-arrows-rotate" />}
                {review?.submittedAt && <TimelineEvent label="Sent for chair review" when={review.submittedAt} icon="fa-paper-plane" />}
                <TimelineEvent label="Draft created" when={null} icon="fa-file-pen" />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ─── State → Tone mapping (single source of truth) ───────────────────────────
const STATE_TONE: Record<AssessmentReviewState | 'draft', Tone> = {
  'draft':              'neutral',
  'pending-chair':      'warning',
  'changes-requested':  'destructive',
  'approved':           'success',
  'published':          'brand',
  'in-progress':        'info',
  'submitted':          'success',
  'results-published':  'neutral',
}

const STATE_LABEL: Record<AssessmentReviewState | 'draft', string> = {
  'draft':              'Draft',
  'pending-chair':      'Pending chair',
  'changes-requested':  'Changes requested',
  'approved':           'Approved',
  'published':          'Published',
  'in-progress':        'Live',
  'submitted':          'Submitted',
  'results-published':  'Results published',
}

const STATE_ICON: Record<AssessmentReviewState | 'draft', string> = {
  'draft':              'fa-file-pen',
  'pending-chair':      'fa-hourglass-half',
  'changes-requested':  'fa-arrows-rotate',
  'approved':           'fa-check-circle',
  'published':          'fa-bullhorn',
  'in-progress':        'fa-play',
  'submitted':          'fa-check-double',
  'results-published':  'fa-eye',
}

const TONE_RAIL: Record<Tone, string> = {
  brand:       'border-l-brand',
  info:        'border-l-chart-1',
  warning:     'border-l-chart-4',
  success:     'border-l-chart-2',
  neutral:     'border-l-border',
  destructive: 'border-l-destructive',
}

const TONE_OPEN_BORDER: Record<Tone, string> = {
  brand:       'border-brand/40',
  info:        'border-chart-1/40',
  warning:     'border-chart-4/40',
  success:     'border-chart-2/40',
  neutral:     'border-border',
  destructive: 'border-destructive/40',
}

// ─── State pill — uses kit StatusPill ────────────────────────────────────────
function StatePill({ state }: { state: AssessmentReviewState | 'draft' }) {
  return (
    <StatusPill
      tone={STATE_TONE[state]}
      icon={STATE_ICON[state]}
      label={STATE_LABEL[state]}
      uppercase
    />
  )
}


// ─── Action buttons by state ─────────────────────────────────────────────────
function ActionsForState({
  state, assessmentId, isViewer,
}: {
  state: AssessmentReviewState | 'draft'; assessmentId: string; isViewer: boolean
}) {
  if (isViewer) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <i className="fa-light fa-eye" aria-hidden="true" />
        View
      </Button>
    )
  }
  switch (state) {
    case 'draft':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}`}>
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
            Open
          </Link>
        </Button>
      )
    case 'pending-chair':
      return (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}/review`}>
            <i className="fa-light fa-eye" aria-hidden="true" />
            View submission
          </Link>
        </Button>
      )
    case 'changes-requested':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}/review`}>
            <i className="fa-light fa-comment" aria-hidden="true" />
            View notes
          </Link>
        </Button>
      )
    case 'approved':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}`}>
            <i className="fa-light fa-bullhorn" aria-hidden="true" />
            Schedule & publish
          </Link>
        </Button>
      )
    case 'published':
      return (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}`}>
            <i className="fa-light fa-gear" aria-hidden="true" />
            Manage window
          </Link>
        </Button>
      )
    case 'in-progress':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}/monitor`}>
            <i className="fa-light fa-eye" aria-hidden="true" />
            Live monitor
          </Link>
        </Button>
      )
    case 'submitted':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}/analytics`}>
            <i className="fa-light fa-chart-mixed" aria-hidden="true" />
            Review & curve
          </Link>
        </Button>
      )
    case 'results-published':
      return (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/assessments/${assessmentId}/analytics`}>
            <i className="fa-light fa-chart-mixed" aria-hidden="true" />
            Analytics
          </Link>
        </Button>
      )
    default:
      return null
  }
}

// ─── Difficulty mini-bar ─────────────────────────────────────────────────────
function DifficultyMiniBar({ dist }: { dist: Record<QDiff, number> }) {
  const total = (dist.Easy ?? 0) + (dist.Medium ?? 0) + (dist.Hard ?? 0)
  if (total === 0) return null
  // `flex: n` for proportional sizing isn't a Tailwind utility — kept inline since it's
  // a numeric ratio computed at render. Color uses utility classes per segment.
  const seg = (n: number, bgClass: string) => (
    <div style={{ flex: n }} className={`h-1.5 ${bgClass}`} aria-hidden="true" />
  )
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help">
          <div className="w-32 flex rounded-full overflow-hidden">
            {seg(dist.Easy ?? 0,   'bg-chart-2')}
            {seg(dist.Medium ?? 0, 'bg-chart-1')}
            {seg(dist.Hard ?? 0,   'bg-chart-4')}
          </div>
          <span className="text-xs text-muted-foreground">
            <span className="text-chart-2">{dist.Easy ?? 0}E</span>
            {' · '}
            <span className="text-chart-1">{dist.Medium ?? 0}M</span>
            {' · '}
            <span className="text-chart-4">{dist.Hard ?? 0}H</span>
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Easy {dist.Easy ?? 0} · Medium {dist.Medium ?? 0} · Hard {dist.Hard ?? 0}
      </TooltipContent>
    </Tooltip>
  )
}

// ─── Timeline event ──────────────────────────────────────────────────────────
function TimelineEvent({ label, when, icon }: { label: string; when: string | null; icon: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <i className={`fa-light ${icon} shrink-0 text-xs`} aria-hidden="true" />
      <span className="text-foreground">{label}</span>
      {when && <span className="ms-auto">{relativeTime(when)}</span>}
    </div>
  )
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const days = Math.round((Date.now() - then) / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return `${Math.round(days / 30)}mo ago`
}
