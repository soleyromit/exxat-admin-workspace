'use client'

import { useState, useMemo } from 'react'
import { Button, Checkbox, ToggleGroup, ToggleGroupItem } from '@exxatdesignux/ui'
import type { Reminder, EmailContact } from './step-communication'
import type { CourseIssue } from '@/lib/pce-push-validation'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_NEUTRAL,
} from '@/lib/list-status-badges'

export interface ReviewCourseGroup {
  templateTitle: string
  codes: string[]
}

interface StepReviewProps {
  surveyMode: 'course_evaluation' | 'general'
  surveyTitle: string
  surveyDescription: string
  termName: string
  academicYear: string
  offeringCount: number
  courseGroups: ReviewCourseGroup[]
  openDate: Date | undefined
  closeDate: Date | undefined
  releaseDate: Date | undefined
  studentCount: number
  emailContacts: EmailContact[]
  senderName: string
  templateName: string
  emailSubject: string
  emailBody: string
  isEmailEdited: boolean
  reminders: Reminder[]
  reminderSameAsInvite: boolean
  reminderTemplateName: string
  reminderSubject: string
  reminderBody: string
  onEdit: (step: number) => void
  onBack: () => void
  onPush: () => void
  cohortSummary?: string
  evaluateSummary?: string
  subjectIssues?: CourseIssue[]
  windowIssues?: CourseIssue[]
  /** Duplicate ACK gate. Term-setup passes course-grained issues (merged
   *  step); the push wizard passes the duplicates the admin explicitly
   *  ACCEPTED in Survey design (UC5 — re-consent, never new discovery). */
  duplicateIssues?: CourseIssue[]
  /** Override for the duplicate AckGroup heading (instance-grained flows
   *  word it as re-evaluations; the default copy is course-grained). */
  duplicateTitle?: string
  /** Duplicates the admin left UNCHECKED in Survey design — informational
   *  only (nothing overlapping is created), so no acknowledgement gate. */
  skippedDuplicateCount?: number
  /** Surveys that will actually be created (evaluity count, UC5 summary). */
  instanceCount?: number
  /** Accepted re-evaluations (subset of instanceCount) — stated in the plan
   *  rows; the acknowledgement gate below carries the consent. */
  reEvalCount?: number
  /** Gaps the admin queued in Survey design: evaluations created once
   *  faculty is assigned. Informational — the decision was made in step 2. */
  pendingGapCount?: number
}

function fmtDate(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}
function fmtShort(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'the close date'
}

/**
 * Checklist section — one verifiable row per wizard step (Mailchimp/Klaviyo
 * pre-flight model): readiness icon + title + Edit, label/value rows, and any
 * acknowledgement gates nested where the Edit that fixes them lives.
 */
function Section({
  state, title, onEdit, rows, children,
}: {
  state: 'ready' | 'warning' | 'incomplete'
  title: string
  onEdit: () => void
  rows: [string, React.ReactNode][]
  children?: React.ReactNode
}) {
  // Section state speaks the DS status vocabulary: the real ListHubStatusBadge
  // (tinted pill + fa-light icon + visible label), same as every hub surface.
  const status = state === 'ready'
    ? { tint: LIST_HUB_STATUS_TINT_SUCCESS, icon: 'fa-circle-check', label: 'Ready' }
    : state === 'warning'
      ? { tint: LIST_HUB_STATUS_TINT_WARNING, icon: 'fa-circle-exclamation', label: 'Needs acknowledgement' }
      : { tint: LIST_HUB_STATUS_TINT_NEUTRAL, icon: 'fa-circle-minus', label: 'Incomplete' }
  return (
    <div className="flex flex-col gap-2 border-t border-border py-4">
      {/* Status rides a shared right-aligned axis (the DS hub status-column
          convention) — after a variable-length title it lands ragged. */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold min-w-0 truncate">{title}</h3>
        <div className="flex items-center gap-4 shrink-0">
          <ListHubStatusBadge label={status.label} tint={status.tint} icon={status.icon} />
          {/* Icon-only edit — pure DS: ghost icon-xs Button + the catalog's
              edit glyph (fa-pen-to-square), no style overrides. A pencil
              square can't be mistaken for the labeled status pill beside it. */}
          <Button variant="ghost" size="icon-xs" aria-label={`Edit ${title}`} title={`Edit ${title}`} onClick={onEdit}>
            <i className="fa-light fa-pen-to-square" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-3 text-sm">
            <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 92 }}>{k}</span>
            <span className="min-w-0">{v}</span>
          </div>
        ))}
        {children}
      </div>
    </div>
  )
}

