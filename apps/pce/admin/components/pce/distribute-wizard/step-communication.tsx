'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  DatePickerField,
  DateRangePickerField,
  FieldLabel,
  FieldLegend,
  Input,
  InputGroup,
  LocalBanner,
  Popover, PopoverTrigger, PopoverContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Textarea,
  ToggleSwitch,
  formatDateFromDate,
} from '@exxatdesignux/ui'
import type { CourseOffering, ReminderFrequency, ReminderAnchor, SurveyStatus } from '@/lib/pce-mock-data'
import {
  type CommCadence, type CommRules, type CommEvaluatee,
} from '@/components/pce/existing-comm-rules'
import {
  MOCK_COURSE_ENROLLMENTS, MOCK_STUDENTS, MOCK_MASTER_COURSES, EVAL_EMAIL_TEMPLATES,
  EVAL_REMINDER_CADENCE, REMINDER_FREQUENCY_LABELS, REMINDER_ANCHOR_LABELS,
} from '@/lib/pce-mock-data'
import { courseDates } from '@/lib/pce-push-validation'
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

/** An existing open survey already messaging students in the selected courses.
 *  Rules render read-only beside the form: per-survey rules are legal and
 *  expected — the rail exists for visibility, never unification. Same-course
 *  streams sharing one rule set collapse into a single row (the popover
 *  carries the roster). */
export type ExistingCommStream = {
  id: string
  courseCode: string
  courseName?: string
  evaluatee: CommEvaluatee
  status: SurveyStatus
  openDate?: string
  /** "until Dec 4" (its close date). */
  untilLabel?: string
  cadence: CommCadence
  rules: CommRules
}

/** Per-offering survey window override (2026-06-30 decision, restated
 *  2026-08-11) — absence of an offering's id in the map means "uses the
 *  global survey window" above. */
export type CourseWindowOverride = { openDate?: Date; closeDate?: Date }

/** CE-only survey title formula — merge fields resolve per course at
 *  creation (2026-08-11, Monil). Reuses the `resolveMerge()` token
 *  vocabulary below, not a separate set of placeholders. */
export const DEFAULT_SURVEY_TITLE_TEMPLATE = '{{course_name}} – {{academic_year}} – EOT Eval'
export const DEFAULT_SURVEY_INSTRUCTIONS =
  'Please rate each statement honestly. Your responses are anonymous and will not be shared with instructors individually.'

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

/* Trigger classes mirrored 1:1 from the DS DatePickerField (fieldControlInnerClass()
   + its trigger utilities) — the DS component has no popover footer slot, so this
   file composes DS Popover + Calendar instead (same gap-composition precedent as
   Popover+Command for the missing MultiSelect). Candidate DS extension:
   `popoverFooter` on DatePickerField. */
const DATE_TRIGGER_CLASS =
  'border-0 bg-transparent shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 ' +
  'disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent ' +
  'flex min-w-0 flex-1 items-center justify-between gap-2 px-2.5 text-start text-sm font-normal text-foreground outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 [&_span]:truncate'

/** DatePickerField with a footer slot inside the popover (suggested dates). */
function DatePickerFieldWithFooter({
  value, onChange, footer, open, onOpenChange, ...aria
}: {
  value: Date | undefined
  onChange: (d: Date | undefined) => void
  footer?: React.ReactNode
  open: boolean
  onOpenChange: (v: boolean) => void
  'aria-labelledby'?: string
  'aria-required'?: boolean | 'true' | 'false'
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <InputGroup className="w-full">
        <PopoverTrigger asChild>
          <button
            type="button"
            data-slot="input-group-control"
            className={DATE_TRIGGER_CLASS}
            aria-label={value ? formatDateFromDate(value) : 'Pick a date'}
            {...aria}
          >
            <span className={!value ? 'text-muted-foreground' : undefined}>
              {value ? formatDateFromDate(value) : 'MM/DD/YYYY'}
            </span>
            <i className="fa-light fa-calendar shrink-0 text-muted-foreground text-xs" aria-hidden="true" />
          </button>
        </PopoverTrigger>
      </InputGroup>
      <PopoverContent className="z-[80] w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          fromYear={2020}
          toYear={2032}
          captionLayout="dropdown"
        />
        {footer}
      </PopoverContent>
    </Popover>
  )
}

