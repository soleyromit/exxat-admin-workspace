'use client'

import { useState, useMemo } from 'react'
import {
  Badge, Button, Card, CardAction, CardContent, CardHeader, CardTitle,
  Checkbox, Collapsible, CollapsibleContent, CollapsibleTrigger, LocalBanner,
  ToggleGroup, ToggleGroupItem,
} from '@exxatdesignux/ui'
import type { Reminder, EmailContact } from './step-communication'
import type { CourseIssue } from '@/lib/pce-push-validation'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_NEUTRAL,
} from '@/lib/list-status-badges'
import {
  REMINDER_ANCHOR_LABELS, REMINDER_FREQUENCY_LABELS, EVAL_REMINDER_CADENCE,
  type ReminderAnchor, type ReminderFrequency,
} from '@/lib/pce-mock-data'

/** One row per selected course offering — 2026-08-11, Monil: replaces the
 *  prior template-grouped summary ("it has to be a list view instead of a
 *  summary"). Template is deliberately absent — "template visualization is
 *  not important for admin." */
export interface ReviewCourseRow {
  offeringId: string
  code: string
  name: string
  courseTypeLabel: string
  openDate: Date | undefined
  closeDate: Date | undefined
  /** True when this course has a per-course window override (Survey window
   *  card, Step 3) instead of using the global open/close above. */
  hasCustomWindow: boolean
  studentCount: number
  /** Spelled out per Monil's exact wording ("Instructor is evaluated,
   *  Course Coordinator is evaluated..."), never a bare count. */
  evaluatedRoleLabels: string[]
}

interface StepReviewProps {
  surveyMode: 'course_evaluation' | 'general'
  surveyTitle: string
  surveyDescription: string
  termName: string
  academicYear: string
  offeringCount: number
  courseRows: ReviewCourseRow[]
  openDate: Date | undefined
  closeDate: Date | undefined
  studentCount: number
  /** The real per-course enrolledCount total (page.tsx realEnrolledTotal) —
   *  only passed when it exceeds studentCount's demo-roster figure. Surfaces
   *  the gap pce-mock-data.ts's own comment already flags ("shown as 'X of
   *  N enrolled in demo'") instead of quietly showing the smaller number
   *  with no caveat. */
  realStudentCount?: number
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
  /** Cadence facts (2026-08-12: Review previously hardcoded "before close"
   *  regardless of the actual anchor picked in Communication — Term End
   *  Date and Course End Date silently rendered wrong). Optional + defaulted
   *  to the program default so older callers don't break. */
  reminderAnchor?: ReminderAnchor
  reminderFrequency?: ReminderFrequency
  /** CE-only survey title formula + instructions (Communication step) —
   *  previously configured but never reviewed anywhere before Push. */
  surveyTitleTemplate?: string
  surveyInstructions?: string
  onEdit: (step: number) => void
  onBack: () => void
  onPush: () => void
  /** Accepted-but-unused (2026-08-12): its only consumer, Recipients'
   *  "Evaluating" row, is gone — that row could never say anything the
   *  headline's own evaluateSummary line doesn't already state. Left as a
   *  prop rather than threading a removal through both callers'
   *  (push/page.tsx, term-setup/page.tsx) own ceCohorts derivations. */
  cohortSummary?: string
  /** Accepted-but-unused (2026-08-12): its aggregate role line duplicated
   *  the exact "Course, Instructor, Course Coordinator" text every Survey
   *  design row already shows — removed as repeated content, not replaced. */
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

function fmtShort(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'the close date'
}

// Course · Type · Window · Students · Evaluates. Evaluates gets the most
// room and is the only column that never truncates (the code comment above
// its old list-row rendering still applies: "the one thing on this screen
// the admin is here to verify") — everything else is reference info that's
// fine to clip on a narrow render.
const COURSE_TABLE_GRID = `minmax(130px,1.1fr) 74px 128px 56px minmax(150px,1.3fr)`

/**
 * Checklist section — one verifiable row per wizard step (Mailchimp/Klaviyo
 * pre-flight model): a full-width card (single-column review, no persistent
 * rail — 2026-08-12) with readiness state + Edit, label/value rows, and any
 * acknowledgement banners nested where the Edit that fixes them lives.
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
  const status = state === 'ready'
    ? { tint: LIST_HUB_STATUS_TINT_SUCCESS, icon: 'fa-circle-check', label: 'Ready' }
    : state === 'warning'
      ? { tint: LIST_HUB_STATUS_TINT_WARNING, icon: 'fa-circle-exclamation', label: 'Needs acknowledgement' }
      : { tint: LIST_HUB_STATUS_TINT_NEUTRAL, icon: 'fa-circle-minus', label: 'Incomplete' }
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold min-w-0 truncate">{title}</CardTitle>
        <CardAction className="flex items-center gap-4">
          <ListHubStatusBadge label={status.label} tint={status.tint} icon={status.icon} />
          {/* Icon-only edit — pure DS: ghost icon-xs Button + the catalog's
              edit glyph (fa-pen-to-square), no style overrides. A pencil
              square can't be mistaken for the labeled status pill beside it. */}
          <Button variant="ghost" size="icon-xs" aria-label={`Edit ${title}`} title={`Edit ${title}`} onClick={onEdit}>
            <i className="fa-light fa-pen-to-square" aria-hidden="true" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map(([k, v]) => <Row key={k} label={k}>{v}</Row>)}
        {children}
      </CardContent>
    </Card>
  )
}

