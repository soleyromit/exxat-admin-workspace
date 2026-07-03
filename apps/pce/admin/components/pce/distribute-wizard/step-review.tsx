'use client'

import { useState, useMemo } from 'react'
import {
  Badge, Button, ToggleGroup, ToggleGroupItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@exxatdesignux/ui'
import type { Reminder, EmailContact } from './step-communication'

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
}

function fmtDate(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}
function fmtShort(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'the close date'
}

// ── Readiness section — flat, hairline-divided (Klaviyo/Mailchimp "ready to
//    send" pattern). A completion marker + label + Edit, then the detail. No
//    boxed cards, no filled header bars. ────────────────────────────────────
function ReviewSection({
  label, complete, onEdit, children,
}: { label: string; complete: boolean; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <i
          className={complete ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}
          aria-hidden="true"
          style={{ fontSize: 13, color: complete ? 'var(--chart-2)' : 'var(--chart-4)' }}
        />
        <h3 className="text-sm font-semibold flex-1">{label}</h3>
        <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" onClick={onEdit}>Edit</Button>
      </div>
      <div className="flex flex-col gap-1 text-sm" style={{ paddingLeft: 21 }}>{children}</div>
    </section>
  )
}

// One label→value line inside a section (label demoted, value primary).
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-muted-foreground shrink-0" style={{ width: 96 }}>{label}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  )
}

