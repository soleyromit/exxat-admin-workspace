'use client'

/**
 * ASSESSMENT LANDING — overview page for a single assessment.
 *
 * Surface that the rest of the app routes into when "open assessment" is
 * clicked — Action Items destinations, Assessments tab row clicks, etc.
 *
 * Layout:
 *   1. Workflow step indicator (8-state lifecycle)
 *   2. State-aware "next action" callout — the single most useful action for
 *      the current state, prominently featured
 *   3. Metadata grid (questions, duration, reviewer, key dates)
 *   4. Inline reviewer notes (if present)
 *   5. Quick links to /review, /monitor, /analytics
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button, Badge,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Avatar, AvatarFallback,
  Textarea,
  Checkbox,
  Label,
  FieldError,
  LocalBanner,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { WorkflowStepIndicator } from '@/components/workflow-step-indicator'
import { StatusPill, type Tone } from '@/components/faculty-ui-kit'
import { mockAssessments, mockCourses } from '@/lib/qb-mock-data'
import {
  facultyExtraAssessments,
  type AssessmentReviewState,
} from '@/lib/faculty-mock-data'
import { useAssessmentReviews } from '@/lib/assessment-review-store'

// Mock reviewer roster — would come from institution faculty roles in prod
const REVIEWER_ROSTER = [
  { id: 'r1', name: 'Dr. Anita Rao',     title: 'Department Chair',          initials: 'AR', isChair: true  },
  { id: 'r2', name: 'Dr. Marcus Lee',    title: 'Associate Chair',           initials: 'ML', isChair: true  },
  { id: 'r3', name: 'Dr. Priya Nair',    title: 'Curriculum Committee',      initials: 'PN', isChair: false },
  { id: 'r4', name: 'Dr. Eric Hoffman',  title: 'Assessment Lead',           initials: 'EH', isChair: false },
] as const

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

// ─── State → callout copy + tone ────────────────────────────────────────────
const STATE_META: Record<
  AssessmentReviewState | 'draft',
  { tone: Tone; icon: string; label: string; copy: string; primary: { label: string; href?: string; intent?: 'edit' | 'submit' | 'publish' | 'wait' } }
> = {
  'draft': {
    tone: 'neutral', icon: 'fa-file-pen', label: 'Draft',
    copy: 'Continue editing, then send to your chair for review.',
    primary: { label: 'Open in builder', href: '/assessment-builder', intent: 'edit' },
  },
  'pending-chair': {
    tone: 'info', icon: 'fa-hourglass-half', label: 'Pending chair review',
    copy: 'Awaiting your chair’s response. No action needed yet.',
    primary: { label: 'View submission', intent: 'wait' },
  },
  'changes-requested': {
    tone: 'warning', icon: 'fa-arrows-rotate', label: 'Changes requested',
    copy: 'Chair has returned this with notes — address feedback and resubmit.',
    primary: { label: 'Open chair review', intent: 'edit' },
  },
  'approved': {
    tone: 'success', icon: 'fa-circle-check', label: 'Approved',
    copy: 'Chair-approved. Schedule the window and publish to students.',
    primary: { label: 'Schedule & publish', intent: 'publish' },
  },
  'published': {
    tone: 'info', icon: 'fa-bullhorn', label: 'Published',
    copy: 'Window is open. Students can start when their slot opens.',
    primary: { label: 'Manage window', intent: 'wait' },
  },
  'in-progress': {
    tone: 'info', icon: 'fa-circle', label: 'Ongoing',
    copy: 'Students are taking this exam now — open the monitor to track progress.',
    primary: { label: 'Open monitor', intent: 'wait' },
  },
  'submitted': {
    tone: 'success', icon: 'fa-check-double', label: 'Awaiting results',
    copy: 'All students have submitted. Run psychometrics and curve before publishing.',
    primary: { label: 'Review & curve', intent: 'wait' },
  },
  'results-published': {
    tone: 'success', icon: 'fa-eye', label: 'Results published',
    copy: 'Results are visible to students. Open analytics for the full breakdown.',
    primary: { label: 'View analytics', intent: 'wait' },
  },
}

export default function AssessmentLandingClient({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const { getReview, transition } = useAssessmentReviews()
  const [sendOpen, setSendOpen] = useState(false)
  const assessment = ALL_ASSESSMENTS.find(a => a.id === assessmentId)
  const course = assessment ? mockCourses.find(c => c.id === assessment.courseId) : null
  const review = getReview(assessmentId)
  const state: AssessmentReviewState | 'draft' = review?.state ?? 'draft'

  if (!assessment || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="font-semibold text-foreground">Assessment not found</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => router.push('/courses')}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          Back to courses
        </Button>
      </div>
    )
  }

  const meta = STATE_META[state]

  // Compute the actual destination for the primary action based on state
  const primaryHref =
    state === 'in-progress'         ? `/assessments/${assessmentId}/monitor`   :
    state === 'submitted'           ? `/assessments/${assessmentId}/analytics` :
    state === 'results-published'   ? `/assessments/${assessmentId}/analytics` :
    state === 'pending-chair'       ? `/assessments/${assessmentId}/review`    :
    state === 'changes-requested'   ? `/assessments/${assessmentId}/review`    :
    meta.primary.href ?? null

  const breadcrumbs = [
    { label: 'Courses', href: '/courses' },
    { label: course.name, href: `/courses/${course.id}` },
    { label: assessment.title },
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <StatusPill tone={meta.tone} icon={meta.icon} label={meta.label} uppercase />

      {/* Send-to-chair — only on draft state. The pre-publication review
          workflow is Aarti's named differentiator over ExamSoft. */}
      {state === 'draft' && (
        <Button size="sm" variant="default" className="gap-1.5" onClick={() => setSendOpen(true)}>
          <i className="fa-light fa-paper-plane" aria-hidden="true" />
          Send to chair
        </Button>
      )}

      {/* Resubmit on changes-requested */}
      {state === 'changes-requested' && (
        <Button size="sm" variant="default" className="gap-1.5" onClick={() => setSendOpen(true)}>
          <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
          Resubmit to chair
        </Button>
      )}

      {primaryHref ? (
        <Button asChild size="sm" variant={state === 'draft' || state === 'changes-requested' ? 'outline' : 'default'} className="gap-1.5">
          <Link href={primaryHref}>
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
            {meta.primary.label}
          </Link>
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled className="gap-1.5">
          <i className={`fa-light ${meta.icon}`} aria-hidden="true" />
          {meta.primary.label}
        </Button>
      )}
    </div>
  )

  return (
    <>
      <SiteHeader title={assessment.title} breadcrumbs={breadcrumbs} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-auto">
        <PageHeader
          title={assessment.title}
          subtitle={`${course.name} · ${assessment.questionCount} questions · ${assessment.durationMinutes}-min window`}
          actions={headerActions}
        />

        <div className="p-6 flex flex-col gap-5">
          {/* ─── Workflow step indicator ───────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base font-semibold">Lifecycle</CardTitle>
              <CardDescription className="text-xs">
                Where this assessment is in the pre-publication chair approval workflow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowStepIndicator state={state} />
            </CardContent>
          </Card>

          {/* ─── State callout ──────────────────────────────────────────── */}
          <Card
            className={`border-l-3 ${
              meta.tone === 'warning' ? 'border-l-chart-4' :
              meta.tone === 'success' ? 'border-l-chart-2' :
              meta.tone === 'info'    ? 'border-l-chart-1' :
                                        'border-l-border'
            }`}
          >
            <CardContent>
              <div className="flex items-start gap-3">
                <i className={`fa-light ${meta.icon} text-base mt-0.5 shrink-0 ${
                  meta.tone === 'warning' ? 'text-chart-4' :
                  meta.tone === 'success' ? 'text-chart-2' :
                  meta.tone === 'info'    ? 'text-chart-1' :
                                            'text-muted-foreground'
                }`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meta.copy}
                  </p>
                </div>
                {primaryHref && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                    <Link href={primaryHref}>
                      {meta.primary.label}
                      <i className="fa-light fa-arrow-right" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Metadata grid ───────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl
                className="grid gap-x-6 gap-y-3"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))' }}
              >
                <MetaCell label="Questions" value={`${assessment.questionCount}`} />
                <MetaCell label="Duration"  value={`${assessment.durationMinutes} min`} />
                <MetaCell label="Course"    value={course.name} />
                <MetaCell label="Reviewer"  value={review?.reviewerName ?? 'Not yet submitted'} />
                <MetaCell
                  label="Submitted"
                  value={review?.submittedAt ? formatDateShort(review.submittedAt) : '—'}
                />
                <MetaCell
                  label="Reviewed"
                  value={review?.reviewedAt ? formatDateShort(review.reviewedAt) : '—'}
                />
                <MetaCell
                  label="Published"
                  value={review?.publishedAt ? formatDateShort(review.publishedAt) : '—'}
                />
                {(review?.enrolledCount ?? 0) > 0 && (
                  <MetaCell
                    label="Enrolled"
                    value={`${review!.enrolledCount}`}
                  />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* ─── Reviewer notes ──────────────────────────────────────────── */}
          {review?.reviewNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                  <i className="fa-light fa-comment-lines text-muted-foreground" aria-hidden="true" />
                  Reviewer notes
                </CardTitle>
                <Badge variant="secondary" className="rounded text-[10px] justify-self-end col-start-2 row-start-1">
                  {review.reviewerName}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">
                  {review.reviewNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ─── Quick links ─────────────────────────────────────────────── */}
          <section className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <QuickLink
              icon="fa-clipboard-check"
              label="Chair review"
              sub="Approval workflow"
              href={`/assessments/${assessmentId}/review`}
            />
            <QuickLink
              icon="fa-circle"
              label="Live monitor"
              sub="During-exam tracking"
              href={`/assessments/${assessmentId}/monitor`}
              disabled={!['published', 'in-progress'].includes(state)}
            />
            <QuickLink
              icon="fa-chart-mixed"
              label="Analytics"
              sub="Psychometrics & curve"
              href={`/assessments/${assessmentId}/analytics`}
              disabled={!['submitted', 'results-published'].includes(state)}
            />
          </section>
        </div>
      </div>

      <SendToChairDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        assessmentTitle={assessment.title}
        isResubmit={state === 'changes-requested'}
        previousNote={review?.reviewNotes ?? undefined}
        onSubmit={(reviewerNames, note) => {
          transition(assessmentId, 'pending-chair', {
            reviewerName: reviewerNames.join(', '),
            notes: note,
          })
          setSendOpen(false)
        }}
      />
    </>
  )
}