interface StepCommunicationProps {
  selectedOfferings: CourseOffering[]
  academicYear: string
  /** Survey title/instructions — CE-only, and optional here (2026-08-17):
   *  the push wizard (app/(app)/surveys/push) moved this card to its Step 2,
   *  co-located with the courses it applies to, and doesn't pass these. The
   *  term-setup wizard (app/(app)/course-evaluation/term-setup) still owns
   *  its Step 2/3 as separate steps and keeps passing all five — this step
   *  renders the card there, unchanged. All five are supplied together or
   *  not at all; the render guard below checks every one. */
  surveyMode?: 'course_evaluation' | 'general'
  surveyTitleTemplate?: string
  onSurveyTitleTemplateChange?: (v: string) => void
  surveyInstructions?: string
  onSurveyInstructionsChange?: (v: string) => void
  /** Per-offering window override — absent offering id = uses the global window. */
  courseWindowOverrides: Record<string, CourseWindowOverride>
  onSetCourseWindowOverride: (offeringId: string, next: CourseWindowOverride) => void
  onClearCourseWindowOverride: (offeringId: string) => void
  openDate: Date | undefined
  closeDate: Date | undefined
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
  /** Cadence facts (reference point + repeat rate) — lifted so Review can
   *  state the real choice instead of assuming "before close" (2026-08-12). */
  reminderAnchor: ReminderAnchor
  onReminderAnchorChange: (v: ReminderAnchor) => void
  reminderFrequency: ReminderFrequency
  onReminderFrequencyChange: (v: ReminderFrequency) => void
  onReminderSameAsInviteChange: (v: boolean) => void
  onReminderTemplateChange: (id: string) => void
  onReminderSubjectChange: (v: string) => void
  onReminderBodyChange: (v: string) => void
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
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
  /** Open surveys already messaging students in the selected courses — feeds
   *  the reminder-cadence delta banner ("Existing surveys remind…" + Match
   *  existing cadence); no longer rendered as its own visible rail. */
  existingStreams?: ExistingCommStream[]
}

