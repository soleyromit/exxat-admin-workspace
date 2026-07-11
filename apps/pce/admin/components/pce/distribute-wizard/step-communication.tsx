'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  CardContent,
  DatePickerField,
  FieldLegend,
  Input,
  LocalBanner,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  ToggleSwitch,
} from '@exxatdesignux/ui'
import type { CourseOffering, ReminderFrequency, ReminderAnchor } from '@/lib/pce-mock-data'
import {
  MOCK_COURSE_ENROLLMENTS, MOCK_STUDENTS, MOCK_MASTER_COURSES, EVAL_EMAIL_TEMPLATES,
  EVAL_REMINDER_CADENCE, REMINDER_FREQUENCY_LABELS, REMINDER_ANCHOR_LABELS,
} from '@/lib/pce-mock-data'
import { ExxatPrismSheet, type PrismRecipient } from './exxat-prism-sheet'
import { EmailTemplateSheet } from './email-template-sheet'

const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7, 14]

// ── Mini email render — the recognition anchor (decorative, aria-hidden) ───────
// A stylised skeleton that reads unmistakably as "an email" (letterhead + body
// lines + the student CTA button) so this card can't be mistaken for the
// recipient rows above it. Tokenised only; no real copy is rendered here.
export function EmailThumbnail() {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 rounded-md border border-border overflow-hidden"
      style={{ width: 128, background: 'var(--card)' }}
    >
      <div
        className="flex items-center"
        style={{ height: 24, padding: '0 9px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
      >
        <div style={{ width: 28, height: 8, borderRadius: 2, background: 'var(--border-control-35)' }} />
      </div>
      <div className="flex flex-col" style={{ padding: '11px 9px', gap: 6 }}>
        <div style={{ height: 7, width: '82%', borderRadius: 2, background: 'var(--foreground)', opacity: 0.8 }} />
        <div style={{ height: 5, width: '100%', borderRadius: 2, background: 'var(--border)' }} />
        <div style={{ height: 5, width: '94%',  borderRadius: 2, background: 'var(--border)' }} />
        <div style={{ height: 5, width: '68%',  borderRadius: 2, background: 'var(--border)' }} />
        <div style={{ marginTop: 5, height: 15, width: 56, borderRadius: 3, background: 'var(--brand-color)' }} />
      </div>
    </div>
  )
}

// ── Reminder placeholder — reads as "a reminder/nudge" (bell + repeat ticks) ───
// Deliberately NOT the letterhead skeleton above: this card is about *nudging*
// non-responders, so the mark is a bell with three cadence ticks, not an email.
function ReminderThumbnail() {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 rounded-md border border-border overflow-hidden flex flex-col items-center justify-center gap-3"
      style={{ width: 128, height: 150, background: 'var(--card)' }}
    >
      <i className="fa-light fa-bell" style={{ fontSize: 30, color: 'var(--muted-foreground)' }} aria-hidden="true" />
      <div className="flex items-center gap-1.5">
        <span style={{ width: 14, height: 5, borderRadius: 3, background: 'var(--border)' }} />
        <span style={{ width: 14, height: 5, borderRadius: 3, background: 'var(--brand-color)', opacity: 0.7 }} />
        <span style={{ width: 14, height: 5, borderRadius: 3, background: 'var(--border)' }} />
      </div>
    </div>
  )
}

export type Reminder = { id: string; daysBefore: number }
export type EmailContact = { id: string; firstName: string; lastName: string; email: string }

