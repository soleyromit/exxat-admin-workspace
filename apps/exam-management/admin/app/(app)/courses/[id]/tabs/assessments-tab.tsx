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
  Button, Tip,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@exxatdesignux/ui'
import { StatusPill, type Tone } from '@/components/faculty-ui-kit'
import { WorkflowStepIndicator } from '@/components/workflow-step-indicator'
import type { Assessment, QDiff } from '@/lib/qb-types'
import type { AssessmentReview, AssessmentReviewState } from '@/lib/faculty-mock-data'

interface AssessmentsTabProps {
  assessments: Array<Assessment | { id: string; courseId: string; offeringId: string; title: string; questionCount: number; durationMinutes: number; diffDistribution?: Record<QDiff, number> }>
  reviewByAssessment: Map<string, AssessmentReview>
  isViewer: boolean
  courseId: string
  onNewAssessment?: () => void
}

// Group by COMPLETION status, not workflow. Per Aarti's May 7 directive:
// "I don't want assessment workflow to be the primary concern... completion
// is a bigger category. So or primary concern. So five have been completed.
// Two are still to be scheduled."
//
// Workflow approval still surfaces — but per-card, not as the org axis.
type CompletionBucket = 'ongoing' | 'scheduled' | 'not-yet-scheduled' | 'completed'

const COMPLETION_BUCKETS: {
  key: CompletionBucket
  title: string
  sub: string
  states: (AssessmentReviewState | 'draft')[]
  defaultOpen: boolean
}[] = [
  {
    key: 'ongoing',
    title: 'Ongoing',
    sub: 'Students are taking these now',
    states: ['in-progress'],
    defaultOpen: true,
  },
  {
    key: 'scheduled',
    title: 'Scheduled',
    sub: 'Window is open or about to open',
    states: ['published'],
    defaultOpen: true,
  },
  {
    key: 'not-yet-scheduled',
    title: 'Not yet scheduled',
    sub: 'Drafts and approvals — not assigned to students yet',
    states: ['draft', 'pending-chair', 'changes-requested', 'approved'],
    defaultOpen: true,
  },
  {
    key: 'completed',
    title: 'Completed',
    sub: 'Closed assessments — secondary concern',
    states: ['submitted', 'results-published'],
    defaultOpen: false,
  },
]