/**
 * Acknowledgement group — GitHub-merge-box restraint: neutral card surface,
 * the warning carried by icon + title only (LocalBanner's amber wash is for
 * short one-liners, not rich consent cards). Order: claim → reason →
 * evidence → a footer row pairing the required consent with the fix action.
 */
function AckGroup({
  id, title, reason, ackLabel, checked, onChange, action, children,
}: {
  id: string
  title: string
  reason: string
  ackLabel: string
  checked: boolean
  onChange: (v: boolean) => void
  /** Group-level fix action (e.g. Edit schedule). */
  action?: { label: string; onClick: () => void }
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border flex flex-col gap-2 px-4 py-3" style={{ background: 'var(--card)' }}>
      <div className="flex items-start gap-2.5">
        <i
          className="fa-light fa-circle-exclamation text-sm"
          aria-hidden="true"
          style={{ color: 'var(--insight-severity-warning-fg)', marginTop: 2 }}
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          {/* Warning hue on the title only (Navan out-of-policy card) — makes
              the card scan as a warning without a filled background. */}
          <span className="text-sm font-semibold" style={{ color: 'var(--insight-severity-warning-fg)' }}>{title}</span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{reason}</span>
        </div>
      </div>
      {children && <div className="ps-6">{children}</div>}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5 ps-6">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox id={id} checked={checked} onCheckedChange={v => onChange(!!v)} />
          <label htmlFor={id} className="text-sm cursor-pointer">
            {ackLabel} <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
        </div>
        {action && (
          <Button variant="outline" size="xs" className="shrink-0" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}

export function StepReview({
  surveyMode, surveyTitle, surveyDescription, termName, academicYear, offeringCount, courseGroups,
  openDate, closeDate, releaseDate, studentCount, emailContacts, senderName,
  templateName, emailSubject, emailBody, isEmailEdited, reminders,
  reminderSameAsInvite, reminderTemplateName, reminderSubject, reminderBody,
  onEdit, onBack, onPush,
  cohortSummary, evaluateSummary, subjectIssues = [], windowIssues = [], duplicateIssues = [],
  duplicateTitle, skippedDuplicateCount = 0, instanceCount, reEvalCount = 0, pendingGapCount = 0,
}: StepReviewProps) {
  const totalRecipients = studentCount + emailContacts.length
  const reminderSummary = reminders.length === 0
    ? null
    : `${[...reminders].map(r => r.daysBefore).sort((a, b) => b - a).join(', ')} days before close`
  const muted = (s: string) => <span className="text-muted-foreground">{s}</span>

  // Acknowledgement gates — each unresolved warning category must be consciously
  // accepted before Push (Dropbox multi-ack model).
  const [ackSubject, setAckSubject] = useState(false)
  const [ackWindow, setAckWindow] = useState(false)
  const [ackDuplicate, setAckDuplicate] = useState(false)
  const [windowListOpen, setWindowListOpen] = useState(false)

  const scheduleComplete = !!openDate && !!closeDate && !!releaseDate
  const coursesComplete = surveyMode !== 'course_evaluation' || courseGroups.length > 0
  const emailComplete = !!templateName
  const recipientsComplete = totalRecipients > 0
  const subjectAck = subjectIssues.length === 0 || ackSubject
  const windowAck = windowIssues.length === 0 || ackWindow
  const duplicateAck = duplicateIssues.length === 0 || ackDuplicate
  const allReady = scheduleComplete && coursesComplete && emailComplete && recipientsComplete && subjectAck && windowAck && duplicateAck

  const heading = surveyTitle.trim() || (surveyMode === 'course_evaluation' ? termName || 'Course evaluation' : 'Untitled survey')

  // Email preview — persistent rail (revised RV-A; Mobbin campaign tools are
  // unanimous that the artifact being sent stays visible at review).
  const [previewMode, setPreviewMode] = useState<'invitation' | 'reminder'>('invitation')
  const [testSent, setTestSent] = useState(false)

  function resolveMerge(text: string): string {
    return text
      .replace(/\{\{student_first_name\}\}/g, 'Alex')
      .replace(/\{\{course_name\}\}/g, courseGroups[0]?.codes[0] ?? 'your course')
      .replace(/\{\{term_name\}\}/g, termName || 'this term')
      .replace(/\{\{close_date\}\}/g, fmtShort(closeDate))
      .replace(/\{\{days_until_close\}\}/g, '3')
      .replace(/\{\{s\}\}/g, 's')
      .replace(/\{\{program_name\}\}/g, 'your program')
      .replace(/\{\{survey_link\}\}/g, '[ Open survey ]')
  }
  const preview = useMemo(() => {
    if (previewMode === 'reminder') {
      return reminderSameAsInvite
        ? { subject: emailSubject, body: emailBody }
        : { subject: reminderSubject, body: reminderBody }
    }
    return { subject: emailSubject, body: emailBody }
  }, [previewMode, emailSubject, emailBody, reminderSameAsInvite, reminderSubject, reminderBody])

  return (
    /* Full-bleed step — pre-flight checklist (one row per wizard step, with
       readiness state and nested acknowledgements) beside a persistent email
       rail. flex-1 + mt-auto footer = footer anchored at the bottom. */
    <div className="flex flex-col gap-4 flex-1">
      {/* ── Headline — RV-A is "headline + dispatch sentence", two lines, no
           more. The academic year rides the title rather than taking a line of
           its own, and anonymity/release move into Schedule & email beside the
           Results row that already states the same date. ──────────────────── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold font-heading">
          {heading}
          {academicYear && (
            <span className="font-normal text-muted-foreground"> · {academicYear}</span>
          )}
        </h2>
        {totalRecipients > 0 && !!openDate && !!closeDate && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {/* Instance-grain flows lead with the step-2 grammar: the count of
                evaluations IS the plan; people and dates qualify it. */}
            {instanceCount != null && surveyMode === 'course_evaluation' ? (
              <>
                Creating{' '}
                <span className="font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
                  {instanceCount} evaluation{instanceCount !== 1 ? 's' : ''}
                </span>
                {offeringCount > 0 && (
                  <> across <span className="font-medium" style={{ color: 'var(--foreground)' }}>{offeringCount} course{offeringCount !== 1 ? 's' : ''}</span></>
                )}
                {' '}· reaching <span className="font-medium" style={{ color: 'var(--foreground)' }}>{totalRecipients} {totalRecipients === 1 ? 'person' : 'people'}</span>
              </>
            ) : (
              <>
                Sending to{' '}
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {totalRecipients} {totalRecipients === 1 ? 'person' : 'people'}
                </span>
                {surveyMode === 'course_evaluation' && offeringCount > 0 && (
                  <> across <span className="font-medium" style={{ color: 'var(--foreground)' }}>{offeringCount} course{offeringCount !== 1 ? 's' : ''}</span></>
                )}
              </>
            )}
            {' '}· opens <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(openDate)}</span>
            {' '}· closes <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(closeDate)}</span>
          </p>
        )}
      </div>

      {/* ── Pre-flight checklist + persistent email rail ───────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">
      <div className="flex flex-col flex-1 min-w-0">
      <Section
        state={!recipientsComplete ? 'incomplete' : subjectIssues.length > 0 && !ackSubject ? 'warning' : 'ready'}
        title="Recipients"
        onEdit={() => onEdit(1)}
        rows={[
          ...(surveyMode === 'course_evaluation'
            ? ([
                ['Evaluating', [cohortSummary, evaluateSummary].filter(Boolean).join(' · ') || muted('—')],
              ] as [string, React.ReactNode][])
            : []),
          // Only the people breakdown — the headline sentence owns the
          // course/evaluation counts, so this row states what it doesn't.
          ['Audience', recipientsComplete
            ? `${studentCount} student${studentCount !== 1 ? 's' : ''}${surveyMode !== 'course_evaluation' && offeringCount > 0 ? ` · ${offeringCount} course${offeringCount !== 1 ? 's' : ''}` : ''}${emailContacts.length > 0 ? ` · ${emailContacts.length} external contact${emailContacts.length !== 1 ? 's' : ''}` : ''}`
            : muted('No recipients yet')],
        ]}
      >
        {surveyMode === 'course_evaluation' && subjectIssues.length > 0 && (
          <div className="mt-1">
            <AckGroup
              id="ack-subject-data"
              title={`${subjectIssues.length} course${subjectIssues.length !== 1 ? 's are' : ' is'} missing subject data`}
              reason="They have no students to survey or no one to evaluate. You can still continue; these courses are skipped."
              ackLabel="I understand no evaluations will be created for these courses until their missing data is added"
              checked={ackSubject}
              onChange={setAckSubject}
            >
              {/* Same ~5-row cap as the other issue lists — a term with many
                  data gaps must not stretch the review page. */}
              <div className="flex flex-col gap-1 overflow-y-auto pe-1" style={{ maxHeight: 150 }}>
                {subjectIssues.map(iss => (
                  <div key={iss.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {iss.courseLabel}
                      <span style={{ color: 'var(--muted-foreground)' }}> · {iss.reasons.join(', ')}</span>
                    </span>
                    <Button asChild variant="link" size="xs" className="shrink-0">
                      <a href={iss.prismHref ?? '#'} target="_blank" rel="noopener noreferrer" title="Fix in Exxat Prism · opens in a new tab">
                        Fix in Prism
                        <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </AckGroup>
          </div>
        )}
      </Section>

      <Section
        state={!coursesComplete ? 'incomplete' : duplicateIssues.length > 0 && !ackDuplicate ? 'warning' : 'ready'}
        title="Survey design"
        onEdit={() => onEdit(2)}
        rows={[
          // One line per template group — the joined single string hid which
          // courses ran which template once step 2 went instance-grain.
          ['Templates', surveyMode === 'course_evaluation' && courseGroups.length > 0
            ? (
                <span className="flex flex-col gap-0.5 min-w-0">
                  {/* Count, not codes — 13 comma-separated codes is unreadable;
                      the per-course assignment lives in step 2 behind Edit. */}
                  {courseGroups.map(g => (
                    <span key={g.templateTitle} className="min-w-0 truncate">
                      {g.templateTitle}
                      <span className="text-muted-foreground tabular-nums"> · {g.codes.length} course{g.codes.length !== 1 ? 's' : ''}</span>
                    </span>
                  ))}
                </span>
              )
            : muted('No courses assigned')],
          // The step-2 outcome ledger: what this push creates, re-runs, skips,
          // and defers — restated, never re-decided (UC5).
          ...(reEvalCount > 0
            ? ([[
                'Evaluated again',
                <span key="re">{reEvalCount} over existing survey{reEvalCount !== 1 ? 's' : ''}</span>,
              ]] as [string, React.ReactNode][])
            : []),
          ...(skippedDuplicateCount > 0
            ? ([[
                'Skipped',
                // Self-contained sentence — "3 already exist for this term"
                // forced the reader to borrow the subject from the label.
                muted(`${skippedDuplicateCount} course${skippedDuplicateCount !== 1 ? 's' : ''} already ${skippedDuplicateCount === 1 ? 'has' : 'have'} this evaluation, so no new one is created`),
              ]] as [string, React.ReactNode][])
            : []),
          ...(pendingGapCount > 0
            ? ([[
                'Awaiting faculty',
                muted(`${pendingGapCount} created once faculty is assigned`),
              ]] as [string, React.ReactNode][])
            : []),
        ]}
      >
        {surveyMode === 'course_evaluation' && duplicateIssues.length > 0 && (
          <div className="mt-1">
            <AckGroup
              id="ack-duplicate"
              title={duplicateTitle ?? `${duplicateIssues.length} course${duplicateIssues.length !== 1 ? 's' : ''} already ${duplicateIssues.length !== 1 ? 'have' : 'has'} an evaluation scheduled or live this term`}
              reason="Pushing again creates a second, overlapping survey. Students in these courses will receive both."
              ackLabel={duplicateTitle
                ? 'I understand these evaluatees receive a second survey'
                : 'I understand this creates a second evaluation for these courses'}
              checked={ackDuplicate}
              onChange={setAckDuplicate}
              /* Instance-grained flows resolve duplicates in Survey design
                 (step 2); the course-grained term-setup edits step 1. */
              action={{ label: 'Edit selection', onClick: () => onEdit(duplicateTitle ? 2 : 1) }}
            >
              {/* Same ~5-row cap as the window list below — duplicates on a
                  large term must not stretch the review page either. */}
              <div className="flex flex-col gap-1 overflow-y-auto pe-1" style={{ maxHeight: 150 }}>
                {duplicateIssues.map(iss => (
                  <div key={iss.id} className="text-sm min-w-0 truncate">
                    {iss.courseLabel}
                    <span style={{ color: 'var(--muted-foreground)' }}> · {iss.reasons.join(' · ')}</span>
                  </div>
                ))}
              </div>
            </AckGroup>
          </div>
        )}
      </Section>

      {/* Email lives with the schedule — both are step-3 decisions, so the
          section's Edit routes to the step that actually owns them. */}
      <Section
        state={!scheduleComplete || !emailComplete ? 'incomplete' : windowIssues.length > 0 && !ackWindow ? 'warning' : 'ready'}
        title="Schedule & email"
        onEdit={() => onEdit(3)}
        rows={[
          // Once dates are set the headline sentence owns them (stated once);
          // the row only surfaces while the schedule is incomplete.
          ...(scheduleComplete
            ? []
            : ([['Window', muted('Dates not set')]] as [string, React.ReactNode][])),
          // Anonymity sits beside the release date it qualifies — the headline
          // is reserved for the dispatch sentence.
          ...(surveyMode === 'course_evaluation'
            ? ([[
                'Responses',
                <span key="anon" className="flex items-center gap-1.5">
                  <i className="fa-light fa-shield-check text-xs" aria-hidden="true" />
                  Anonymous
                </span>,
              ]] as [string, React.ReactNode][])
            : []),
          ['Results', fmtDate(releaseDate)],
          ['Email', templateName
            ? (
                <span className="min-w-0 truncate">
                  {templateName}
                  {isEmailEdited && <span className="text-xs text-muted-foreground"> · edited</span>}
                </span>
              )
            : muted('Not set')],
          ['Reminders', reminders.length === 0
            ? muted('None scheduled')
            : <>{reminderSameAsInvite ? 'Same as invitation' : reminderTemplateName}<span className="text-muted-foreground"> · {reminderSummary}</span></>],
          ['From', senderName || 'Exxat Surveys'],
        ]}
      >
        {surveyMode === 'course_evaluation' && windowIssues.length > 0 && (
          <div className="mt-1">
            <AckGroup
              id="ack-window"
              title={`${windowIssues.length} course${windowIssues.length !== 1 ? 's' : ''} ended over 2 weeks before the survey opens`}
              reason="Students would answer long after class ended, so responses may be less accurate."
              ackLabel="Send to these courses anyway"
              checked={ackWindow}
              onChange={setAckWindow}
              action={{ label: 'Edit schedule', onClick: () => onEdit(3) }}
            >
              {/* Progressive disclosure — collapsed count expands to one row
                  per course; the list is capped at ~5 rows with an inner
                  scroll so a large term never stretches the review page. */}
              <div className="flex flex-col gap-1">
                {windowListOpen && (
                  <div className="flex flex-col gap-1 overflow-y-auto pe-1" style={{ maxHeight: 150 }}>
                    {windowIssues.map(iss => (
                      <div key={iss.id} className="text-sm min-w-0 truncate">
                        {iss.courseLabel}
                        <span style={{ color: 'var(--muted-foreground)' }}> · {iss.reasons.join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="xs"
                  className="self-start"
                  aria-expanded={windowListOpen}
                  onClick={() => setWindowListOpen(v => !v)}
                >
                  {windowListOpen ? 'Hide courses' : `Show all ${windowIssues.length} courses`}
                </Button>
              </div>
            </AckGroup>
          </div>
        )}
      </Section>
      </div>

      {/* ── Email rail — the artifact students receive, always visible ────── */}
      <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-3 border-t border-border pt-4" aria-label="Email preview">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Email</h3>
          {emailComplete && (
            <ToggleGroup
              type="single"
              value={previewMode}
              onValueChange={v => { if (v) setPreviewMode(v as 'invitation' | 'reminder') }}
              variant="outline"
              size="sm"
              aria-label="Email preview type"
            >
              <ToggleGroupItem value="invitation">Invitation</ToggleGroupItem>
              <ToggleGroupItem value="reminder">Reminder</ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
        {emailComplete ? (
          <>
            <div className="rounded-md border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                <p className="text-xs text-muted-foreground truncate">From {senderName || 'Exxat Surveys'}</p>
                <p className="text-sm font-medium truncate" title={resolveMerge(preview.subject)}>
                  {resolveMerge(preview.subject) || muted('No subject')}
                </p>
              </div>
              <div style={{ padding: 12, maxHeight: 340, overflowY: 'auto' }}>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>
                  {resolveMerge(preview.body)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground hover:text-foreground"
              onClick={() => setTestSent(true)}
              disabled={testSent}
            >
              {testSent ? (
                <>
                  <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" style={{ color: 'var(--chart-2)' }} />
                  Test sent to you
                </>
              ) : 'Send test to me'}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No email template selected yet.{' '}
            <Button variant="link" size="xs" onClick={() => onEdit(3)}>Set up email</Button>
          </p>
        )}
      </aside>
      </div>

      {/* ── Footer — anchored (mt-auto); same single-row anatomy as every other step (Back left,
             primary right); only the blocking warning rides inline beside the
             submit — informational notes live with the headline. ── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <div className="flex items-center gap-4 min-w-0">
          {!allReady && (
            <p className="text-xs flex items-center gap-1.5 min-w-0" style={{ color: 'var(--insight-severity-warning-fg)' }}>
              <i className="fa-light fa-circle-exclamation text-xs" aria-hidden="true" />
              <span className="truncate">
                {!subjectAck || !windowAck || !duplicateAck
                  ? 'Acknowledge the flagged warnings above to continue.'
                  : 'Resolve the flagged sections before pushing.'}
              </span>
            </p>
          )}
          {/* No confirm dialog — the acknowledgement gates plus the count on
              the label are the consent; the CTA commits directly. */}
          <Button variant="default" size="sm" className="shrink-0" disabled={!allReady} onClick={onPush}>
            Set up Evaluations{totalRecipients > 0 ? ` · ${totalRecipients} ${totalRecipients === 1 ? 'person' : 'people'}` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
