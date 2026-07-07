'use client'

import { useState, useMemo } from 'react'
import {
  Badge, Button, Checkbox, ToggleGroup, ToggleGroupItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@exxatdesignux/ui'
import type { Reminder, EmailContact } from './step-communication'
import type { CourseIssue } from '@/lib/pce-push-validation'

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
}

function fmtDate(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}
function fmtShort(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'the close date'
}

/** Section: heading + Edit + label/value rows (Walmart review-and-confirm model). */
function Section({
  title, onEdit, rows,
}: {
  title: string
  onEdit: () => void
  rows: [string, React.ReactNode][]
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" onClick={onEdit}>
          Edit
        </Button>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-3 text-sm">
          <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 92 }}>{k}</span>
          <span className="min-w-0">{v}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Acknowledgement group — check-row model (Vercel/GitHub merge blockers):
 * title + shared reason once, compact per-course rows carrying only what
 * differs, one correct action, and a separated required consent line.
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
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5 py-3">
      <i
        className="fa-regular fa-circle-exclamation text-xs"
        aria-hidden="true"
        style={{ color: 'var(--insight-severity-warning-fg)', marginTop: 4 }}
      />
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{reason}</span>
          </div>
          {action}
        </div>
        {children}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Checkbox id={id} checked={checked} onCheckedChange={v => onChange(!!v)} />
          <label htmlFor={id} className="text-xs cursor-pointer">
            {ackLabel} <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
        </div>
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
  cohortSummary, evaluateSummary, subjectIssues = [], windowIssues = [],
}: StepReviewProps) {
  const typeLabel = surveyMode === 'general' ? 'Programmatic survey' : 'Course evaluation'
  const totalRecipients = studentCount + emailContacts.length
  const reminderSummary = reminders.length === 0
    ? null
    : `${[...reminders].map(r => r.daysBefore).sort((a, b) => b - a).join(', ')} days before close`
  const muted = (s: string) => <span className="text-muted-foreground">{s}</span>

  // Acknowledgement gates — each unresolved warning category must be consciously
  // accepted before Push (Dropbox multi-ack model).
  const [ackSubject, setAckSubject] = useState(false)
  const [ackWindow, setAckWindow] = useState(false)

  const scheduleComplete = !!openDate && !!closeDate && !!releaseDate
  const coursesComplete = surveyMode !== 'course_evaluation' || courseGroups.length > 0
  const emailComplete = !!templateName
  const recipientsComplete = totalRecipients > 0
  const subjectAck = subjectIssues.length === 0 || ackSubject
  const windowAck = windowIssues.length === 0 || ackWindow
  const allReady = scheduleComplete && coursesComplete && emailComplete && recipientsComplete && subjectAck && windowAck
  const hasWarnings = subjectIssues.length > 0 || windowIssues.length > 0

  const heading = surveyTitle.trim() || (surveyMode === 'course_evaluation' ? termName || 'Course evaluation' : 'Untitled survey')

  // Email preview (in a dialog — RV-A keeps the column calm)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'invitation' | 'reminder'>('invitation')
  const [testSent, setTestSent] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  const assignmentSummary = surveyMode === 'course_evaluation' && courseGroups.length > 0
    ? courseGroups.map(g => `${g.codes.length} course${g.codes.length !== 1 ? 's' : ''} — ${g.templateTitle}`).join(' · ')
    : null

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 620 }}>
      {/* ── Headline ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-semibold font-heading">{heading}</h2>
          <Badge variant="secondary">{typeLabel}</Badge>
        </div>
        {academicYear && <p className="text-sm text-muted-foreground">{academicYear}</p>}
        {totalRecipients > 0 && !!openDate && !!closeDate && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Sending to{' '}
            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
              {totalRecipients} {totalRecipients === 1 ? 'person' : 'people'}
            </span>
            {surveyMode === 'course_evaluation' && offeringCount > 0 && (
              <> across <span className="font-medium" style={{ color: 'var(--foreground)' }}>{offeringCount} course{offeringCount !== 1 ? 's' : ''}</span></>
            )}
            {' '}· opens <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(openDate)}</span>
            {' '}· closes <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(closeDate)}</span>
          </p>
        )}
      </div>

      {/* ── Sections ───────────────────────────────────────────────────────── */}
      <Section
        title="Recipients"
        onEdit={() => onEdit(1)}
        rows={[
          ...(surveyMode === 'course_evaluation'
            ? ([
                ['Evaluating', [cohortSummary, evaluateSummary].filter(Boolean).join(' · ') || muted('—')],
              ] as [string, React.ReactNode][])
            : []),
          ['Reach', recipientsComplete
            ? `${studentCount} student${studentCount !== 1 ? 's' : ''}${offeringCount > 0 ? ` · ${offeringCount} courses` : ''}${emailContacts.length > 0 ? ` · ${emailContacts.length} external` : ''}`
            : muted('No recipients yet')],
        ]}
      />

      <Section
        title="Survey"
        onEdit={() => onEdit(2)}
        rows={[
          ['Template', assignmentSummary ?? muted('No courses assigned')],
          ['Email', templateName
            ? <>{templateName}{isEmailEdited && <span className="text-xs text-muted-foreground"> · edited</span>}</>
            : muted('Not set')],
        ]}
      />

      <Section
        title="Schedule"
        onEdit={() => onEdit(3)}
        rows={[
          ['Window', scheduleComplete ? `${fmtDate(openDate)} → ${fmtDate(closeDate)}` : muted('Dates not set')],
          ['Results', fmtDate(releaseDate)],
          ['Reminders', reminders.length === 0
            ? muted('None scheduled')
            : <>{reminderSameAsInvite ? 'Same as invitation' : reminderTemplateName}<span className="text-muted-foreground"> · {reminderSummary}</span></>],
          ['From', senderName || 'Exxat Surveys'],
        ]}
      />

      {/* ── Email preview (dialog) ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Email</h3>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>Preview email</Button>
      </div>

      {/* ── Warnings — acknowledgement gates ──────────────────────────────── */}
      {surveyMode === 'course_evaluation' && hasWarnings && (
        <div className="rounded-lg border border-border px-4 py-1" style={{ background: 'var(--card)' }}>
          {subjectIssues.length > 0 && (
            <AckGroup
              id="ack-subject-data"
              title={`${subjectIssues.length} course${subjectIssues.length !== 1 ? 's are' : ' is'} missing subject data`}
              reason="They may reach no one, or have no one to evaluate. You can still push — they'll be skipped."
              ackLabel="I understand these courses are missing faculty or student data"
              checked={ackSubject}
              onChange={setAckSubject}
            >
              <div className="flex flex-col gap-1">
                {subjectIssues.map(iss => (
                  <div key={iss.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {iss.courseLabel}
                      <span style={{ color: 'var(--muted-foreground)' }}> — {iss.reasons.join(', ')}</span>
                    </span>
                    <Button asChild variant="link" size="xs" className="shrink-0">
                      <a href={iss.prismHref} target="_blank" rel="noopener noreferrer" title="Fix in Exxat Prism — opens in a new tab">
                        Fix in Prism
                        <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </AckGroup>
          )}
          {subjectIssues.length > 0 && windowIssues.length > 0 && (
            <div className="border-t border-border" />
          )}
          {windowIssues.length > 0 && (
            <AckGroup
              id="ack-window"
              title={`${windowIssues.length} course${windowIssues.length !== 1 ? 's’' : '’s'} survey window doesn’t align with the course dates`}
              reason="The survey opens after these courses have already ended."
              ackLabel="I understand the survey window doesn't align with these courses' dates"
              checked={ackWindow}
              onChange={setAckWindow}
              action={
                <Button variant="outline" size="xs" className="shrink-0" onClick={() => onEdit(3)}>
                  Edit schedule
                </Button>
              }
            >
              <div className="flex flex-wrap gap-1.5">
                {windowIssues.map(iss => (
                  <Badge key={iss.id} variant="outline" className="font-normal" title={iss.courseLabel}>
                    {iss.courseLabel.split(' – ')[0]}
                  </Badge>
                ))}
              </div>
            </AckGroup>
          )}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {surveyMode === 'course_evaluation' && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <i className="fa-light fa-shield-check text-xs" aria-hidden="true" style={{ marginTop: 2 }} />
            <span>Responses are anonymous. Results release to instructors on {fmtShort(releaseDate)}.</span>
          </p>
        )}
        {!allReady && (
          <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--insight-severity-warning-fg)' }}>
            <i className="fa-solid fa-circle-exclamation text-xs" aria-hidden="true" style={{ marginTop: 2 }} />
            <span>
              {!subjectAck || !windowAck
                ? 'Acknowledge the flagged warnings above to continue.'
                : 'Resolve the flagged sections before pushing.'}
            </span>
          </p>
        )}
        <Button variant="default" size="sm" className="w-full" disabled={!allReady} onClick={() => setConfirmOpen(true)}>
          Push evaluation{totalRecipients > 0 ? ` · ${totalRecipients} ${totalRecipients === 1 ? 'person' : 'people'}` : ''}
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" onClick={onBack}>
          Back to Communication
        </Button>
      </div>

      {/* ── Email preview dialog ───────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email preview</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <ToggleGroup
              type="single"
              value={previewMode}
              onValueChange={v => { if (v) setPreviewMode(v as 'invitation' | 'reminder') }}
              variant="outline"
              size="sm"
              spacing={8}
              className="justify-start"
              aria-label="Email preview type"
            >
              <ToggleGroupItem value="invitation">Invitation</ToggleGroupItem>
              <ToggleGroupItem value="reminder">Reminder</ToggleGroupItem>
            </ToggleGroup>
            <div className="rounded-md border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                <p className="text-xs text-muted-foreground truncate">From {senderName || 'Exxat Surveys'}</p>
                <p className="text-sm font-medium truncate" title={resolveMerge(preview.subject)}>
                  {resolveMerge(preview.subject) || muted('No subject')}
                </p>
              </div>
              <div style={{ padding: 12, maxHeight: 260, overflowY: 'auto' }}>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm dialog ─────────────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Push this survey?</DialogTitle>
            <DialogDescription>
              This sends the {typeLabel.toLowerCase()} to{' '}
              <span className="font-medium text-foreground">
                {totalRecipients} recipient{totalRecipients !== 1 ? 's' : ''}
              </span>
              {openDate ? <> starting {fmtShort(openDate)}</> : null}. It can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="default" size="sm" onClick={() => { setConfirmOpen(false); onPush() }}>
              Push survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