// ─── Send-to-chair dialog ────────────────────────────────────────────────────

function SendToChairDialog({
  open, onOpenChange, assessmentTitle, isResubmit, previousNote, onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  assessmentTitle: string
  isResubmit: boolean
  previousNote?: string
  onSubmit: (reviewerNames: string[], note: string) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set([REVIEWER_ROSTER[0].id]))
  const [note, setNote] = useState('')
  const [reviewerError, setReviewerError] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      // Clear the "pick at least one" error as soon as the user makes a
      // selection (matches the on-change clearing pattern used by the
      // exam-mgmt dialogs migrated in a4fc60a).
      if (next.size > 0 && reviewerError) setReviewerError(null)
      return next
    })
  }

  const reviewerNames = REVIEWER_ROSTER
    .filter(r => selected.has(r.id))
    .map(r => r.name)

  const handleSubmit = () => {
    if (reviewerNames.length === 0) {
      setReviewerError('Pick at least one reviewer.')
      return
    }
    setReviewerError(null)
    onSubmit(reviewerNames, note)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isResubmit ? 'Resubmit to chair' : 'Send for chair review'}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{assessmentTitle}</span>
            {' '}will be locked from edits while reviewers respond. You&apos;ll be notified on every state change.
          </DialogDescription>
        </DialogHeader>

        {isResubmit && previousNote && (
          <LocalBanner variant="warning" title="Previous reviewer note">
            <span className="italic">&ldquo;{previousNote}&rdquo;</span>
          </LocalBanner>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-sm font-medium" id="reviewers-label">Reviewers *</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Select one or more — chair approval is required, but you can include a co-reviewer.
            </p>
          </div>

          {/* role=group makes the reviewer list one accessible widget; the
              FieldError below is announced via aria-errormessage. Per the
              forms-input.md depth audit, every required validation must
              expose aria-invalid + a visible error surface. */}
          <div
            className="flex flex-col gap-1.5 rounded-lg border border-border p-1"
            role="group"
            aria-labelledby="reviewers-label"
            aria-invalid={!!reviewerError}
            aria-errormessage={reviewerError ? 'reviewers-error' : undefined}
            style={reviewerError ? { borderColor: 'var(--destructive)' } : undefined}
          >
            {REVIEWER_ROSTER.map(r => {
              const isSelected = selected.has(r.id)
              return (
                <Button
                  key={r.id}
                  variant="ghost"
                  onClick={() => toggle(r.id)}
                  aria-pressed={isSelected}
                  className="flex items-center justify-start gap-3 h-auto w-full rounded-md px-2 py-2 text-start whitespace-normal"
                  style={isSelected ? { backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
                >
                  <Checkbox checked={isSelected} aria-hidden="true" tabIndex={-1} className="pointer-events-none" />
                  <Avatar className="size-8 shrink-0">
                    {/* List avatars use a pure-neutral grey color-mix.
                        Both `--foreground` and `--background` are zero-chroma,
                        so the mix can't pick up brand hue under any theme.
                        Same construction the DS uses for `--overlay`. */}
                    <AvatarFallback
                      className="text-[10px] font-bold"
                      style={{
                        background: 'color-mix(in oklch, var(--foreground) 8%, var(--background))',
                        color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))',
                      }}
                    >
                      {r.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{r.name}</span>
                      {r.isChair && (
                        <Badge
                          variant="secondary"
                          className="rounded font-mono text-[9px] uppercase tracking-wider"
                          style={{
                            backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
                            color: 'var(--brand-color-dark)',
                          }}
                        >
                          Chair
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{r.title}</p>
                  </div>
                </Button>
              )
            })}
          </div>
          {reviewerError && (
            <FieldError id="reviewers-error">{reviewerError}</FieldError>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chair-note" className="text-sm font-medium">
              Note for reviewers <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="chair-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder={isResubmit ? 'Summarize what you changed in response to the prior review…' : 'Anything reviewers should know — rigor, item-source, deadline…'}
              rows={3}
              className="resize-none"
            />
            <span className="text-[10px] text-muted-foreground self-end tabular-nums">
              {note.length}/500
            </span>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          {/* Submit no longer silently-disabled when zero reviewers —
              clicking surfaces FieldError + aria-invalid on the group
              (was: button greyed out with no SR feedback). */}
          <Button onClick={handleSubmit} className="gap-2">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            {reviewerNames.length === 0
              ? (isResubmit ? 'Resubmit' : 'Send to chair')
              : `${isResubmit ? 'Resubmit' : 'Send'} to ${reviewerNames.length === 1 ? reviewerNames[0].split(' ').slice(-1)[0] : `${reviewerNames.length} reviewers`}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground truncate">{value}</dd>
    </div>
  )
}

function QuickLink({
  icon, label, sub, href, disabled,
}: {
  icon: string; label: string; sub: string; href: string; disabled?: boolean
}) {
  // Card slot composition replaces hand-rolled rounded/border/p-4 chrome.
  // Per card.md depth audit: QuickLink is a Card-shaped tile; the enabled
  // branch wraps the Card in <Link> so hover/focus remain on the link (DS
  // EntityCard pattern from apps/pce/admin/app/(app)/admin/page.tsx).
  if (disabled) {
    // Disabled QuickLink uses bg-muted (background dim) instead of
    // opacity-60 on the whole Card — opacity-60 over text-muted-foreground
    // drops CardDescription contrast to ~2.3:1 (WCAG 1.4.3 fail). The
    // body text "Available after publish" is informative content, not
    // incidental — must stay legible. Same NURS-bug-class avoidance the
    // vendored data-table flagged at data-table/index.tsx:1041.
    return (
      <Card size="sm" className="bg-muted/40 cursor-not-allowed" aria-disabled="true">
        <CardHeader>
          <div className="flex items-start gap-3">
            <i className={`fa-light ${icon} text-muted-foreground text-base mt-0.5`} aria-hidden="true" />
            <div className="min-w-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <CardDescription className="text-xs">Available after publish</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }
  return (
    <Link
      href={href}
      className="block transition-all hover:-translate-y-0.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 rounded-xl"
    >
      <Card size="sm" className="transition-colors group-hover:bg-muted/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <i className={`fa-light ${icon} text-foreground text-base mt-0.5 group-hover:text-brand transition-colors`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium text-foreground">{label}</CardTitle>
              <CardDescription className="text-xs">{sub}</CardDescription>
            </div>
            <i
              className="fa-light fa-arrow-right text-muted-foreground/60 group-hover:text-brand transition-colors mt-1"
              aria-hidden="true"
              style={{ fontSize: 11 }}
            />
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