export function StepReview({
  surveyMode, surveyTitle, surveyDescription, termName, academicYear, offeringCount, courseGroups,
  openDate, closeDate, releaseDate, studentCount, emailContacts, senderName,
  templateName, emailSubject, emailBody, isEmailEdited, reminders,
  reminderSameAsInvite, reminderTemplateName, reminderSubject, reminderBody,
  onEdit, onBack, onPush,
}: StepReviewProps) {
  const typeLabel = surveyMode === 'general' ? 'Programmatic survey' : 'Course evaluation'
  const totalRecipients = studentCount + emailContacts.length
  const reminderSummary = reminders.length === 0
    ? null
    : `${[...reminders].map(r => r.daysBefore).sort((a, b) => b - a).join(', ')} days before close`
  const muted = (s: string) => <span className="text-muted-foreground">{s}</span>

  // ── Completion — what could block an irreversible send ──────────────────────
  const recipientsComplete = totalRecipients > 0
  const scheduleComplete   = !!openDate && !!closeDate && !!releaseDate
  const coursesComplete    = surveyMode !== 'course_evaluation' || courseGroups.length > 0
  const emailComplete      = !!templateName
  const allReady = recipientsComplete && scheduleComplete && coursesComplete && emailComplete

  // ── Email preview — resolve merge fields to sample values so it reads like
  //    the real message (Wix / Maze / Loops "preview column" pattern). ────────
  const [previewMode, setPreviewMode] = useState<'invitation' | 'reminder'>('invitation')
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
      // "Same as invitation" reuses the invite copy; otherwise the reminder's own.
      return reminderSameAsInvite
        ? { subject: emailSubject, body: emailBody, name: `${templateName} (same as invitation)` }
        : { subject: reminderSubject, body: reminderBody, name: reminderTemplateName }
    }
    return { subject: emailSubject, body: emailBody, name: templateName }
  }, [previewMode, emailSubject, emailBody, templateName, reminderSameAsInvite, reminderSubject, reminderBody, reminderTemplateName])

  const [testSent, setTestSent] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Identity — course evaluations don't collect a title, so fall back to the
  // term (the natural "what am I sending"); programmatic surveys use the title.
  const heading = surveyTitle.trim()
    || (surveyMode === 'course_evaluation' ? (termName || 'Course evaluation') : 'Untitled survey')
  const headingIsTerm = !surveyTitle.trim() && surveyMode === 'course_evaluation'
  const metaLead = [headingIsTerm ? null : termName, academicYear].filter(Boolean).join(' · ')
  const metaLine = [metaLead, surveyDescription].filter(Boolean).join(' — ') || '—'

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 980 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Review &amp; push</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Confirm everything below, preview the email, then push. This sends to all recipients and can&apos;t be undone.
        </p>
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Readiness column ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0" style={{ maxWidth: 560 }}>
          {/* Identity header — the primary "what am I sending" anchor */}
          <div className="flex items-start gap-2 pb-4 border-b border-border">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-semibold truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                  {heading}
                </h2>
                <Badge variant="secondary">{typeLabel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{metaLine}</p>
            </div>
            <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground shrink-0" onClick={() => onEdit(1)}>Edit</Button>
          </div>

          {/* Recipients first — the highest-stakes fact for an irreversible send */}
          <ReviewSection label="Recipients" complete={recipientsComplete} onEdit={() => onEdit(3)}>
            <Detail label="Via Prism">
              {studentCount > 0 ? `${studentCount} student${studentCount !== 1 ? 's' : ''} from the selected courses` : muted('None')}
            </Detail>
            <Detail label="External">
              {emailContacts.length === 0 ? muted('None') : (
                <div className="flex flex-col gap-0.5">
                  {emailContacts.map(c => {
                    const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
                    return (
                      <span key={c.id} className="truncate">
                        {name ? <span className="font-medium">{name}</span> : null}
                        {name ? <span className="text-muted-foreground"> · {c.email}</span> : c.email}
                      </span>
                    )
                  })}
                </div>
              )}
            </Detail>
          </ReviewSection>

          <ReviewSection label="Schedule" complete={scheduleComplete} onEdit={() => onEdit(3)}>
            <Detail label="Opens">{fmtDate(openDate)}</Detail>
            <Detail label="Closes">{fmtDate(closeDate)}</Detail>
            <Detail label="Results">{fmtDate(releaseDate)}</Detail>
          </ReviewSection>

          {surveyMode === 'course_evaluation' && (
            <ReviewSection label={`Courses & templates · ${offeringCount} offering${offeringCount !== 1 ? 's' : ''}`} complete={coursesComplete} onEdit={() => onEdit(2)}>
              {courseGroups.length === 0
                ? <span>{muted('No courses selected')}</span>
                : courseGroups.map((g, i) => (
                    <Detail key={i} label={g.templateTitle}>
                      <span className="text-muted-foreground">{g.codes.length} course{g.codes.length !== 1 ? 's' : ''} — </span>
                      {g.codes.join(', ')}
                    </Detail>
                  ))}
            </ReviewSection>
          )}

          <ReviewSection label="Emails" complete={emailComplete} onEdit={() => onEdit(3)}>
            <Detail label="Invitation">
              {templateName}
              {isEmailEdited && <span className="text-xs text-muted-foreground"> · edited for this push</span>}
            </Detail>
            <Detail label="Reminders">
              {reminders.length === 0 ? muted('No reminders scheduled') : (
                <span>
                  {reminderSameAsInvite ? 'Same as invitation' : reminderTemplateName}
                  <span className="text-muted-foreground"> · {reminderSummary}</span>
                </span>
              )}
            </Detail>
            <Detail label="From">{senderName || 'Exxat Surveys'}</Detail>
          </ReviewSection>
        </div>

        {/* ── Preview + push panel (sticky) ─────────────────────────────────── */}
        <aside className="shrink-0" style={{ width: 340, position: 'sticky', top: 8 }}>
          <div className="flex flex-col gap-3">
            {/* Recipient count — the "order total" of a send */}
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-2xl font-semibold tabular-nums" style={{ fontFamily: 'var(--font-heading)' }}>{totalRecipients}</span>
                <span className="text-xs text-muted-foreground">
                  {studentCount} student{studentCount !== 1 ? 's' : ''} · {emailContacts.length} external
                </span>
              </div>
              <span className="text-xs text-muted-foreground text-right">
                {fmtShort(openDate)} – {fmtShort(closeDate)}
              </span>
            </div>

            {/* Email preview — toggle invitation / reminder */}
            <ToggleGroup
              type="single"
              value={previewMode}
              onValueChange={(v) => { if (v) setPreviewMode(v as 'invitation' | 'reminder') }}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <ToggleGroupItem value="invitation">Invitation</ToggleGroupItem>
              <ToggleGroupItem value="reminder">Reminder</ToggleGroupItem>
            </ToggleGroup>

            <div className="rounded-md border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                <p className="text-xs text-muted-foreground truncate">From {senderName || 'Exxat Surveys'}</p>
                <p className="text-sm font-medium truncate" title={resolveMerge(preview.subject)}>{resolveMerge(preview.subject) || muted('No subject')}</p>
              </div>
              <div style={{ padding: '12px', maxHeight: 240, overflowY: 'auto' }}>
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
                  <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--chart-2)' }} />
                  Test sent to you
                </>
              ) : 'Send test to me'}
            </Button>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            {surveyMode === 'course_evaluation' && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <i className="fa-light fa-shield-check" aria-hidden="true" style={{ fontSize: 11, marginTop: 2 }} />
                <span>Responses are anonymous. Results release to instructors on {fmtShort(releaseDate)}.</span>
              </p>
            )}

            {!allReady && (
              <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--chart-4)' }}>
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" style={{ fontSize: 11, marginTop: 2 }} />
                <span>Resolve the flagged sections before you can push.</span>
              </p>
            )}

            <Button variant="default" size="sm" className="w-full" disabled={!allReady} onClick={() => setConfirmOpen(true)}>
              Push survey
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" onClick={onBack}>
              Back to Communication
            </Button>
          </div>
        </aside>
      </div>

      {/* ── Send confirmation — irreversible action (Mailchimp pattern) ──────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Push this survey?</DialogTitle>
            <DialogDescription>
              This sends the {typeLabel.toLowerCase()} to <span className="font-medium text-foreground">{totalRecipients} recipient{totalRecipients !== 1 ? 's' : ''}</span>
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
