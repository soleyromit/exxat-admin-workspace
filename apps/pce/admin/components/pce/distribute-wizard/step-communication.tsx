'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  DatePickerField,
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
type EmailContact = { id: string; email: string }

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

// ── Avatar stack ──────────────────────────────────────────────────────────────
function AvatarStack({ label, items }: { label: string; items: { id: string; name: string }[] }) {
  const MAX = 5
  const visible = items.slice(0, MAX)
  const overflow = items.length - MAX
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs" style={{ color: 'var(--muted-foreground)', minWidth: 88 }}>{label}</span>
      <div className="flex items-center" aria-hidden="true">
        {visible.map((item, i) => {
          const initials = item.name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
          return (
            <Avatar key={item.id} style={{ width: 26, height: 26, marginLeft: i === 0 ? 0 : -8, border: '2px solid var(--card)', position: 'relative', zIndex: MAX - i, flexShrink: 0 }}>
              <AvatarFallback className="text-xs" style={{ background: 'var(--border)', color: 'var(--foreground)' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          )
        })}
      </div>
      {overflow > 0 && (
        <span className="text-xs" style={{ color: 'var(--muted-foreground)', marginLeft: 4 }}>+{overflow} more</span>
      )}
    </div>
  )
}

// ── Email chip — used inside the tag-input area ───────────────────────────────
function EmailChip({ email, onRemove }: { email: string; onRemove: () => void }) {
  const local = email.split('@')[0] ?? ''
  const initials = local.split(/[._\-+]/).filter(Boolean).map(p => p[0]?.toUpperCase() ?? '').slice(0, 2).join('') || email[0]?.toUpperCase() || '?'
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border shrink-0"
      style={{ padding: '3px 7px 3px 4px', background: 'var(--background)' }}
      title={email}
    >
      <Avatar style={{ width: 18, height: 18, flexShrink: 0 }}>
        <AvatarFallback style={{ fontSize: 10, background: 'var(--border)', color: 'var(--foreground)' }}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs truncate" style={{ maxWidth: 160 }}>{email}</span>
      <button
        type="button"
        aria-label={`Remove ${email}`}
        onClick={onRemove}
        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: 14, height: 14, marginLeft: 2 }}
      >
        <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 9 }} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
      {children}
    </p>
  )
}

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

  // ── Email chip-input state ────────────────────────────────────────────────
  const [emailContacts, setEmailContacts] = useState<EmailContact[]>([
    { id: 'ec-1', email: 'mwebb@northgeneral.org' },
    { id: 'ec-2', email: 'p.osei@clinicalsites.edu' },
    { id: 'ec-3', email: 'jt@riverdale-medical.com' },
  ])
  const [emailDraft, setEmailDraft] = useState('')
  const emailInputRef = useRef<HTMLInputElement>(null)

  function commitEmailDraft() {
    const email = emailDraft.trim().replace(/,$/, '').toLowerCase()
    if (!email) return
    // Basic format guard — not a full RFC validator
    if (!email.includes('@') || !email.includes('.')) return
    if (!emailContacts.some(c => c.email === email)) {
      setEmailContacts(prev => [...prev, { id: `ec-${Date.now()}`, email }])
    }
    setEmailDraft('')
  }

  function handleEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitEmailDraft() }
    if (e.key === 'Backspace' && !emailDraft && emailContacts.length > 0) {
      setEmailContacts(prev => prev.slice(0, -1))
    }
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
  const rowBase: React.CSSProperties = { padding: '12px 16px' }

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
        <SectionLabel>Recipients ({totalRecipientCount})</SectionLabel>

        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex flex-col p-0">

          {/* Prism row */}
          <div className="flex flex-col" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3" style={rowBase}>
              <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32 }}>
                <PrismIconMark size={32} />
              </div>
              <div className="flex flex-col gap-0 flex-1 min-w-0">
                <p className="text-sm font-semibold">Via Exxat Prism</p>
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{prismDescription}</p>
              </div>
              {prismRecipients.length > 0 ? (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPrismOpen(true)}>Edit</Button>
              ) : (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPrismOpen(true)}>
                  <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                  Select Recipients
                </Button>
              )}
            </div>

            {prismRecipients.length > 0 && (
              <div className="flex flex-col gap-2.5" style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)' }}>
                {prismStudents.length > 0 && <AvatarStack label={`Students · ${prismStudents.length}${isAutoPopulated ? ' · auto' : ''}`} items={prismStudents} />}
                {prismFaculty.length > 0  && <AvatarStack label={`Faculty · ${prismFaculty.length}`} items={prismFaculty} />}
                {prismOther.length > 0    && <AvatarStack label={`Other · ${prismOther.length}`} items={prismOther} />}
              </div>
            )}
          </div>

          {/* Additional Email — chip tag input */}
          <div className="flex flex-col" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3" style={rowBase}>
              <div className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--muted)' }}>
                <i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
              </div>
              <div className="flex flex-col gap-0 flex-1 min-w-0">
                <p className="text-sm font-semibold">Additional Email</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {emailContacts.length > 0
                    ? `${emailContacts.length} external contact${emailContacts.length !== 1 ? 's' : ''}`
                    : 'Invite external recipients by email address.'}
                </p>
              </div>
            </div>

            {/* Tag-input area — chips + inline input in one flowing field */}
            <div
              className="flex flex-wrap items-center gap-1.5 cursor-text"
              style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--border)' }}
              onClick={() => emailInputRef.current?.focus()}
            >
              {emailContacts.map(c => (
                <EmailChip
                  key={c.id}
                  email={c.email}
                  onRemove={() => setEmailContacts(prev => prev.filter(x => x.id !== c.id))}
                />
              ))}
              <input
                ref={emailInputRef}
                type="email"
                placeholder={emailContacts.length === 0 ? 'Type an email and press Enter…' : 'Add another…'}
                value={emailDraft}
                onChange={e => setEmailDraft(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                onBlur={commitEmailDraft}
                className="outline-none bg-transparent min-w-40 flex-1 placeholder:text-muted-foreground"
                style={{ height: 28, fontSize: 13 }}
                aria-label="Add email address"
              />
            </div>
          </div>

          {/* Anonymous Link row */}
          <div className="flex items-center gap-3" style={rowBase}>
            <div className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--muted)' }}>
              <i className="fa-light fa-globe" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
            </div>
            <div className="flex flex-col gap-0 flex-1 min-w-0">
              <p className="text-sm font-semibold">Anonymous Link</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Open link for distribution via email or social.</p>
            </div>
            {anonymousGenerated ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <code className="text-xs rounded" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '2px 6px', background: 'var(--muted)', color: 'var(--muted-foreground)', display: 'block' }} title={MOCK_LINK}>
                  {MOCK_LINK}
                </code>
                <Button variant="ghost" size="icon-sm" onClick={handleCopyLink} aria-label="Copy public link">
                  <i className={`fa-light fa-${linkCopied ? 'check' : 'copy'}`} aria-hidden="true" style={{ fontSize: 12, color: linkCopied ? 'var(--chart-2)' : undefined }} />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs font-normal shrink-0" style={{ color: 'var(--destructive)' }} onClick={() => setAnonymousGenerated(false)}>Revoke</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setAnonymousGenerated(true)}>Generate Link</Button>
            )}
          </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-border" />

      {/* ── Survey window ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Survey window</SectionLabel>
        <Card className="shadow-none">
          <CardContent className="flex flex-col gap-4" style={{ padding: 16 }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Opens on <span style={{ color: 'var(--destructive)' }}>*</span></p>
              <DatePickerField value={openDate} onChange={onOpenDateChange} />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Closes on <span style={{ color: 'var(--destructive)' }}>*</span></p>
              <DatePickerField value={closeDate} onChange={onCloseDateChange} />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Results released <span className="font-normal">(optional)</span></p>
              <DatePickerField value={releaseDate} onChange={onReleaseDateChange} />
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Results release defaults to immediately after close if not set.</p>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-border" />

      {/* ── Email notifications ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Email notifications</SectionLabel>

        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex flex-col p-0">
          <div className="flex items-center gap-3" style={rowBase}>
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
          <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Reminders <span className="font-normal">(to non-respondents only)</span>
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reminder days before close">
            {REMINDER_DAY_OPTIONS.map(day => {
              const active = reminders.some(r => r.daysBefore === day)
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (active) onRemindersChange(reminders.filter(r => r.daysBefore !== day))
                    else        onRemindersChange([...reminders, { id: `r-${day}`, daysBefore: day }])
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full text-xs border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    padding: '5px 12px',
                    background: active ? 'var(--foreground)' : 'var(--background)',
                    borderColor: active ? 'var(--foreground)' : 'var(--border)',
                    color: active ? 'var(--background)' : 'var(--foreground)',
                  }}
                >
                  {active && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 9 }} />}
                  {day} day{day !== 1 ? 's' : ''}
                </button>
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