export function AssessmentsTab({ assessments, reviewByAssessment, isViewer, courseId, onNewAssessment }: AssessmentsTabProps) {
  function openCanvas() {
    onNewAssessment?.()
  }
  const [completedOpen, setCompletedOpen] = useState(false)
  const [filterBucket, setFilterBucket] = useState<CompletionBucket | null>(null)

  // Group by completion bucket (each bucket consolidates 1+ workflow states).
  const grouped = new Map<CompletionBucket, AssessmentsTabProps['assessments']>()
  for (const a of assessments) {
    const state = reviewByAssessment.get(a.id)?.state ?? 'draft'
    const bucket = COMPLETION_BUCKETS.find(b => b.states.includes(state))
    if (!bucket) continue
    const arr = grouped.get(bucket.key) ?? []
    arr.push(a)
    grouped.set(bucket.key, arr)
  }

  // Workflow approval rollup — secondary widget per Aarti (not the org axis).
  const workflowCounts = {
    pendingReview: assessments.filter(a => reviewByAssessment.get(a.id)?.state === 'pending-chair').length,
    changesRequested: assessments.filter(a => reviewByAssessment.get(a.id)?.state === 'changes-requested').length,
    approved: assessments.filter(a => reviewByAssessment.get(a.id)?.state === 'approved').length,
  }
  const totalWorkflowSignals = workflowCounts.pendingReview + workflowCounts.changesRequested + workflowCounts.approved

  // Buckets visible: respect filter when set, else show all non-empty.
  const visibleGroups = COMPLETION_BUCKETS
    .filter(g => (grouped.get(g.key) ?? []).length > 0)
    .filter(g => !filterBucket || g.key === filterBucket)

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
          <Button
            size="default"
            className="mt-4 gap-2"
            onClick={openCanvas}
          >
            <i className="fa-light fa-plus" aria-hidden="true" />
            Create assessment
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar — completion rollup with filterable counts (primary) +
          approval workflow widget (secondary). Per Aarti's May 7 directive:
          "seven assessments, five completed, two scheduled."  Click a count
          to filter the list to that bucket. */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              <span className="tabular-nums">{assessments.length}</span>{' '}
              {assessments.length === 1 ? 'assessment' : 'assessments'}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {COMPLETION_BUCKETS.map((b, i) => {
                const count = grouped.get(b.key)?.length ?? 0
                if (count === 0) return null
                const isActive = filterBucket === b.key
                return (
                  <span key={b.key} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground/60 text-xs">·</span>}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterBucket(isActive ? null : b.key)}
                      aria-pressed={isActive}
                      className={`h-6 px-2 text-xs gap-1.5 font-normal hover:bg-muted ${
                        isActive ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="tabular-nums font-semibold">{count}</span>
                      {b.title.toLowerCase()}
                    </Button>
                  </span>
                )
              })}
              {filterBucket && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterBucket(null)}
                  className="h-6 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear filter"
                >
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                  clear
                </Button>
              )}
            </div>
          </div>
          {!isViewer && (
            <Button size="sm" className="gap-2 shrink-0" onClick={openCanvas}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Create assessment
            </Button>
          )}
        </div>

        {/* Approval workflow widget — secondary per Aarti.
            "It needs to be a lower priority thing... a workflow widget that
            will say five pending review, two reviewed, whatever." */}
        {totalWorkflowSignals > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">
              Approval workflow
            </span>
            <span className="text-xs text-muted-foreground">
              {[
                workflowCounts.pendingReview > 0 && `${workflowCounts.pendingReview} pending review`,
                workflowCounts.changesRequested > 0 && `${workflowCounts.changesRequested} changes requested`,
                workflowCounts.approved > 0 && `${workflowCounts.approved} approved · ready to schedule`,
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}
      </div>

      {visibleGroups.map(g => {
        const items = grouped.get(g.key)!
        // Completed bucket is collapsible — Aarti: "complete is your secondary concern."
        const isCollapsible = g.key === 'completed'
        const isOpen = isCollapsible ? completedOpen : true
        return (
        <section key={g.key}>
          {/* Group header — collapsible variant uses role/tabIndex/keyboard
              + focus-visible so the clickable region is screen-reader and
              keyboard accessible (was a raw <div onClick> with no a11y). */}
          <div
            className={`flex items-baseline gap-2 mb-3 rounded ${
              isCollapsible
                ? 'cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 -mx-1 px-1'
                : ''
            }`}
            onClick={isCollapsible ? () => setCompletedOpen(o => !o) : undefined}
            role={isCollapsible ? 'button' : undefined}
            tabIndex={isCollapsible ? 0 : undefined}
            aria-expanded={isCollapsible ? isOpen : undefined}
            onKeyDown={isCollapsible ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setCompletedOpen(o => !o)
              }
            } : undefined}
          >
            {isCollapsible && (
              <i
                className={`fa-light ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'} text-xs text-muted-foreground`}
                aria-hidden="true"
              />
            )}
            <h2 className="font-heading text-base font-semibold text-foreground">
              {g.title}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              · {items.length}
            </span>
            <p className="text-sm text-muted-foreground">{g.sub}</p>
          </div>
          {isOpen && (
            <div className="flex flex-col gap-2">
              {items.map(a => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  review={reviewByAssessment.get(a.id) ?? null}
                  isViewer={isViewer}
                />
              ))}
            </div>
          )}
        </section>
        )
      })}
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
                <span
                  className="flex items-center gap-1"
                  style={{ color: 'color-mix(in oklch, var(--chart-4) 55%, var(--foreground))' }}
                >
                  <i className="fa-light fa-paper-plane text-[10px]" aria-hidden="true" />
                  Sent for review {relativeTime(review.submittedAt)}
                </span>
              )}
            </div>

            {/* Workflow step indicator — visualizes the chair-approval lifecycle */}
            <div className="mt-3 max-w-md">
              <WorkflowStepIndicator state={state} compact />
            </div>

            {/* Latest timeline event — Aarti: "every expansion, you will see the
                latest time, like the timeline, and what's the note, the last note
                given for that assessment." Shown inline without expanding. */}
            <LatestTimelineEvent review={review} state={state} />

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

