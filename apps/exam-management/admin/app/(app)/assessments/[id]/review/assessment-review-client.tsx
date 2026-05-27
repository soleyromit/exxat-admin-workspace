'use client'

/**
 * CHAIR REVIEW — Aarti's pre-publication chair approval workflow.
 *
 * "Pre-publication chair approval is not available in ExamSoft and is a
 *  high-value feature for academic programs."
 *
 * Two viewing modes (decided by current persona):
 *   - Reviewer (chair / faculty senior / admin) → can Approve or Request changes
 *   - Author (faculty junior / mid who submitted) → reads notes, addresses & resubmits
 *
 * Layout:
 *   1. Workflow indicator
 *   2. Submission summary (author, submitted date, current state)
 *   3. Question preview list — read-only summary rows (one row per question)
 *   4. Notes panel — chair notes (existing or new) + action buttons
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Avatar, AvatarFallback,
  Button, Badge,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Textarea,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { WorkflowStepIndicator } from '@/components/workflow-step-indicator'
import { StatusPill, type Tone } from '@/components/faculty-ui-kit'
import { useFacultySession } from '@/lib/faculty-session'
import { mockAssessments, mockCourses, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import {
  facultyExtraAssessments,
  type AssessmentReviewState,
} from '@/lib/faculty-mock-data'
import { useAssessmentReviews } from '@/lib/assessment-review-store'

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

const STATE_TONE: Record<AssessmentReviewState | 'draft', Tone> = {
  'draft':              'neutral',
  'pending-chair':      'info',
  'changes-requested':  'warning',
  'approved':           'success',
  'published':          'info',
  'in-progress':        'info',
  'submitted':          'success',
  'results-published':  'success',
}
const STATE_LABEL: Record<AssessmentReviewState | 'draft', string> = {
  'draft':              'Draft',
  'pending-chair':      'Pending chair review',
  'changes-requested':  'Changes requested',
  'approved':           'Approved',
  'published':          'Published',
  'in-progress':        'Ongoing',
  'submitted':          'Submitted',
  'results-published':  'Results published',
}

export default function AssessmentReviewClient({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const { currentPersona } = useFacultySession()
  const { getReview, transition } = useAssessmentReviews()

  const assessment = ALL_ASSESSMENTS.find(a => a.id === assessmentId)
  const course = assessment ? mockCourses.find(c => c.id === assessment.courseId) : null
  const review = getReview(assessmentId)
  const state: AssessmentReviewState | 'draft' = review?.state ?? 'draft'

  // Mock the question selection — first N questions from the matching course's QB folder
  const questions = useMemo(() => {
    if (!assessment) return []
    const folderPrefix = assessment.courseId.replace('course-', '')
    return MOCK_QB_QUESTIONS
      .filter(q => q.folder.startsWith(folderPrefix))
      .slice(0, assessment.questionCount > 8 ? 8 : assessment.questionCount)
  }, [assessment])

  // Persona-aware mode: senior trust acts as reviewer; others as author
  const isReviewer = currentPersona.trustLevel === 'senior' || currentPersona.role === 'admin'

  // Note draft for the chair's textarea — persists between transitions
  const [noteDraft, setNoteDraft] = useState('')
  const effectiveState = state

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

  const breadcrumbs = [
    { label: 'Courses', href: '/courses' },
    { label: course.name, href: `/courses/${course.id}` },
    { label: assessment.title, href: `/assessments/${assessmentId}` },
    { label: 'Chair review' },
  ]

  const reviewerName = `${currentPersona.title} ${currentPersona.name}`
  const handleApprove = () => transition(assessmentId, 'approved', {
    reviewerName,
    notes: noteDraft.trim() || review?.reviewNotes || 'Approved.',
  })
  const handleRequestChanges = () => transition(assessmentId, 'changes-requested', {
    reviewerName,
    notes: noteDraft.trim(),
  })
  const handleResubmit = () => transition(assessmentId, 'pending-chair')

  return (
    <>
      <SiteHeader title={`${assessment.title} — Chair review`} breadcrumbs={breadcrumbs} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-auto">
        <PageHeader
          title="Chair review"
          subtitle={`${assessment.title} · ${course.name} · ${assessment.questionCount} questions · ${assessment.durationMinutes}-min window`}
          actions={
            <div className="flex items-center gap-2">
              <StatusPill
                tone={STATE_TONE[effectiveState]}
                icon={
                  effectiveState === 'changes-requested' ? 'fa-arrows-rotate' :
                  effectiveState === 'approved'          ? 'fa-circle-check' :
                  effectiveState === 'pending-chair'     ? 'fa-hourglass-half' :
                                                           'fa-circle'
                }
                label={STATE_LABEL[effectiveState]}
                uppercase
              />
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/assessments/${assessmentId}`}>
                  <i className="fa-light fa-arrow-left" aria-hidden="true" />
                  Back to assessment
                </Link>
              </Button>
            </div>
          }
        />

        <div className="p-6 flex flex-col gap-5">
          {/* ─── Workflow ─────────────────────────────────────────────── */}
          <Card>
            <CardContent>
              <WorkflowStepIndicator state={effectiveState} />
            </CardContent>
          </Card>

          {/* ─── Submission summary ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base font-semibold">Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <dl
                className="grid gap-x-6 gap-y-3"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
              >
                <MetaCell label="Submitted by"  value={review?.reviewerName ? 'Faculty author' : 'Not yet submitted'} />
                <MetaCell label="Reviewer"      value={review?.reviewerName ?? '—'} />
                <MetaCell label="Submitted"     value={review?.submittedAt ? formatDateShort(review.submittedAt) : '—'} />
                <MetaCell label="Last reviewed" value={review?.reviewedAt  ? formatDateShort(review.reviewedAt)  : 'Not yet reviewed'} />
              </dl>
            </CardContent>
          </Card>

          {/* ─── Two-column: questions preview + notes ─────────────────── */}
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            {/* Questions preview */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base font-semibold">
                  Questions ({assessment.questionCount})
                </CardTitle>
                <CardDescription className="text-xs">
                  Read-only preview — open the builder to edit.
                </CardDescription>
                <Button asChild variant="outline" size="sm" className="gap-1.5 col-start-2 row-start-1 self-start justify-self-end">
                  <Link href="/assessment-builder">
                    <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
                    Open in builder
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <ol className="flex flex-col gap-2">
                  {questions.map((q, idx) => (
                    <QuestionRow key={q.id} index={idx + 1} question={q} />
                  ))}
                  {assessment.questionCount > questions.length && (
                    <li className="text-xs text-muted-foreground text-center mt-2">
                      +{assessment.questionCount - questions.length} more questions in the builder
                    </li>
                  )}
                </ol>
              </CardContent>
            </Card>

            {/* Notes panel */}
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                  <i className="fa-light fa-comment-lines text-muted-foreground" aria-hidden="true" />
                  {isReviewer ? 'Your notes' : 'Chair feedback'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
              {/* Existing chair notes (if any) — styled as a quoted attribution block
                  inside the Notes Card. Legitimate non-Card div: this is a content
                  sub-element (avatar + name + body) of the parent Card, not its own
                  card-shaped panel. Uses bg-muted + left-accent (no border-border)
                  so visual chrome stays subordinate to the parent Card. */}
              {review?.reviewNotes && (
                <blockquote className="rounded-md bg-muted/40 px-3 pt-2 pb-2.5 flex flex-col gap-2 border-l-2 border-l-brand/40">
                  <div className="flex items-center gap-2">
                    <Avatar style={{ width: 22, height: 22 }}>
                      <AvatarFallback
                        className="text-[9px] font-bold"
                        style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                      >
                        {(review.reviewerName ?? 'CH').split(' ').map(s => s[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">
                      {review.reviewerName}
                    </span>
                    {review.reviewedAt && (
                      <span className="text-[11px] text-muted-foreground ms-auto">
                        {formatDateShort(review.reviewedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {review.reviewNotes}
                  </p>
                </blockquote>
              )}

              {/* Reviewer note input + actions —
                  shown on pending-chair (first review) and on changes-requested
                  (chair revisits and can re-approve directly without resubmit). */}
              {isReviewer && (effectiveState === 'pending-chair' || effectiveState === 'changes-requested') && (
                <>
                  <Textarea
                    placeholder="Add review notes (required to request changes)…"
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value)}
                    className="min-h-24"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-1.5 flex-1" onClick={handleApprove}>
                      <i className="fa-light fa-circle-check" aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-1"
                      disabled={!noteDraft.trim()}
                      onClick={handleRequestChanges}
                    >
                      <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
                      Request changes
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Approving sends this assessment to the publish queue. Requesting changes returns it to the author with your notes.
                  </p>
                </>
              )}

              {/* Author actions when chair has requested changes */}
              {!isReviewer && effectiveState === 'changes-requested' && (
                <>
                  <Button size="sm" className="gap-1.5" onClick={handleResubmit}>
                    <i className="fa-light fa-paper-plane" aria-hidden="true" />
                    Address & resubmit
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href="/assessment-builder">
                      <i className="fa-light fa-pen" aria-hidden="true" />
                      Edit in builder
                    </Link>
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Address each item in the chair’s notes, then resubmit. The chair will be notified.
                  </p>
                </>
              )}

              {/* Approved — author sees publish action */}
              {effectiveState === 'approved' && (
                <>
                  <Button size="sm" disabled className="gap-1.5">
                    <i className="fa-light fa-bullhorn" aria-hidden="true" />
                    Schedule & publish
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Chair-approved. Set the exam window when you’re ready.
                  </p>
                </>
              )}

              {/* Pending and not-reviewer — show wait copy */}
              {!isReviewer && effectiveState === 'pending-chair' && (
                <p className="text-[11px] text-muted-foreground">
                  Awaiting chair review. The chair typically responds within 3–4 business days.
                </p>
              )}
            </CardContent></Card>
          </div>
        </div>
      </div>
    </>
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

function QuestionRow({
  index, question,
}: {
  index: number; question: typeof MOCK_QB_QUESTIONS[number]
}) {
  return (
    <li className="rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors p-3 flex items-start gap-3">
      <span className="size-6 rounded-md bg-muted text-muted-foreground text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
        {String(index).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug line-clamp-2">{question.title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant="secondary" className="rounded text-[10px] font-mono">
            {question.code}
          </Badge>
          <Badge variant="secondary" className="rounded text-[10px]">
            {question.type}
          </Badge>
          <Badge variant="secondary" className="rounded text-[10px]">
            {question.difficulty}
          </Badge>
          <Badge variant="secondary" className="rounded text-[10px]">
            {question.blooms}
          </Badge>
        </div>
      </div>
    </li>
  )
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