// ── Prism icon mark ───────────────────────────────────────────────────────────
function PrismIconMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 21.185 121.13 121.13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="prism-mark-grad" x1="23.38" y1="125.015" x2="96.57" y2="39.8551" gradientUnits="userSpaceOnUse">
          <stop offset="0.04" stopColor="#E21C79" /><stop offset="0.65" stopColor="#E21E7B" />
          <stop offset="0.73" stopColor="#E42880" /><stop offset="0.88" stopColor="#E9448E" />
          <stop offset="1" stopColor="#EF609D" />
        </linearGradient>
      </defs>
      <path d="M60.56 142.305C94.0064 142.305 121.12 115.191 121.12 81.7451C121.12 48.2987 94.0064 21.1851 60.56 21.1851C27.1136 21.1851 0 48.2987 0 81.7451C0 115.191 27.1136 142.305 60.56 142.305Z" fill="url(#prism-mark-grad)" />
      <path d="M0.490234 89.3652C3.79023 115.675 23.9702 136.725 49.8502 141.355L84.4302 110.265V98.6852H71.5502L84.4302 87.1052V75.5252H71.5502L84.4302 63.9452V52.3652H41.6602L0.490234 89.3652Z" fill="#BE1E6D" />
      <path d="M84.4397 110.265H41.6597L48.3497 98.6851H84.4397V110.265Z" fill="white" />
      <path d="M84.4397 63.935H48.3497L41.6597 52.355H84.4397V63.935Z" fill="white" />
      <path d="M84.44 87.0951H55.04L58.38 81.3051L55.04 75.5151H84.44V87.0951Z" fill="white" />
      <path d="M32.3198 75.5151H55.0398L48.3498 63.9351H32.3198V75.5151Z" fill="white" />
      <path d="M32.3198 98.6852H48.3498L55.0398 87.0952H32.3198V98.6852Z" fill="white" />
    </svg>
  )
}