export function StepCommunication({
  selectedOfferings,
  academicYear,
  surveyMode, surveyTitleTemplate, onSurveyTitleTemplateChange,
  surveyInstructions, onSurveyInstructionsChange,
  courseWindowOverrides, onSetCourseWindowOverride, onClearCourseWindowOverride,
  openDate, closeDate,
  senderName, emailTemplateId, emailSubject, emailBody, reminders, emailContacts,
  reminderSameAsInvite, reminderTemplateId, reminderSubject, reminderBody,
  reminderAnchor, onReminderAnchorChange, reminderFrequency, onReminderFrequencyChange,
  onReminderSameAsInviteChange, onReminderTemplateChange, onReminderSubjectChange, onReminderBodyChange,
  onOpenDateChange, onCloseDateChange,
  onSenderNameChange, onEmailTemplateChange, onEmailSubjectChange, onEmailBodyChange,
  onRemindersChange, onEmailContactsChange, onBack, onNext,
  title = 'Communication',
  existingStreams = [],
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
      .replace(/\{\{academic_year\}\}/g, academicYear || 'this year')
      .replace(/\{\{close_date\}\}/g, previewCloseDate)
      .replace(/\{\{term_name\}\}/g, 'this term')
      .replace(/\{\{student_first_name\}\}/g, 'Alex')
      .replace(/\{\{days_until_close\}\}/g, '3')
      .replace(/\{\{program_name\}\}/g, 'your program')
  }

  // ── Survey title field-palette builder (CE-only, term-setup path) ───────────
  // 2026-08-12 — fourth pass, Romit's call: a plain text field (raw
  // `{{token}}` visible as typed text, not a rich pill) + a row of
  // bold-label chips below it. Clicking a chip inserts its token at the
  // current caret position — repeatable, not disabled-after-use, matching
  // standard merge-tag toolbars (the admin may want `{{course_name}}`
  // twice). `surveyTitleTemplate` stays the single string source of truth
  // end-to-end (resolveMerge, defaults, push payload unchanged). Only called
  // from the CE-only card below, which is itself gated on all five
  // survey-details props being present — the undefined checks here are for
  // TypeScript, not a reachable runtime path.
  const TITLE_MERGE_FIELDS: { token: string; label: string }[] = [
    { token: '{{course_name}}', label: 'Course name' },
    { token: '{{academic_year}}', label: 'Academic year' },
    { token: '{{term_name}}', label: 'Term name' },
  ]
  const titleInputRef = useRef<HTMLInputElement>(null)
  function insertTitleField(token: string) {
    if (surveyTitleTemplate === undefined || !onSurveyTitleTemplateChange) return
    const el = titleInputRef.current
    const start = el?.selectionStart ?? surveyTitleTemplate.length
    const end = el?.selectionEnd ?? surveyTitleTemplate.length
    const next = surveyTitleTemplate.slice(0, start) + token + surveyTitleTemplate.slice(end)
    onSurveyTitleTemplateChange(next)
    const caret = start + token.length
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(caret, caret) })
  }

  // ── Per-course survey window override (Step 3) — collapsed by default,
  //    closed disclosure per mockup 4.2. Row treatment is variant H from
  //    /compare/push-step3-course-window-override (2026-08-11, "Quiet
  //    default, marked exception"): default rows go silent (code + name,
  //    no repeated "Uses survey window" text on every row); an overridden
  //    row gets a brand dot + subtle row tint + full-weight resolved dates.
  //    Editing moves from always-inline fields to a row Popover (Save/
  //    Cancel), and a "Find a course" input narrows a long list. ──────────
  const [overridesOpen, setOverridesOpen] = useState(false)
  const overrideCount = selectedOfferings.filter(o => courseWindowOverrides[o.id]).length
  const [overrideQuery, setOverrideQuery] = useState('')
  const [overrideSearchOpen, setOverrideSearchOpen] = useState(false)
  const overrideSearchRef = useRef<HTMLInputElement>(null)
  const [overrideOpenRowId, setOverrideOpenRowId] = useState<string | null>(null)
  const [overrideDraft, setOverrideDraft] = useState<CourseWindowOverride>({})
  const visibleOfferings = selectedOfferings.filter(o => {
    if (!overrideQuery.trim()) return true
    const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
    return `${course?.code ?? ''} ${course?.name ?? ''}`.toLowerCase().includes(overrideQuery.trim().toLowerCase())
  })

  // ── Reminder cadence (frequency + anchor lifted to the page; start days
  //    stays local — it's fully re-derivable from `reminders` downstream). ──
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

  // ── Existing streams — the delta only speaks when every overlapping survey
  //    agrees on one frequency AND it differs from the current choice.
  //    Divergence between surveys is legal; the rail rows already state each.
  const sharedExistingCadence = useMemo(() => {
    if (existingStreams.length === 0) return null
    const first = existingStreams[0].cadence
    return existingStreams.every(s => s.cadence.frequency === first.frequency) ? first : null
  }, [existingStreams])
  const cadenceDiffers = sharedExistingCadence != null && sharedExistingCadence.frequency !== reminderFrequency

  // ── Course end dates → suggested open dates ────────────────────────────────
  // Most selected courses share a term-end date; surfacing the distribution
  // (and one-click suggestions derived from it) beats making the admin
  // cross-reference 13 course records to pick a window that lands after class.
  const endDateInfo = useMemo(() => {
    const ends = selectedOfferings
      .map(o => courseDates(o)?.end)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())
    if (ends.length === 0) return null
    const byDay = new Map<string, { date: Date; count: number }>()
    for (const d of ends) {
      const key = d.toDateString()
      const entry = byDay.get(key)
      if (entry) entry.count += 1
      else byDay.set(key, { date: new Date(d), count: 1 })
    }
    const common = [...byDay.values()].sort((a, b) => b.count - a.count || a.date.getTime() - b.date.getTime())[0]
    const earliest = ends[0]
    const latest = ends[ends.length - 1]
    // "Most courses" = the 75th-percentile end date, not the mode — with
    // scattered ends the mode can be 2 of 13, and a chip claiming "most"
    // off that count would be false.
    const p75 = ends[Math.min(ends.length - 1, Math.ceil(ends.length * 0.75) - 1)]
    const dayAfter = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n }
    return {
      total: ends.length,
      common,
      earliest,
      latest,
      allSameDay: byDay.size === 1,
      commonIsMajority: common.count * 2 >= ends.length,
      afterMost: dayAfter(p75),
      afterLatest: dayAfter(latest),
    }
  }, [selectedOfferings])
  const fmtSuggest = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const [openPickerOpen, setOpenPickerOpen] = useState(false)
  // A suggestion must not leave the form in an error state — it re-derives the
  // window length when the current dates are valid, else falls back to the
  // Settings prefill (14 days).
  function applySuggestedOpen(next: Date) {
    const DAY = 86_400_000
    const windowLen = openDate && closeDate && closeDate > openDate
      ? closeDate.getTime() - openDate.getTime()
      : 14 * DAY
    onOpenDateChange(next)
    onCloseDateChange(new Date(next.getTime() + windowLen))
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dateOrderError = openDate && closeDate && closeDate <= openDate ? 'Close date must be after open date.' : null
  const openInPast      = openDate && openDate < today
  const canContinue     = !dateOrderError

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
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Set the survey window, invitation email, and reminder cadence.
        </p>
        <p className="text-xs text-muted-foreground">
          <i className="fa-light fa-gear me-1" aria-hidden="true" />
          Window, email and reminders are pre-filled from{' '}
          <Link href="/admin/eval-settings" className="underline underline-offset-2 hover:text-foreground">Settings</Link>
          . Adjust below as needed.
        </p>
      </div>

      {dateOrderError && <LocalBanner variant="error">{dateOrderError}</LocalBanner>}
      {openInPast && !dateOrderError && (
        <LocalBanner variant="warning">
          The open date is in the past. Students will receive an invitation immediately upon push.
        </LocalBanner>
      )}

      {/* ── Survey details — CE-only title + instructions (2026-08-11, Monil).
          2026-08-17: only rendered when all five survey-details props are
          supplied — the push wizard now owns this card on its own Step 2 and
          stops passing them; term-setup still passes all five and keeps
          seeing this card here. */}
      {surveyMode === 'course_evaluation' && surveyTitleTemplate !== undefined && onSurveyTitleTemplateChange
        && surveyInstructions !== undefined && onSurveyInstructionsChange && (
        <div className="flex flex-col gap-3">
          <FieldLegend variant="label" className="font-semibold text-foreground">Survey details</FieldLegend>
          <Card className="shadow-none">
            <CardContent className="flex flex-col gap-4" style={{ padding: 16 }}>
              <div className="flex flex-col gap-1.5">
                <FieldLabel id="label-survey-title">
                  Survey title <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
                  <span className="sr-only">(required)</span>
                </FieldLabel>
                {/* Plain field — the raw {{token}} shows as typed text, no
                    special pill chrome. Chips below insert at the caret
                    (Romit's call, 2026-08-12: "chip based selection...
                    when clicking on the chip, then text would be shown
                    inside text box as {{text}}"). */}
                <Input
                  ref={titleInputRef}
                  aria-labelledby="label-survey-title"
                  value={surveyTitleTemplate}
                  onChange={e => onSurveyTitleTemplateChange(e.target.value)}
                  placeholder="e.g. {{course_name}} – {{academic_year}} – EOT Eval"
                />
                {/* font-normal — semibold read as heavier/larger than a
                    Badge should (2026-08-12 visual review); a leading "+"
                    signals "insert" instead of relying on weight alone. */}
                <div className="flex flex-wrap items-center gap-1.5" aria-label="Insert a merge field">
                  {TITLE_MERGE_FIELDS.map(f => (
                    <Badge key={f.token} asChild variant="outline" className="cursor-pointer font-normal">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => insertTitleField(f.token)}>
                        <i className="fa-light fa-plus text-[10px]" aria-hidden="true" />
                        {f.label}
                      </button>
                    </Badge>
                  ))}
                </div>
                {/* One row, not a chip row + a caption sentence + a separate
                    preview line (2026-08-12: still read as crowded with all
                    three stacked tight) — "per course" folds into the label
                    itself, and mt-1 gives it visible daylight from the chips
                    above instead of matching their gap-1.5 rhythm, so the
                    group reads as input+chips (editing) then preview
                    (result), not five undifferentiated rows. */}
                <div className="inline-flex items-center gap-2 rounded-md text-xs w-fit max-w-full mt-1" style={{ padding: '6px 10px', background: 'var(--muted)' }}>
                  <span className="text-muted-foreground shrink-0">Per-course preview</span>
                  <span className="font-medium text-foreground truncate">{resolveMerge(surveyTitleTemplate) || 'Untitled survey'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <p id="label-survey-instructions" className="text-sm font-medium">Survey instructions</p>
                {/* Caption removed (Romit, 2026-08-13, live) — the field
                    already shows the live default text; a caption
                    restating "shown to students... edit as needed" was
                    redundant with what's visibly sitting in the textarea. */}
                <Textarea
                  aria-labelledby="label-survey-instructions"
                  value={surveyInstructions}
                  onChange={e => onSurveyInstructionsChange(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Survey window ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <FieldLegend variant="label" className="font-semibold text-foreground">Survey window</FieldLegend>
        <Card className="shadow-none">
          <CardContent className="flex flex-col gap-4" style={{ padding: 16 }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="flex flex-col gap-1.5">
              <p id="label-opens-on" className="text-sm font-medium">
                Opens on <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
                <span className="sr-only">(required)</span>
              </p>
              <DatePickerFieldWithFooter
                value={openDate}
                onChange={onOpenDateChange}
                open={openPickerOpen}
                onOpenChange={setOpenPickerOpen}
                aria-labelledby="label-opens-on"
                aria-required="true"
                footer={endDateInfo ? (
                  <div className="border-t border-border px-3 py-2.5 flex flex-col gap-2" style={{ maxWidth: 300 }}>
                    <p className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                      {endDateInfo.allSameDay
                        ? `All ${endDateInfo.total} courses end ${fmtSuggest(endDateInfo.latest)}.`
                        : endDateInfo.commonIsMajority
                          ? `${endDateInfo.common.count} of ${endDateInfo.total} courses end ${fmtSuggest(endDateInfo.common.date)} · latest ends ${fmtSuggest(endDateInfo.latest)}.`
                          : `Courses end between ${fmtSuggest(endDateInfo.earliest)} and ${fmtSuggest(endDateInfo.latest)}.`}
                    </p>
                    <div className="flex flex-col items-stretch gap-1.5">
                      {!endDateInfo.allSameDay && endDateInfo.afterMost.getTime() !== endDateInfo.afterLatest.getTime() && (
                        <Button
                          variant="outline"
                          size="xs"
                          className="justify-start"
                          onClick={() => { applySuggestedOpen(endDateInfo.afterMost); setOpenPickerOpen(false) }}
                        >
                          Open {fmtSuggest(endDateInfo.afterMost)} · after most courses end
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="xs"
                        className="justify-start"
                        onClick={() => { applySuggestedOpen(endDateInfo.afterLatest); setOpenPickerOpen(false) }}
                      >
                        Open {fmtSuggest(endDateInfo.afterLatest)} · after all courses end
                      </Button>
                    </div>
                  </div>
                ) : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p id="label-closes-on" className="text-sm font-medium">
                Closes on <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
                <span className="sr-only">(required)</span>
              </p>
              <DatePickerField value={closeDate} onChange={onCloseDateChange} aria-labelledby="label-closes-on" aria-required="true" />
            </div>
          </div>

          {/* Per-course window override — closed by default (2026-06-30 decision,
              restated 2026-08-11). Reuses the row shape already proven for
              existing-stream rows: course code · label · right-aligned control. */}
          {selectedOfferings.length > 0 && (
            <div className="flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {/* Plain trigger, not the DS Button — ghost's variant classes
                  were leaving a faint rounded-pill resting background behind
                  (2026-08-12 visual review), reading as a chip rather than a
                  disclosure link. No box at all: chevron + the action label
                  in foreground weight, the count trailing in muted text. */}
              <button
                type="button"
                aria-expanded={overridesOpen}
                onClick={() => setOverridesOpen(v => !v)}
                className="flex items-center gap-1.5 text-sm w-fit bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <i
                  className={`fa-light fa-chevron-${overridesOpen ? 'down' : 'right'} text-muted-foreground`}
                  aria-hidden="true" style={{ fontSize: 10 }}
                />
                <span className="font-medium text-foreground">Customize per course</span>
                <span className="text-muted-foreground tabular-nums">· {overrideCount} of {selectedOfferings.length} overridden</span>
              </button>

              {overridesOpen && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    {/* DS toggle-search pattern (component-consistency.md —
                        table search must never be a standalone always-open
                        InputGroup): collapsed icon by default, expands to a
                        w-48 h-8 input on click, same as DataTable's toolbar. */}
                    {overrideSearchOpen ? (
                      <div className="relative flex items-center">
                        <i className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" aria-hidden="true" />
                        <Input
                          ref={overrideSearchRef}
                          type="text" role="searchbox" inputMode="search" autoComplete="off"
                          placeholder="Search…"
                          value={overrideQuery}
                          onChange={e => setOverrideQuery(e.target.value)}
                          onBlur={() => { if (!overrideQuery) setOverrideSearchOpen(false) }}
                          onKeyDown={e => { if (e.key === 'Escape') { setOverrideQuery(''); setOverrideSearchOpen(false) } }}
                          className={`h-8 w-48 pl-7 text-xs ${overrideQuery ? 'pr-8' : 'pr-2'}`}
                          aria-label="Find a course to customize"
                        />
                        {overrideQuery && (
                          <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setOverrideQuery('')}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label="Find a course to customize"
                        title="Search"
                        onClick={() => { setOverrideSearchOpen(true); setTimeout(() => overrideSearchRef.current?.focus(), 10) }}
                        className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <i className="fa-light fa-magnifying-glass text-[13px]" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col overflow-y-auto rounded-md border border-border" style={{ maxHeight: 260 }}>
                    {visibleOfferings.map(o => {
                      const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
                      const override = courseWindowOverrides[o.id]
                      const editing = overrideOpenRowId === o.id
                      return (
                        <div
                          key={o.id}
                          className="flex items-center gap-2.5 px-3 py-2 border-t border-border/60 first:border-t-0 flex-wrap"
                          style={{ minHeight: 40, background: override ? 'var(--muted)' : undefined }}
                        >
                          {override ? (
                            <span className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--brand-color)' }} aria-hidden="true" />
                          ) : (
                            <span className="shrink-0" style={{ width: 6 }} aria-hidden="true" />
                          )}
                          <span className="text-sm min-w-0 truncate flex-1">
                            <span className="font-medium">{course?.code}</span>
                            <span className="text-muted-foreground"> · {course?.name}</span>
                          </span>
                          {editing ? (
                            /* Inline, in the row — no floating Popover housing
                               the edit form (2026-08-12 feedback). The date
                               range field still opens its own DS calendar
                               popover on click, same as every other
                               DatePickerField in this step; that's the
                               control's own normal behavior, not what moved. */
                            <span className="flex items-center gap-2 shrink-0">
                              <DateRangePickerField
                                value={{ from: overrideDraft.openDate, to: overrideDraft.closeDate }}
                                onChange={range => setOverrideDraft({ openDate: range?.from, closeDate: range?.to })}
                                triggerClassName="h-8 text-sm"
                                numberOfMonths={1}
                              />
                              <Button variant="ghost" size="xs" onClick={() => setOverrideOpenRowId(null)}>Cancel</Button>
                              {override && (
                                <Button
                                  variant="ghost" size="xs"
                                  onClick={() => { onClearCourseWindowOverride(o.id); setOverrideOpenRowId(null) }}
                                >
                                  Clear
                                </Button>
                              )}
                              <Button
                                variant="default" size="xs"
                                onClick={() => { onSetCourseWindowOverride(o.id, overrideDraft); setOverrideOpenRowId(null) }}
                              >
                                Save
                              </Button>
                            </span>
                          ) : (
                            <>
                              {override && (
                                <span className="text-xs font-medium shrink-0 tabular-nums">
                                  {fmtSuggest(override.openDate ?? openDate ?? new Date())} – {fmtSuggest(override.closeDate ?? closeDate ?? new Date())}
                                </span>
                              )}
                              <Button
                                variant="ghost" size="icon-xs" className="shrink-0"
                                aria-label={`${override ? 'Edit' : 'Customize'} window for ${course?.code}`}
                                onClick={() => { setOverrideDraft(override ?? { openDate, closeDate }); setOverrideOpenRowId(o.id) }}
                              >
                                <i className={`fa-light ${override ? 'fa-pen-to-square' : 'fa-plus'} text-xs`} aria-hidden="true" />
                              </Button>
                            </>
                          )}
                        </div>
                      )
                    })}
                    {visibleOfferings.length === 0 && (
                      <p className="text-sm text-muted-foreground px-3 py-4">No courses match &ldquo;{overrideQuery}&rdquo;.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* ── Email notifications ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <FieldLegend variant="label" className="font-semibold text-foreground">Email notifications</FieldLegend>

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
        <FieldLegend variant="label" className="font-semibold text-foreground">Reminders</FieldLegend>

        {/* 2026-08-13 (Granola 7aeae56b, Vishal, raw transcript: "a specific
            reason why you are having to have two cards for reminders...
            throughout it's only one card per heading — survey window has
            one card, survey details as one card"). Was two separate Cards
            (kept apart 2026-08-12 because "the image placeholder and action
            in front of it versus the text and the action" layouts didn't
            match stacked in one CardContent) — merged into ONE Card now,
            same fix already used between Anchor date and Start sending
            below: a plain divider between the two differently-shaped
            sections instead of a second bordered surface. Nothing about
            either section's own layout changed. */}
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

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Reminder cadence — when the reminder repeats */}
          <CardContent className="flex flex-col gap-5" style={{ padding: 16 }}>
            {/* Delta vs existing streams — a fact in info tone, never amber:
                diverging is legal; one action aligns if that's the intent. */}
            {cadenceDiffers && sharedExistingCadence && (
              <div
                className="flex items-center justify-between gap-3 rounded-md flex-wrap"
                style={{ padding: '8px 12px', background: 'var(--insight-severity-info-bg)' }}
              >
                <p className="text-xs min-w-0" style={{ color: 'var(--insight-severity-info-fg)' }}>
                  Existing surveys for these students remind {REMINDER_FREQUENCY_LABELS[sharedExistingCadence.frequency].toLowerCase()}.
                </p>
                <Button
                  variant="outline"
                  size="xs"
                  className="shrink-0 bg-transparent"
                  onClick={() => {
                    onReminderFrequencyChange(sharedExistingCadence.frequency)
                    onReminderAnchorChange(sharedExistingCadence.anchor)
                    setReminderStartDays(sharedExistingCadence.startDaysBefore)
                  }}
                >
                  Match existing cadence
                </Button>
              </div>
            )}

            {/* Anchor date */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5" style={{ maxWidth: 300 }}>
                <p className="text-sm font-medium">Anchor date</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>The reference point the cadence is calculated from.</p>
              </div>
              <Select value={reminderAnchor} onValueChange={v => onReminderAnchorChange(v as ReminderAnchor)}>
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
        <div className="flex items-center gap-3">
          {/* Save as draft moved to the shared WizardNav endSlot
              (2026-08-12) — one position across all steps instead of this
              footer. */}
          <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
            Continue
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
          </Button>
        </div>
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