/** Shared label/value row — Section's `rows` prop renders these; Schedule &
 *  email also builds a few by hand (below) so the email-preview trigger and
 *  its Collapsible content share one Radix context, while keeping the exact
 *  same row anatomy as every other row on the page. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-xs shrink-0 w-24" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/**
 * Acknowledgement banner — explicit, not encoded (2026-08-12: replaces the
 * neutral-card AckGroup after review found the consent hard to parse). A
 * real DS LocalBanner states the issue in one plain sentence, names the
 * courses when there are few enough to read at a glance, and pairs exactly
 * one checkbox with the decision it gates — no icon/heading/paragraph/list
 * repeated per severity, no symbols to decode against a legend.
 */
function AckBanner({
  id, title, reason, issues, ackLabel, checked, onChange, action, children,
}: {
  id: string
  title: string
  reason: string
  /** Named inline when few enough to read as a sentence; a "Show all" toggle
   *  (via children) is expected for longer lists. */
  issues: CourseIssue[]
  ackLabel: string
  checked: boolean
  onChange: (v: boolean) => void
  /** Group-level fix action (e.g. Edit schedule). */
  action?: { label: string; onClick: () => void }
  children?: React.ReactNode
}) {
  const named = issues.length <= 3 ? issues.map(i => i.courseLabel).join(', ') : null
  return (
    <LocalBanner variant="warning" title={title}>
      <div className="flex flex-col gap-2.5">
        <p className="text-sm">
          {named && <>{named} — </>}
          {reason}
        </p>
        {children}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Checkbox id={id} checked={checked} onCheckedChange={v => onChange(!!v)} />
            <label htmlFor={id} className="text-sm font-medium cursor-pointer">
              {ackLabel}
              <span style={{ color: 'var(--destructive)' }} aria-hidden="true"> *</span>
              <span className="sr-only"> required</span>
            </label>
          </div>
          {action && (
            <Button variant="outline" size="xs" className="shrink-0" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </LocalBanner>
  )
}

export function StepReview({
  surveyMode, surveyTitle, surveyDescription, termName, academicYear, offeringCount, courseRows,
  openDate, closeDate, studentCount, realStudentCount, emailContacts, senderName,
  templateName, emailSubject, emailBody, isEmailEdited, reminders,
  reminderSameAsInvite, reminderTemplateName, reminderSubject, reminderBody,
  reminderAnchor = EVAL_REMINDER_CADENCE.anchor, reminderFrequency = EVAL_REMINDER_CADENCE.frequency,
  surveyTitleTemplate, surveyInstructions,
  onEdit, onBack, onPush,
  cohortSummary, evaluateSummary, subjectIssues = [], windowIssues = [], duplicateIssues = [],
  duplicateTitle, skippedDuplicateCount = 0, instanceCount, reEvalCount = 0, pendingGapCount = 0,
}: StepReviewProps) {
  const totalRecipients = studentCount + emailContacts.length
  // Demo-data caveat — real system would reach more; see realStudentCount's
  // own doc comment. Renders "15 of 476" instead of a bare "15" that reads
  // as the actual, final reach.
  const demoGap = realStudentCount != null && realStudentCount > studentCount
  const recipientsLabel = demoGap
    ? `${totalRecipients} of ${realStudentCount + emailContacts.length}`
    : `${totalRecipients}`
  // course_evaluation recipients ARE students (the only audience that
  // mode's push ever reaches); general/programmatic recipients are Prism
  // users of any persona type (faculty, staff, students), so "people"
  // stays accurate there — only narrow the noun where it's actually true.
  const recipientNoun = surveyMode === 'course_evaluation'
    ? (totalRecipients === 1 && !demoGap ? 'student' : 'students')
    : (totalRecipients === 1 ? 'person' : 'people')
  // Real cadence sentence (anchor + frequency), not a hardcoded "before
  // close" — startDays is fully derivable from the resolved reminders array
  // (the largest day-offset IS the configured start-days-before-anchor), so
  // no extra prop is needed to keep this in sync.
  const reminderStartDays = reminders.length > 0 ? Math.max(...reminders.map(r => r.daysBefore)) : 0
  const reminderAnchorLabel = REMINDER_ANCHOR_LABELS[reminderAnchor]
  const reminderSummary = reminders.length === 0
    ? null
    : `${REMINDER_FREQUENCY_LABELS[reminderFrequency]}, starting ${reminderStartDays} day${reminderStartDays !== 1 ? 's' : ''} before ${reminderAnchorLabel}`
  const muted = (s: string) => <span className="text-muted-foreground">{s}</span>

  // Acknowledgement gates — each unresolved warning category must be consciously
  // accepted before Push (Dropbox multi-ack model).
  const [ackSubject, setAckSubject] = useState(false)
  const [ackWindow, setAckWindow] = useState(false)
  const [ackDuplicate, setAckDuplicate] = useState(false)
  const [windowListOpen, setWindowListOpen] = useState(false)

  // Whether the headline dispatch sentence (below) actually renders — same
  // three-part condition it gates on. Recipients' own rows only need to
  // state what the headline DIDN'T (Reviewer, 2026-08-12: "we are saying
  // recipients but we are evaluating course instructor course coordinator
  // ... this will be a combination from different templates and we found
  // this one single string ... this is actually confusing"). Mirrors the
  // exact restraint "Schedule & email" below already applies to its own
  // Window row.
  const headlineShown = totalRecipients > 0 && !!openDate && !!closeDate

  const scheduleComplete = !!openDate && !!closeDate
  const coursesComplete = surveyMode !== 'course_evaluation' || courseRows.length > 0
  const emailComplete = !!templateName
  const recipientsComplete = totalRecipients > 0
  const subjectAck = subjectIssues.length === 0 || ackSubject
  const windowAck = windowIssues.length === 0 || ackWindow
  const duplicateAck = duplicateIssues.length === 0 || ackDuplicate
  const allReady = scheduleComplete && coursesComplete && emailComplete && recipientsComplete && subjectAck && windowAck && duplicateAck

  const heading = surveyTitle.trim() || (surveyMode === 'course_evaluation' ? termName || 'Course evaluation' : 'Untitled survey')

  // Email preview — expand-in-place (2026-08-12: replaces the persistent
  // rail; RV-B, Zillow/GoFundMe review-screen shape). One trigger, one Tab
  // stop: the visible Button IS the Radix trigger (CollapsibleTrigger
  // asChild — the app-sidebar.tsx precedent), so Radix owns open state,
  // aria-expanded, and aria-controls.
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'invitation' | 'reminder'>('invitation')
  const [testSent, setTestSent] = useState(false)

  function resolveMerge(text: string): string {
    return text
      .replace(/\{\{student_first_name\}\}/g, 'Alex')
      .replace(/\{\{course_name\}\}/g, courseRows[0]?.code ?? 'your course')
      .replace(/\{\{term_name\}\}/g, termName || 'this term')
      .replace(/\{\{close_date\}\}/g, fmtShort(closeDate))
      .replace(/\{\{days_until_close\}\}/g, '3')
      .replace(/\{\{s\}\}/g, 's')
      // Sender, not the lowercase 'your program' placeholder — that fallback
      // sat at the start of the email's signature line ("your program
      // Team"), which read as a broken sentence rather than a sign-off.
      .replace(/\{\{program_name\}\}/g, senderName || 'Exxat Surveys')
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

  // CE-only survey title/instructions preview — resolved against the first
  // course row, the same merge-field vocabulary Communication's own preview
  // line uses (course_name / academic_year / term_name).
  const resolvedSurveyTitle = surveyTitleTemplate
    ? surveyTitleTemplate
        .replace(/\{\{course_name\}\}/g, courseRows[0]?.name ?? 'Course name')
        .replace(/\{\{academic_year\}\}/g, academicYear || 'Academic year')
        .replace(/\{\{term_name\}\}/g, termName || 'Term name')
    : null

  return (
    /* Full-bleed step — single-column pre-flight checklist (2026-08-12:
       replaces the two-column checklist + persistent rail). Each section is
       its own full-width card; the email preview expands in place inside
       Schedule & email instead of riding a side rail. flex-1 + mt-auto
       footer = footer anchored at the bottom. */
    <div className="flex flex-col gap-4 flex-1">
      {/* ── Headline — RV-A is "headline + dispatch sentence", two lines, no
           more. The academic year rides the title rather than taking a line of
           its own; anonymity moves into Schedule & email as its own row. ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold font-heading">
          {heading}
          {academicYear && (
            <span className="font-normal text-muted-foreground"> · {academicYear}</span>
          )}
        </h2>
        {/* Pill + icon row (2026-08-12, revised twice) — replaces the
            "Creating N evaluations across N courses · reaching N of N
            students · opens X · closes Y" run-on sentence. Outline, not
            filled secondary (rejected as visually flat) — matches the chip
            vocabulary the Survey title merge-field chips already
            established. Down to 3 chips, not 5 (2026-08-12: "can't we
            combine some of the chips?") — evaluations+courses are one
            "what's being created" fact, opens+closes are one window, not
            two independent dates each repeating a calendar icon. */}
        {totalRecipients > 0 && !!openDate && !!closeDate && (
          <div className="flex flex-wrap items-center gap-2">
            {instanceCount != null && surveyMode === 'course_evaluation' && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <i className="fa-light fa-clipboard-list text-xs text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-foreground">{instanceCount}</span> evaluation{instanceCount !== 1 ? 's' : ''}
                {surveyMode === 'course_evaluation' && offeringCount > 0 && (
                  <>
                    {' '}across <span className="font-semibold tabular-nums text-foreground">{offeringCount}</span> course{offeringCount !== 1 ? 's' : ''}
                  </>
                )}
              </Badge>
            )}
            {!(instanceCount != null && surveyMode === 'course_evaluation') && surveyMode === 'course_evaluation' && offeringCount > 0 && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <i className="fa-light fa-book-open text-xs text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-foreground">{offeringCount}</span> course{offeringCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 font-normal">
              <i className="fa-light fa-user-group text-xs text-muted-foreground" aria-hidden="true" />
              <span className="font-semibold text-foreground">{recipientsLabel}</span> {recipientNoun}
            </Badge>
            <Badge variant="outline" className="gap-1.5 font-normal">
              <i className="fa-light fa-calendar text-xs text-muted-foreground" aria-hidden="true" />
              <span className="font-semibold text-foreground">{fmtShort(openDate)} – {fmtShort(closeDate)}</span>
            </Badge>
          </div>
        )}
        {/* No separate demo-gap caveat sentence (2026-08-12: read as extra
            info) — "15 of 476 students" in the dispatch sentence above
            already states the gap; a footnote explaining why is noise once
            the number itself says it. */}
        {/* No separate aggregate role line (2026-08-12: read as repeated
            text — the exact same "Course, Instructor, Course Coordinator"
            string as both the headline AND all 13 Survey design rows below
            it). The per-course "Evaluates" column is the one this screen
            asks the admin to actually verify; restating its union here
            added a line that never says anything the table doesn't. */}
      </div>

      {/* ── Pre-flight checklist — full-width cards, single column ──────────── */}
      <div className="flex flex-col gap-4 flex-1">
      <Section
        state={!recipientsComplete ? 'incomplete' : subjectIssues.length > 0 && !ackSubject ? 'warning' : 'ready'}
        title="Recipients"
        onEdit={() => onEdit(1)}
        // "Evaluating" is gone outright — evaluateSummary already rides its
        // own headline line (below) whenever it exists, in every state, so
        // this row could never say anything new. "Audience" only surfaces
        // while the headline is silent about it (no recipients yet, or
        // dates not set) — once the headline states the count, restating it
        // here is the exact "repeat information and unusable information"
        // the reviewer flagged.
        rows={headlineShown
          ? []
          : ([
              ['Audience', recipientsComplete
                ? `${studentCount} student${studentCount !== 1 ? 's' : ''}${surveyMode !== 'course_evaluation' && offeringCount > 0 ? ` · ${offeringCount} course${offeringCount !== 1 ? 's' : ''}` : ''}${emailContacts.length > 0 ? ` · ${emailContacts.length} external contact${emailContacts.length !== 1 ? 's' : ''}` : ''}`
                : muted('No recipients yet')],
            ] as [string, React.ReactNode][])}
      >
        {surveyMode === 'course_evaluation' && subjectIssues.length > 0 && (
          <AckBanner
            id="ack-subject-data"
            title={`${subjectIssues.length} course${subjectIssues.length !== 1 ? 's are' : ' is'} missing subject data`}
            reason="They have no students to survey or no one to evaluate. You can still continue; these courses are skipped."
            issues={subjectIssues}
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
          </AckBanner>
        )}
      </Section>

      <Section
        state={!coursesComplete ? 'incomplete' : duplicateIssues.length > 0 && !ackDuplicate ? 'warning' : 'ready'}
        title="Survey design"
        onEdit={() => onEdit(2)}
        rows={[
          // CE-only title/instructions — configured in Communication, never
          // reviewed anywhere before this (2026-08-12 gap). Resolved against
          // the first course row, same merge vocabulary as its own preview.
          ...(surveyMode === 'course_evaluation' && resolvedSurveyTitle
            ? ([['Title', <span key="title" className="min-w-0 truncate" title={resolvedSurveyTitle}>{resolvedSurveyTitle}</span>]] as [string, React.ReactNode][])
            : []),
          ...(surveyMode === 'course_evaluation' && surveyInstructions?.trim()
            ? ([['Instructions', <span key="instructions" className="min-w-0 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{surveyInstructions}</span>]] as [string, React.ReactNode][])
            : []),
          // Table format (2026-08-12, per the 9:30am "Survey design and
          // review" call — Romit: "Monu showed me... a table format...
          // I'll try to reorganize it that way"; the reviewer: "maybe a
          // table review of all the courses"). Supersedes the 2026-08-11
          // list-row version (Monil: "it has to be a list view instead of a
          // summary") — a later, more specific direction from the same
          // reviewer thread, not a silent reversal. Template stays absent
          // (Monil's same call: "template visualization is not important
          // for admin"). Evaluates is still spelled out, still never
          // truncated — a real table column doesn't require every column to
          // be a fixed-width scalar, so the roles-evaluated concern that
          // kept Step 2 on a card layout (Jul 24) doesn't block a table
          // here.
          ['Courses', surveyMode === 'course_evaluation' && courseRows.length > 0
            ? (
                // tabIndex/role/aria-label — plain text rows, no focusable
                // descendant, so without this a keyboard user has no way to
                // reach or scroll a 14+-row list (WCAG 2.1.1).
                <div className="overflow-y-auto pe-1" style={{ maxHeight: 300 }} tabIndex={0} role="region" aria-label="Courses">
                  <div
                    className="grid gap-3 pb-1.5 mb-1 border-b border-border text-xs font-medium text-muted-foreground"
                    style={{ gridTemplateColumns: COURSE_TABLE_GRID }}
                  >
                    <span>Course</span>
                    <span>Type</span>
                    <span>Window</span>
                    <span>Students</span>
                    <span>Evaluates</span>
                  </div>
                  {courseRows.map(row => (
                    <div
                      key={row.offeringId}
                      className="grid gap-3 items-baseline py-1.5 border-t border-border/60 first:border-t-0 text-sm"
                      style={{ gridTemplateColumns: COURSE_TABLE_GRID }}
                    >
                      {/* title — the course cell truncates at this column
                          width; without it, a long name is unrecoverable on
                          the one screen whose job is verifying which course
                          this is (no hover/keyboard path otherwise). */}
                      <span className="min-w-0 truncate" title={`${row.code} · ${row.name}`}>
                        <span className="font-medium">{row.code}</span>
                        <span className="text-muted-foreground"> · {row.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground min-w-0 truncate">{row.courseTypeLabel}</span>
                      <span className="text-xs text-muted-foreground min-w-0 truncate">
                        {fmtShort(row.openDate)}–{fmtShort(row.closeDate)}
                        {row.hasCustomWindow && (
                          <span aria-label=", custom window for this course"> *</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">{row.studentCount}</span>
                      {/* Spelled out, never truncated — this is the one thing
                          on this screen the admin is here to verify. */}
                      <span className="text-xs text-muted-foreground min-w-0">
                        {row.evaluatedRoleLabels.length > 0
                          ? row.evaluatedRoleLabels.join(', ')
                          : muted('No roles evaluated')}
                      </span>
                    </div>
                  ))}
                </div>
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
          <AckBanner
            id="ack-duplicate"
            title={duplicateTitle ?? `${duplicateIssues.length} course${duplicateIssues.length !== 1 ? 's' : ''} already ${duplicateIssues.length !== 1 ? 'have' : 'has'} an evaluation scheduled or live this term`}
            reason="Pushing again creates a second, overlapping survey. Students in these courses will receive both."
            issues={duplicateIssues}
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
          </AckBanner>
        )}
      </Section>

      {/* Email lives with the schedule — both are step-3 decisions, so the
          section's Edit routes to the step that actually owns them. */}
      <Section
        state={!scheduleComplete || !emailComplete ? 'incomplete' : windowIssues.length > 0 && !ackWindow ? 'warning' : 'ready'}
        title="Schedule & email"
        onEdit={() => onEdit(3)}
        // Rows built by hand in children (below), not via the generic `rows`
        // prop — the Email row's preview trigger and its CollapsibleContent
        // must share one Radix <Collapsible> ancestor to work at all, and
        // `rows` always renders before `children` (breaking the trigger's
        // position between Responses and Reminders) if split that way.
        rows={[]}
      >
        {/* Once dates are set the headline sentence owns them (stated once);
            the row only surfaces while the schedule is incomplete. */}
        {!scheduleComplete && <Row label="Window">{muted('Dates not set')}</Row>}
        {surveyMode === 'course_evaluation' && (
          <Row label="Responses">
            <span className="flex items-center gap-1.5">
              <i className="fa-light fa-shield-check text-xs" aria-hidden="true" />
              Anonymous
            </span>
          </Row>
        )}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          {/* Explicit gap-3 — Collapsible doesn't inherit CardContent's own
              flex-col gap-3 (it's one child slot, not a passthrough), so
              without this Email/Reminders/From rendered flush against each
              other while Responses above kept its proper rhythm (2026-08-12
              visual audit: "Reminders" and "From" read cramped next to
              "Email" compared to the gap above it). */}
          <div className="flex flex-col gap-3">
            <Row label="Email">
              {templateName ? (
                <span className="flex items-center gap-3 flex-wrap">
                  <span className="min-w-0 truncate">
                    {templateName}
                    {isEmailEdited && <span className="text-xs text-muted-foreground"> · edited</span>}
                  </span>
                  {/* Expand-in-place trigger — the visible Button IS the
                      Collapsible trigger (asChild), so Radix owns
                      aria-expanded/aria-controls without a duplicate
                      sr-only trigger. */}
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="xs">
                      <i className={`fa-light ${previewOpen ? 'fa-chevron-up' : 'fa-envelope-open-text'} text-xs`} aria-hidden="true" />
                      {previewOpen ? 'Hide preview' : 'Preview email'}
                    </Button>
                  </CollapsibleTrigger>
                </span>
              ) : muted('Not set')}
            </Row>
            <Row label="Reminders">
              {reminders.length === 0
                ? muted('None scheduled')
                : <>{reminderSameAsInvite ? 'Same as invitation' : reminderTemplateName}<span className="text-muted-foreground"> · {reminderSummary}</span></>}
            </Row>
            <Row label="From">{senderName || 'Exxat Surveys'}</Row>
          </div>
          {emailComplete && (
            <CollapsibleContent>
              {/* Capped at 600px — the width a real email client renders at. */}
              <div className="flex flex-col gap-2.5 pt-1" style={{ maxWidth: 600 }}>
                <div className="flex items-center gap-3">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setTestSent(true)}
                    disabled={testSent}
                  >
                    {testSent ? (
                      <>
                        <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" style={{ color: 'var(--qb-status-saved-fg)' }} />
                        Test sent to you
                      </>
                    ) : 'Send test to me'}
                  </Button>
                </div>
                <div className="rounded-md border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
                  <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                    <p className="text-xs text-muted-foreground truncate">From {senderName || 'Exxat Surveys'}</p>
                    <p className="text-sm font-medium truncate" title={resolveMerge(preview.subject)}>
                      {resolveMerge(preview.subject) || muted('No subject')}
                    </p>
                  </div>
                  {/* tabIndex — a fixed-height overflow region with only static
                      text inside has no focusable descendant, so a keyboard user
                      has no way to reach or scroll it (WCAG 2.1.1). */}
                  <div
                    style={{ padding: 12, maxHeight: 320, overflowY: 'auto' }}
                    tabIndex={0}
                    role="region"
                    aria-label="Email body preview"
                  >
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>
                      {resolveMerge(preview.body)}
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
        {surveyMode === 'course_evaluation' && windowIssues.length > 0 && (
          <div className={emailComplete ? 'mt-1' : undefined}>
            <AckBanner
              id="ack-window"
              title={`${windowIssues.length} course${windowIssues.length !== 1 ? 's' : ''} ended over 2 weeks before the survey opens`}
              reason="Students would answer long after class ended, so responses may be less accurate."
              issues={windowIssues}
              ackLabel="Send to these courses anyway"
              checked={ackWindow}
              onChange={setAckWindow}
              action={{ label: 'Edit schedule', onClick: () => onEdit(3) }}
            >
              {/* Progressive disclosure — collapsed count expands to one row
                  per course; the list is capped at ~5 rows with an inner
                  scroll so a large term never stretches the review page. */}
              {windowIssues.length > 3 && (
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
              )}
            </AckBanner>
          </div>
        )}
      </Section>
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
            Set up Evaluations{totalRecipients > 0 ? ` · ${totalRecipients} ${recipientNoun}` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