// ── Email chip — DS Badge + close button ──────────────────────────────────────
function EmailChip({ contact, onRemove }: { contact: EmailContact; onRemove: () => void }) {
  const displayName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email
  return (
    <Badge variant="secondary" className="gap-1 pr-1" title={contact.email}>
      <span className="truncate" style={{ maxWidth: 160 }}>{displayName}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${displayName}`}
        onClick={onRemove}
        className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
        style={{ width: 20, height: 20 }}
      >
        <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
      </Button>
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────


interface StepCommunicationProps {
  selectedOfferings: CourseOffering[]
  openDate: Date | undefined
  closeDate: Date | undefined
  releaseDate: Date | undefined
  senderName: string
  emailTemplateId: string
  emailSubject: string
  emailBody: string
  reminders: Reminder[]
  emailContacts: EmailContact[]
  reminderSameAsInvite: boolean
  reminderTemplateId: string
  reminderSubject: string
  reminderBody: string
  onReminderSameAsInviteChange: (v: boolean) => void
  onReminderTemplateChange: (id: string) => void
  onReminderSubjectChange: (v: string) => void
  onReminderBodyChange: (v: string) => void
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
  onReleaseDateChange: (d: Date | undefined) => void
  onSenderNameChange: (v: string) => void
  onEmailTemplateChange: (id: string) => void
  onEmailSubjectChange: (v: string) => void
  onEmailBodyChange: (v: string) => void
  onRemindersChange: (v: Reminder[]) => void
  onEmailContactsChange: (v: EmailContact[]) => void
  onBack: () => void
  onNext: () => void
  /** Step title — "Distribution" for programmatic surveys, else "Communication". */
  title?: string
}

export function StepCommunication({
  selectedOfferings,
  openDate, closeDate, releaseDate,
  senderName, emailTemplateId, emailSubject, emailBody, reminders, emailContacts,
  reminderSameAsInvite, reminderTemplateId, reminderSubject, reminderBody,
  onReminderSameAsInviteChange, onReminderTemplateChange, onReminderSubjectChange, onReminderBodyChange,
  onOpenDateChange, onCloseDateChange, onReleaseDateChange,
  onSenderNameChange, onEmailTemplateChange, onEmailSubjectChange, onEmailBodyChange,
  onRemindersChange, onEmailContactsChange, onBack, onNext,
  title = 'Communication',
}: StepCommunicationProps) {
  // ── Auto-populate Prism recipients ────────────────────────────────────────
  const autoRecipients = useMemo<PrismRecipient[]>(() => {
    const seen = new Set<string>()
    const result: PrismRecipient[] = []
    for (const offering of selectedOfferings) {
      for (const sid of MOCK_COURSE_ENROLLMENTS[offering.id] ?? []) {
        if (!seen.has(sid)) {
          seen.add(sid)
          const s = MOCK_STUDENTS.find(st => st.id === sid)
          if (s) result.push({ id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email, source: 'prism', subtitle: s.cohort, personaType: 'student' })
        }
      }
    }
    return result
  }, [selectedOfferings])

  const [manualOverride, setManualOverride] = useState<PrismRecipient[] | null>(null)
  const offeringIdsKey = selectedOfferings.map(o => o.id).sort().join(',')
  const prevKeyRef = useRef(offeringIdsKey)
  useEffect(() => {
    if (offeringIdsKey !== prevKeyRef.current) { setManualOverride(null); prevKeyRef.current = offeringIdsKey }
  }, [offeringIdsKey])

  const prismRecipients = manualOverride ?? autoRecipients
  const isAutoPopulated = manualOverride === null && autoRecipients.length > 0
  const prismStudents = prismRecipients.filter(r => r.personaType === 'student')
  const prismFaculty  = prismRecipients.filter(r => r.personaType === 'faculty')
  const prismOther    = prismRecipients.filter(r => !r.personaType || r.personaType === 'personnel')

  const prismDescription = useMemo(() => {
    if (prismRecipients.length === 0) return 'Distribute to Prism users with advanced filtering.'
    const parts: string[] = []
    if (prismStudents.length > 0) parts.push(`${prismStudents.length} student${prismStudents.length !== 1 ? 's' : ''}`)
    if (prismFaculty.length > 0)  parts.push(`${prismFaculty.length} faculty`)
    if (prismOther.length > 0)    parts.push(`${prismOther.length} other`)
    return parts.join(', ') + (isAutoPopulated ? ' from selected courses' : ' selected')
  }, [prismRecipients, prismStudents, prismFaculty, prismOther, isAutoPopulated])

  // ── Email contact state (lifted to the page so Review can summarise it) ─────
  const [addingContact, setAddingContact] = useState(false)
  const [draftFirst, setDraftFirst] = useState('')
  const [draftLast, setDraftLast] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const firstNameRef = useRef<HTMLInputElement>(null)

  function handleAddContact() {
    const email = draftEmail.trim().toLowerCase()
    if (!email.includes('@') || !email.includes('.')) return
    if (!emailContacts.some(c => c.email === email)) {
      onEmailContactsChange([...emailContacts, {
        id: `ec-${Date.now()}`,
        firstName: draftFirst.trim(),
        lastName: draftLast.trim(),
        email,
      }])
    }
    setDraftFirst(''); setDraftLast(''); setDraftEmail('')
    setAddingContact(false)
  }

  function handleContactFormKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setAddingContact(false); setDraftFirst(''); setDraftLast(''); setDraftEmail('') }
  }

  // ── Other state ───────────────────────────────────────────────────────────
  const [prismOpen, setPrismOpen] = useState(false)
  const [emailTemplateOpen, setEmailTemplateOpen] = useState(false)

  // ── Reminder email — lifted to the page so Review reflects the real choice ──
  const reminderTemplates = EVAL_EMAIL_TEMPLATES.filter(t => t.type === 'reminder')
  const [reminderTemplateOpen, setReminderTemplateOpen] = useState(false)
  const selectedReminderTemplate = EVAL_EMAIL_TEMPLATES.find(t => t.id === reminderTemplateId) ?? null
  function handleReminderTemplatePick(id: string) {
    onReminderTemplateChange(id)
    const t = EVAL_EMAIL_TEMPLATES.find(x => x.id === id)
    if (t) { onReminderSubjectChange(t.subject); onReminderBodyChange(t.body) }
  }
  const isReminderEditedForPush =
    !!selectedReminderTemplate && (reminderSubject !== selectedReminderTemplate.subject || reminderBody !== selectedReminderTemplate.body)
  const [reminderTestSent, setReminderTestSent] = useState(false)
  const reminderTestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSendReminderTest() {
    setReminderTestSent(true)
    if (reminderTestTimer.current) clearTimeout(reminderTestTimer.current)
    reminderTestTimer.current = setTimeout(() => setReminderTestSent(false), 3000)
  }

  // ── Subject preview — resolve merge fields to real sample values so the line
  //    reads like the actual email subject, not raw {{tokens}}. ───────────────
  const previewCourseName = useMemo(() => {
    const first = selectedOfferings[0]
    const course = first ? MOCK_MASTER_COURSES.find(c => c.id === first.masterCourseId) : null
    return course?.name || 'your course'
  }, [selectedOfferings])
  const previewCloseDate = closeDate
    ? closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'the close date'
  function resolveMerge(text: string) {
    return text
      .replace(/\{\{course_name\}\}/g, previewCourseName)
      .replace(/\{\{close_date\}\}/g, previewCloseDate)
      .replace(/\{\{term_name\}\}/g, 'this term')
      .replace(/\{\{student_first_name\}\}/g, 'Alex')
      .replace(/\{\{days_until_close\}\}/g, '3')
      .replace(/\{\{program_name\}\}/g, 'your program')
  }

  // ── Reminder cadence (frequency + anchor + start days) ─────────────────────
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>(EVAL_REMINDER_CADENCE.frequency)
  const [reminderAnchor, setReminderAnchor] = useState<ReminderAnchor>(EVAL_REMINDER_CADENCE.anchor)
  const [reminderStartDays, setReminderStartDays] = useState(EVAL_REMINDER_CADENCE.startDaysBefore)
  const reminderAnchorLabel = REMINDER_ANCHOR_LABELS[reminderAnchor]
  // Derive the day-based schedule from the cadence so downstream (Review, push) stays in sync.
  useEffect(() => {
    const step: Record<ReminderFrequency, number> = { daily: 1, every_3_days: 3, every_7_days: 7, custom: 3 }
    const days: number[] = []
    for (let d = reminderStartDays; d >= 1; d -= step[reminderFrequency]) days.push(d)
    onRemindersChange(days.map(d => ({ id: `r-${d}`, daysBefore: d })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderFrequency, reminderStartDays])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dateOrderError   = openDate && closeDate && closeDate <= openDate ? 'Close date must be after open date.' : null
  const releaseDateError = releaseDate && closeDate && releaseDate < closeDate ? 'Result release date must be on or after the close date.' : null
  const openInPast       = openDate && openDate < today
  const canContinue      = !!releaseDate && !dateOrderError && !releaseDateError

  const totalRecipientCount = prismRecipients.length + emailContacts.length
  const sectionPad: React.CSSProperties = { padding: '14px 16px' }

  // ── Email-notifications card derived state ─────────────────────────────────
  const selectedTemplate = EVAL_EMAIL_TEMPLATES.find(t => t.id === emailTemplateId) ?? null
  const invitationTemplates = EVAL_EMAIL_TEMPLATES.filter(t => t.type === 'invitation')
  // Picking on the card swaps the template and seeds subject/body from it.
  function handleTemplatePick(id: string) {
    onEmailTemplateChange(id)
    const t = EVAL_EMAIL_TEMPLATES.find(x => x.id === id)
    if (t) { onEmailSubjectChange(t.subject); onEmailBodyChange(t.body) }
  }
  // Edits in the push wizard are per-push overrides — they don't rewrite the
  // saved template, so surface that the picked template was tweaked here.
  const isEditedForPush =
    !!selectedTemplate && (emailSubject !== selectedTemplate.subject || emailBody !== selectedTemplate.body)
  const reachLabel = useMemo(() => {
    const parts: string[] = []
    if (prismStudents.length > 0) parts.push(`${prismStudents.length} student${prismStudents.length !== 1 ? 's' : ''}`)
    if (prismFaculty.length > 0)  parts.push(`${prismFaculty.length} faculty`)
    if (emailContacts.length > 0) parts.push(`${emailContacts.length} external contact${emailContacts.length !== 1 ? 's' : ''}`)
    return parts.length > 0 ? `Goes to ${parts.join(' · ')}` : 'No recipients selected yet'
  }, [prismStudents.length, prismFaculty.length, emailContacts.length])
  const [testSentToMe, setTestSentToMe] = useState(false)
  const testSentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSendTestToMe() {
    setTestSentToMe(true)
    if (testSentTimer.current) clearTimeout(testSentTimer.current)
    testSentTimer.current = setTimeout(() => setTestSentToMe(false), 3000)
  }


  return (
    /* Full-bleed step — content and footer both span the content area,
       consistent with the table steps (1–2).
       flex-1 + mt-auto footer = footer anchored at a fixed bottom position. */
    <div className="flex flex-col gap-6 flex-1">
      <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Set the survey window, invitation email, and reminder cadence.
        </p>
        <p className="text-xs text-muted-foreground">
          <i className="fa-light fa-gear me-1" aria-hidden="true" />
          Window, email and reminders are pre-filled from{' '}
          <Link href="/admin/eval-settings" className="underline underline-offset-2 hover:text-foreground">Settings</Link>
          {' '}— adjust below as needed.
        </p>
      </div>

      {dateOrderError   && <LocalBanner variant="error">{dateOrderError}</LocalBanner>}
      {releaseDateError && <LocalBanner variant="error">{releaseDateError}</LocalBanner>}
      {openInPast && !dateOrderError && (
        <LocalBanner variant="warning">
          The open date is in the past. Students will receive an invitation immediately upon push.
        </LocalBanner>
      )}

      {/* ── Survey window ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <FieldLegend variant="label">Survey window</FieldLegend>
        <Card className="shadow-none">
          <CardContent className="flex flex-col gap-4" style={{ padding: 16 }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="flex flex-col gap-1.5">
              <p id="label-opens-on" className="text-sm font-medium">
                Opens on <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
                <span className="sr-only">(required)</span>
              </p>
              <DatePickerField value={openDate} onChange={onOpenDateChange} aria-labelledby="label-opens-on" aria-required="true" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p id="label-closes-on" className="text-sm font-medium">
                Closes on <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
                <span className="sr-only">(required)</span>
              </p>
              <DatePickerField value={closeDate} onChange={onCloseDateChange} aria-labelledby="label-closes-on" aria-required="true" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p id="label-release-on" className="text-sm font-medium">
                Results released <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
                <span className="sr-only">(required)</span>
              </p>
              <DatePickerField value={releaseDate} onChange={onReleaseDateChange} aria-labelledby="label-release-on" aria-required="true" />
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Set the date when results become visible to instructors. Ensure this is after final grades are submitted.
          </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Email notifications ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <FieldLegend variant="label">Email notifications</FieldLegend>

        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex items-center gap-4" style={{ padding: 16 }}>
            {/* Mini render — click to preview/edit. This is what makes the card
                read as "the email", not another recipient row. */}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              onClick={() => setEmailTemplateOpen(true)}
              aria-label="Preview and edit the invitation email"
            >
              <EmailThumbnail />
            </Button>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <p className="text-sm font-semibold">Send invitation</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Sent to recipients when the survey opens. Choose a template.
              </p>

              <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 6 }}>
                <Select value={emailTemplateId} onValueChange={handleTemplatePick}>
                  <SelectTrigger
                    aria-label="Choose invitation template"
                    className="gap-1.5 font-semibold"
                    style={{ height: 32, width: 220 }}
                  >
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {invitationTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditedForPush && (
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· Edited for this push</span>
                )}
              </div>

              <p className="text-sm truncate" style={{ marginTop: 2 }} title={resolveMerge(emailSubject)}>
                <span style={{ color: 'var(--muted-foreground)' }}>Subject: </span>
                {resolveMerge(emailSubject) || 'You have been assigned a survey'}
              </p>

              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                From {senderName || 'Exxat Surveys'} · {reachLabel}
              </p>

              <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                <Button variant="outline" size="sm" onClick={() => setEmailTemplateOpen(true)}>Edit</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleSendTestToMe}
                  disabled={testSentToMe}
                >
                  {testSentToMe ? (
                    <>
                      <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--chart-2)' }} />
                      Test sent to you
                    </>
                  ) : 'Send test to me'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Reminders ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <FieldLegend variant="label">Reminders</FieldLegend>

        {/* Reminder email — its own template, or reuse the invitation's */}
        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex flex-col gap-4" style={{ padding: 16 }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0" style={{ maxWidth: 340 }}>
                <p className="text-sm font-semibold">Reminder email</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Only sent to students who haven&apos;t submitted yet.
                </p>
              </div>
              <label htmlFor="reminder-same-as-invite" className="flex items-center gap-2 cursor-pointer shrink-0">
                <span className="text-sm">Same as invitation email</span>
                <ToggleSwitch id="reminder-same-as-invite" checked={reminderSameAsInvite} onChange={onReminderSameAsInviteChange} />
              </label>
            </div>

            {reminderSameAsInvite ? (
              <div className="flex items-center gap-2.5 rounded-md" style={{ padding: '10px 12px', background: 'var(--muted)' }}>
                <i className="fa-light fa-arrow-turn-down-right" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                <p className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                  Students get the same email as the invitation.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => setReminderTemplateOpen(true)}
                  aria-label="Preview and edit the reminder email"
                >
                  <ReminderThumbnail />
                </Button>

                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={reminderTemplateId} onValueChange={handleReminderTemplatePick}>
                      <SelectTrigger
                        aria-label="Choose reminder template"
                        className="gap-1.5 font-semibold"
                        style={{ height: 32, width: 220 }}
                      >
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {reminderTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isReminderEditedForPush && (
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· Edited for this push</span>
                    )}
                  </div>

                  <p className="text-sm truncate" style={{ marginTop: 2 }} title={resolveMerge(reminderSubject)}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Subject: </span>
                    {resolveMerge(reminderSubject) || 'Reminder: your evaluation closes soon'}
                  </p>

                  <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                    <Button variant="outline" size="sm" onClick={() => setReminderTemplateOpen(true)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={handleSendReminderTest}
                      disabled={reminderTestSent}
                    >
                      {reminderTestSent ? (
                        <>
                          <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--chart-2)' }} />
                          Test sent to you
                        </>
                      ) : 'Send test to me'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminder cadence — when the reminder repeats */}
        <Card className="shadow-none">
          <CardContent className="flex flex-col gap-5" style={{ padding: 16 }}>
            {/* Reminder frequency */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5" style={{ maxWidth: 300 }}>
                <p className="text-sm font-medium">Reminder frequency</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>How often reminder emails repeat.</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {(Object.keys(REMINDER_FREQUENCY_LABELS) as ReminderFrequency[]).map(f => (
                  <Button key={f} variant={reminderFrequency === f ? 'default' : 'outline'} size="sm" className="h-8"
                    aria-pressed={reminderFrequency === f} onClick={() => setReminderFrequency(f)}>
                    {REMINDER_FREQUENCY_LABELS[f]}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Anchor date */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5" style={{ maxWidth: 300 }}>
                <p className="text-sm font-medium">Anchor date</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>The reference point the cadence is calculated from.</p>
              </div>
              <Select value={reminderAnchor} onValueChange={v => setReminderAnchor(v as ReminderAnchor)}>
                <SelectTrigger className="h-9 text-sm" style={{ width: 224 }} aria-label="Reminder anchor date"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(REMINDER_ANCHOR_LABELS) as ReminderAnchor[]).map(a => (
                    <SelectItem key={a} value={a}>{REMINDER_ANCHOR_LABELS[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Start sending */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5" style={{ maxWidth: 360 }}>
                <p className="text-sm font-medium">Start sending</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Begin reminders this many days before {reminderAnchorLabel}, repeating at the chosen frequency until the anchor date.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input type="number" min={1} max={60} value={reminderStartDays}
                  onChange={e => setReminderStartDays(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                  className="h-9 text-sm tabular-nums text-right" style={{ width: 80 }} aria-label="Start sending days before anchor" />
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>days before {reminderAnchorLabel}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      </div>

      {/* Nav — full content width (DS WizardFooter anatomy: Back left, primary right) */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

      <EmailTemplateSheet
        open={emailTemplateOpen}
        onOpenChange={setEmailTemplateOpen}
        templateId={emailTemplateId}
        subject={emailSubject}
        body={emailBody}
        senderName={senderName}
        onSave={(subject, body, sender, templateId) => {
          onEmailTemplateChange(templateId)
          onEmailSubjectChange(subject); onEmailBodyChange(body); onSenderNameChange(sender)
          setEmailTemplateOpen(false)
        }}
      />

      <EmailTemplateSheet
        open={reminderTemplateOpen}
        onOpenChange={setReminderTemplateOpen}
        templateType="reminder"
        templateId={reminderTemplateId}
        subject={reminderSubject}
        body={reminderBody}
        senderName={senderName}
        onSave={(subject, body, _sender, templateId) => {
          onReminderTemplateChange(templateId)
          onReminderSubjectChange(subject); onReminderBodyChange(body)
          setReminderTemplateOpen(false)
        }}
      />
    </div>
  )
}
