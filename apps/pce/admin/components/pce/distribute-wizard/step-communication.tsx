'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  DatePickerField,
  FieldLegend,
  Input,
  LocalBanner,
} from '@exxatdesignux/ui'
import type { CourseOffering } from '@/lib/pce-mock-data'
import { MOCK_COURSE_ENROLLMENTS, MOCK_STUDENTS } from '@/lib/pce-mock-data'
import { ExxatPrismSheet, type PrismRecipient } from './exxat-prism-sheet'
import { EmailTemplateSheet } from './email-template-sheet'

const MOCK_LINK = 'https://survey.exxat.com/s/b9xkp4mr'
const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7, 14]

export type Reminder = { id: string; daysBefore: number }
type EmailContact = { id: string; firstName: string; lastName: string; email: string }

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
  emailSubject: string
  emailBody: string
  reminders: Reminder[]
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
  onReleaseDateChange: (d: Date | undefined) => void
  onSenderNameChange: (v: string) => void
  onEmailSubjectChange: (v: string) => void
  onEmailBodyChange: (v: string) => void
  onRemindersChange: (v: Reminder[]) => void
  onBack: () => void
  onNext: () => void
}

export function StepCommunication({
  selectedOfferings,
  openDate, closeDate, releaseDate,
  senderName, emailSubject, emailBody, reminders,
  onOpenDateChange, onCloseDateChange, onReleaseDateChange,
  onSenderNameChange, onEmailSubjectChange, onEmailBodyChange,
  onRemindersChange, onBack, onNext,
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

  // ── Email contact state ───────────────────────────────────────────────────
  const [emailContacts, setEmailContacts] = useState<EmailContact[]>([
    { id: 'ec-1', firstName: 'Morgan', lastName: 'Webb', email: 'mwebb@northgeneral.org' },
    { id: 'ec-2', firstName: 'Prince', lastName: 'Osei', email: 'p.osei@clinicalsites.edu' },
    { id: 'ec-3', firstName: 'Jamie', lastName: 'Torres', email: 'jt@riverdale-medical.com' },
  ])
  const [addingContact, setAddingContact] = useState(false)
  const [draftFirst, setDraftFirst] = useState('')
  const [draftLast, setDraftLast] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const firstNameRef = useRef<HTMLInputElement>(null)

  function handleAddContact() {
    const email = draftEmail.trim().toLowerCase()
    if (!email.includes('@') || !email.includes('.')) return
    if (!emailContacts.some(c => c.email === email)) {
      setEmailContacts(prev => [...prev, {
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
  const [anonymousGenerated, setAnonymousGenerated] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [prismOpen, setPrismOpen] = useState(false)
  const [emailTemplateOpen, setEmailTemplateOpen] = useState(false)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dateOrderError   = openDate && closeDate && closeDate <= openDate ? 'Close date must be after open date.' : null
  const releaseDateError = releaseDate && closeDate && releaseDate < closeDate ? 'Result release date must be on or after the close date.' : null
  const openInPast       = openDate && openDate < today
  const canContinue      = !dateOrderError && !releaseDateError

  function handleCopyLink() {
    navigator.clipboard.writeText(MOCK_LINK).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const totalRecipientCount = prismRecipients.length + emailContacts.length + (anonymousGenerated ? 1 : 0)
  const sectionPad: React.CSSProperties = { padding: '14px 16px' }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Communication</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Set recipients, survey window, and configure invitation emails.
        </p>
      </div>

      {dateOrderError   && <LocalBanner variant="error">{dateOrderError}</LocalBanner>}
      {releaseDateError && <LocalBanner variant="error">{releaseDateError}</LocalBanner>}
      {openInPast && !dateOrderError && (
        <LocalBanner variant="warning">
          The open date is in the past. Students will receive an invitation immediately upon push.
        </LocalBanner>
      )}

      {/* ── Recipients ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <FieldLegend variant="label">Recipients ({totalRecipientCount})</FieldLegend>

        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex flex-col p-0">

          {/* Prism */}
          <div style={{ ...sectionPad, borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="shrink-0" style={{ width: 32, height: 32 }}>
                <PrismIconMark size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Via Exxat Prism</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{prismDescription}</p>
              </div>
              {prismRecipients.length > 0 ? (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPrismOpen(true)}>Edit</Button>
              ) : (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPrismOpen(true)}>
                  <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                  Select
                </Button>
              )}
            </div>
          </div>

          {/* Additional Email */}
          <div style={{ ...sectionPad, borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--muted)' }}>
                <i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Additional Email</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {emailContacts.length > 0
                    ? `${emailContacts.length} external contact${emailContacts.length !== 1 ? 's' : ''}`
                    : 'Invite external recipients by email.'}
                </p>
              </div>
              {!addingContact && (
                <Button
                  type="button" variant="outline" size="sm" className="shrink-0"
                  onClick={() => { setAddingContact(true); setTimeout(() => firstNameRef.current?.focus(), 10) }}
                >
                  <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                  Add
                </Button>
              )}
            </div>

            {emailContacts.length > 0 && (
              <div className="flex flex-wrap gap-1.5" style={{ marginTop: 10 }}>
                {emailContacts.map(c => (
                  <EmailChip key={c.id} contact={c} onRemove={() => setEmailContacts(prev => prev.filter(x => x.id !== c.id))} />
                ))}
              </div>
            )}

            {addingContact && (
              <div
                className="grid items-center gap-1.5"
                style={{ marginTop: 10, gridTemplateColumns: '1fr 1fr 2fr auto auto' }}
                onKeyDown={handleContactFormKeyDown}
              >
                <Input
                  ref={firstNameRef}
                  type="text"
                  placeholder="First name"
                  value={draftFirst}
                  onChange={e => setDraftFirst(e.target.value)}
                  className="min-w-0"
                  aria-label="First name"
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={draftLast}
                  onChange={e => setDraftLast(e.target.value)}
                  className="min-w-0"
                  aria-label="Last name"
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={draftEmail}
                  onChange={e => setDraftEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddContact() } }}
                  className="min-w-0"
                  aria-label="Email address"
                />
                <Button type="button" variant="default" size="sm" disabled={!draftEmail.includes('@')} onClick={handleAddContact}>Add</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingContact(false); setDraftFirst(''); setDraftLast(''); setDraftEmail('') }}>Cancel</Button>
              </div>
            )}
          </div>

          {/* Anonymous Link */}
          <div style={sectionPad}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--muted)' }}>
                <i className="fa-light fa-globe" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Anonymous Link</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Open link for distribution via email or social.</p>
              </div>
              {anonymousGenerated ? (
                <Button variant="link" size="sm" className="text-destructive shrink-0 px-0" onClick={() => setAnonymousGenerated(false)}>Revoke</Button>
              ) : (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setAnonymousGenerated(true)}>Generate Link</Button>
              )}
            </div>

            {anonymousGenerated && (
              <div className="flex items-center gap-2" style={{ marginTop: 10, paddingLeft: 44 }}>
                <code
                  className="text-sm flex-1 rounded"
                  style={{ padding: '5px 10px', background: 'var(--muted)', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={MOCK_LINK}
                >
                  {MOCK_LINK}
                </code>
                <Button variant="ghost" size="icon" onClick={handleCopyLink} aria-label="Copy public link">
                  <i className={`fa-light fa-${linkCopied ? 'check' : 'copy'}`} aria-hidden="true" style={{ fontSize: 16 }} />
                </Button>
                <span role="status" aria-live="polite" className="text-sm font-medium" style={{ whiteSpace: 'nowrap', minWidth: 0 }}>
                  {linkCopied ? 'Copied!' : ''}
                </span>
              </div>
            )}
          </div>

          </CardContent>
        </Card>
      </div>

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
              <p className="text-sm font-medium">Results released <span className="font-normal">(optional)</span></p>
              <DatePickerField value={releaseDate} onChange={onReleaseDateChange} />
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Results release defaults to immediately after close if not set.</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Email notifications ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <FieldLegend variant="label">Email notifications</FieldLegend>

        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex flex-col p-0">
          <div className="flex items-center gap-3" style={sectionPad}>
            <div className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--muted)' }}>
              <i className="fa-light fa-envelope-open-text" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
            </div>
            <div className="flex flex-col gap-0 flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{emailSubject || 'You have been assigned a survey'}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Invitation · Sent when survey opens · From: {senderName || 'Exxat Surveys'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEmailTemplateOpen(true)}>Edit</Button>
          </div>
          </CardContent>
        </Card>

        {/* Reminder day-toggle chips */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Reminders <span className="font-normal">(to non-respondents only)</span>
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reminder days before close">
            {REMINDER_DAY_OPTIONS.map(day => {
              const active = reminders.some(r => r.daysBefore === day)
              return (
                <Button
                  key={day}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={active}
                  onClick={() => {
                    if (active) onRemindersChange(reminders.filter(r => r.daysBefore !== day))
                    else        onRemindersChange([...reminders, { id: `r-${day}`, daysBefore: day }])
                  }}
                  className="rounded-full text-xs"
                  style={{
                    padding: '5px 12px',
                    background: active ? 'var(--foreground)' : 'var(--background)',
                    borderColor: active ? 'var(--foreground)' : 'var(--border)',
                    color: active ? 'var(--background)' : 'var(--foreground)',
                  }}
                >
                  {active && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 9 }} />}
                  {day} day{day !== 1 ? 's' : ''}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

      <ExxatPrismSheet
        open={prismOpen}
        onOpenChange={setPrismOpen}
        selectedIds={new Set(prismRecipients.map(r => r.id))}
        onCommit={recipients => { setManualOverride(recipients); setPrismOpen(false) }}
      />

      <EmailTemplateSheet
        open={emailTemplateOpen}
        onOpenChange={setEmailTemplateOpen}
        subject={emailSubject}
        body={emailBody}
        senderName={senderName}
        onSave={(subject, body, sender) => {
          onEmailSubjectChange(subject); onEmailBodyChange(body); onSenderNameChange(sender)
          setEmailTemplateOpen(false)
        }}
      />
    </div>
  )
}