// ─── Latest timeline event — inline, no expand required ─────────────────────
//
// Priority order per Aarti's directive:
//  1. changes-requested + reviewNotes → "Changes requested"
//  2. approved + reviewedAt           → "Approved"
//  3. submittedAt                     → "Sent for review"
//  4. Otherwise nothing
function LatestTimelineEvent({
  review,
  state,
}: {
  review: AssessmentReview | null
  state: AssessmentReviewState | 'draft'
}) {
  if (!review) return null

  let icon: string
  let label: string
  let when: string | undefined

  if (state === 'changes-requested' && review.reviewNotes) {
    icon = 'fa-arrows-rotate'
    label = 'Changes requested'
    when = review.reviewedAt ?? undefined
  } else if (state === 'approved' && review.reviewedAt) {
    icon = 'fa-circle-check'
    label = 'Approved'
    when = review.reviewedAt
  } else if (review.submittedAt) {
    icon = 'fa-paper-plane'
    label = 'Sent for review'
    when = review.submittedAt
  } else {
    return null
  }

  return (
    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1.5">
      <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 10 }} />
      <span>{label}</span>
      {when && <span>· {relativeTime(when)}</span>}
    </div>
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
  'in-progress':        'Ongoing',
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
  destructive: 'border-chart-5/40',
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
          <Link href={`/assessment-builder?id=${assessmentId}`}>
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
            Open
          </Link>
        </Button>
      )
    case 'pending-chair':
      return (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/assessment-builder?id=${assessmentId}&view=review`}>
            <i className="fa-light fa-eye" aria-hidden="true" />
            View submission
          </Link>
        </Button>
      )
    case 'changes-requested':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessment-builder?id=${assessmentId}&view=review`}>
            <i className="fa-light fa-comment" aria-hidden="true" />
            View notes
          </Link>
        </Button>
      )
    case 'approved':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessment-builder?id=${assessmentId}`}>
            <i className="fa-light fa-bullhorn" aria-hidden="true" />
            Schedule & publish
          </Link>
        </Button>
      )
    case 'published':
      return (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/assessment-builder?id=${assessmentId}`}>
            <i className="fa-light fa-gear" aria-hidden="true" />
            Manage window
          </Link>
        </Button>
      )
    case 'in-progress':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessment-builder?id=${assessmentId}&view=monitor`}>
            <i className="fa-light fa-eye" aria-hidden="true" />
            Live monitor
          </Link>
        </Button>
      )
    case 'submitted':
      return (
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/assessment-builder?id=${assessmentId}&view=analytics`}>
            <i className="fa-light fa-chart-mixed" aria-hidden="true" />
            Review & curve
          </Link>
        </Button>
      )
    case 'results-published':
      return (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/assessment-builder?id=${assessmentId}&view=analytics`}>
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
    <Tip label={`Easy ${dist.Easy ?? 0} · Medium ${dist.Medium ?? 0} · Hard ${dist.Hard ?? 0}`}>
      <div className="flex items-center gap-1.5 cursor-help">
        <div className="w-32 flex rounded-full overflow-hidden">
          {seg(dist.Easy ?? 0,   'bg-chart-2')}
          {seg(dist.Medium ?? 0, 'bg-chart-1')}
          {seg(dist.Hard ?? 0,   'bg-chart-4')}
        </div>
        <span className="text-xs text-muted-foreground">
          <span style={{ color: 'color-mix(in oklch, var(--chart-2) 50%, var(--foreground))' }}>{dist.Easy ?? 0}E</span>
          {' · '}
          <span style={{ color: 'color-mix(in oklch, var(--chart-1) 50%, var(--foreground))' }}>{dist.Medium ?? 0}M</span>
          {' · '}
          <span style={{ color: 'color-mix(in oklch, var(--chart-4) 55%, var(--foreground))' }}>{dist.Hard ?? 0}H</span>
        </span>
      </div>
    </Tip>
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
