'use client'

import { useState } from 'react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Checkbox,
  DatePickerField,
  Input,
  InputGroup,
  InputGroupAddon,
  LocalBanner,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Textarea,
} from '@exxatdesignux/ui'
import {
  MOCK_FACULTY,
  MOCK_COURSE_ENROLLMENTS,
  MOCK_MASTER_COURSES,
  type CourseOffering,
} from '@/lib/pce-mock-data'
import { CourseManagementDialog } from '@/components/pce/course-management-dialog'
import { ExxatPrismSheet, type PrismRecipient } from './exxat-prism-sheet'
import { EmailListSheet, type EmailContact } from './email-list-sheet'

const MOCK_LINK = 'https://survey.exxat.com/s/b9xkp4mr'

interface StepCommunicationProps {
  selectedOfferings: CourseOffering[]
  openDate: Date | undefined
  closeDate: Date | undefined
  releaseDate: Date | undefined
  senderName: string
  emailSubject: string
  emailBody: string
  reminderEnabled: boolean
  reminderDaysBefore: number
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
  onReleaseDateChange: (d: Date | undefined) => void
  onSenderNameChange: (v: string) => void
  onEmailSubjectChange: (v: string) => void
  onEmailBodyChange: (v: string) => void
  onReminderEnabledChange: (v: boolean) => void
  onReminderDaysChange: (v: number) => void
  onBack: () => void
  onNext: () => void
}

const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7, 14]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
      {children}
    </p>
  )
}

function ChannelCard({
  icon, iconBg, title, description, children,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border" style={{ padding: 16, background: 'var(--card)' }}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, background: iconBg }}>
          {icon}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function StepCommunication({
  selectedOfferings,
  openDate,
  closeDate,
  releaseDate,
  senderName,
  emailSubject,
  emailBody,
  reminderEnabled,
  reminderDaysBefore,
  onOpenDateChange,
  onCloseDateChange,
  onReleaseDateChange,
  onSenderNameChange,
  onEmailSubjectChange,
  onEmailBodyChange,
  onReminderEnabledChange,
  onReminderDaysChange,
  onBack,
  onNext,
}: StepCommunicationProps) {
  // ── Recipient state ───────────────────────────────────────────────────────
  const [prismRecipients, setPrismRecipients] = useState<PrismRecipient[]>([])
  const [emailContacts, setEmailContacts] = useState<EmailContact[]>([])
  const [anonymousGenerated, setAnonymousGenerated] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [prismOpen, setPrismOpen] = useState(false)
  const [emailListOpen, setEmailListOpen] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all')

  // ── Course manage state ───────────────────────────────────────────────────
  const [manageOffering, setManageOffering] = useState<CourseOffering | null>(null)
  const [manageOpen, setManageOpen] = useState(false)

  // ── Communication state ───────────────────────────────────────────────────
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [testEmailSent, setTestEmailSent] = useState(false)
  const [testEmailOpen, setTestEmailOpen] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateOrderError =
    openDate && closeDate && closeDate <= openDate
      ? 'Close date must be after open date.'
      : null
  const releaseDateError =
    releaseDate && closeDate && releaseDate < closeDate
      ? 'Result release date must be on or after the close date.'
      : null
  const openInPast = openDate && openDate < today
  const canContinue = !dateOrderError && !releaseDateError

  function handleSendTestEmail() {
    if (!testEmailAddress.trim()) return
    setTestEmailSent(true)
    setTestEmailAddress('')
    setTimeout(() => setTestEmailSent(false), 3000)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(MOCK_LINK).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // ── Derived recipient list ────────────────────────────────────────────────
  const allRecipients = [
    ...prismRecipients,
    ...emailContacts.map(c => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      source: 'email' as const,
      subtitle: 'External email',
    })),
    ...(anonymousGenerated
      ? [{ id: '__anon__', name: 'Anonymous Link', email: MOCK_LINK, source: 'anonymous' as const, subtitle: 'Public link' }]
      : []),
  ]

  const filteredRecipients = allRecipients.filter(r => {
    const matchesType = recipientTypeFilter === 'all' || r.source === recipientTypeFilter
    const q = recipientSearch.toLowerCase()
    return matchesType && (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
  })

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Communication</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Set recipients, survey window, and configure invitation emails.
        </p>
      </div>

      {/* Banners */}
      {dateOrderError && <LocalBanner variant="error">{dateOrderError}</LocalBanner>}
      {releaseDateError && <LocalBanner variant="error">{releaseDateError}</LocalBanner>}
      {openInPast && !dateOrderError && (
        <LocalBanner variant="warning">
          The open date is in the past. Students will receive an invitation immediately upon push.
        </LocalBanner>
      )}

      {/* ── Recipients ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Recipients ({allRecipients.length})</SectionLabel>
        <div className="flex gap-4" style={{ minHeight: 380 }}>

          {/* Left — channel cards */}
          <div className="flex flex-col gap-3 shrink-0" style={{ width: 300 }}>
            <ChannelCard
              icon={<i className="fa-light fa-users" aria-hidden="true" style={{ fontSize: 16, color: 'var(--brand-color)' }} />}
              iconBg="var(--brand-tint)"
              title="Via Exxat Prism"
              description="Distribute to Exxat Prism users with advanced filtering options."
            >
              <Button variant="outline" size="sm" className="w-full" onClick={() => setPrismOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                {prismRecipients.length > 0
                  ? `${prismRecipients.length} recipient${prismRecipients.length !== 1 ? 's' : ''} selected`
                  : 'Select Recipients'}
              </Button>
            </ChannelCard>

            <ChannelCard
              icon={<i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 16, color: 'var(--muted-foreground)' }} />}
              iconBg="var(--muted)"
              title="Additional Email"
              description="Distribute survey invitations to external email addresses."
            >
              <Button variant="outline" size="sm" className="w-full" onClick={() => setEmailListOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                {emailContacts.length > 0
                  ? `${emailContacts.length} contact${emailContacts.length !== 1 ? 's' : ''} added`
                  : 'Add Recipients'}
              </Button>
            </ChannelCard>

            <ChannelCard
              icon={<i className="fa-light fa-globe" aria-hidden="true" style={{ fontSize: 16, color: 'var(--muted-foreground)' }} />}
              iconBg="var(--muted)"
              title="Anonymous Link"
              description="Distribute an open link via email or social platforms."
            >
              {anonymousGenerated ? (
                <div className="flex items-center gap-2 rounded-md" style={{ padding: '6px 10px', background: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <code className="text-xs flex-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {MOCK_LINK}
                  </code>
                  <Button variant="ghost" size="icon-sm" onClick={handleCopyLink} aria-label="Copy public link">
                    <i className={`fa-light fa-${linkCopied ? 'check' : 'copy'}`} aria-hidden="true" style={{ fontSize: 12, color: linkCopied ? 'var(--chart-2)' : undefined }} />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setAnonymousGenerated(true)}>
                  Generate Public Link
                </Button>
              )}
            </ChannelCard>
          </div>

          {/* Right — selected recipients panel */}
          <div className="flex flex-col flex-1 rounded-xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
            <div className="flex items-center shrink-0 border-b border-border" style={{ padding: '11px 14px' }}>
              <p className="text-sm font-semibold flex-1">
                Selected Recipients ({allRecipients.length})
              </p>
            </div>

            {/* Search + type filter */}
            <div className="flex items-center gap-2 shrink-0 border-b border-border" style={{ padding: '9px 14px' }}>
              <InputGroup className="flex-1">
                <Input
                  placeholder="Search by name or email…"
                  value={recipientSearch}
                  onChange={e => setRecipientSearch(e.target.value)}
                  aria-label="Search recipients"
                  className="text-sm"
                />
                <InputGroupAddon align="inline-end">
                  <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
                </InputGroupAddon>
              </InputGroup>
              <Select value={recipientTypeFilter} onValueChange={setRecipientTypeFilter}>
                <SelectTrigger style={{ width: 140, height: 34, fontSize: 13 }} aria-label="Filter by type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="prism">Prism Users</SelectItem>
                  <SelectItem value="email">Email Recipients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
              {filteredRecipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center h-full">
                  <i className="fa-light fa-inbox text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">No recipients added yet</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)', maxWidth: 240 }}>
                      Add recipients using any of the options on the left.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredRecipients.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3"
                      style={{ padding: '9px 14px', borderBottom: i < filteredRecipients.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                        <AvatarFallback style={{ fontSize: 11, fontWeight: 600, backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                          {r.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{r.email}</p>
                      </div>
                      <Badge variant="secondary" className="rounded shrink-0" style={{ fontSize: 11, paddingInline: 6, paddingBlock: 2 }}>
                        {r.source === 'prism' ? 'Prism' : r.source === 'email' ? 'Email' : 'Link'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* ── Survey window ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3" style={{ maxWidth: 600 }}>
        <SectionLabel>Survey window</SectionLabel>
        <div className="flex flex-col gap-4 rounded-xl border border-border" style={{ padding: 16, background: 'var(--card)' }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Opens on <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <DatePickerField value={openDate} onChange={onOpenDateChange} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Closes on <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <DatePickerField value={closeDate} onChange={onCloseDateChange} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5" style={{ maxWidth: '50%' }}>
            <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Results released on <span className="font-normal">(optional)</span>
            </label>
            <DatePickerField value={releaseDate} onChange={onReleaseDateChange} />
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              When results become visible to instructors. Defaults to immediately after close.
            </p>
          </div>
        </div>
      </div>

      {/* ── Courses ───────────────────────────────────────────────────────── */}
      {selectedOfferings.length > 0 && (
        <div className="flex flex-col gap-3" style={{ maxWidth: 600 }}>
          <SectionLabel>Courses ({selectedOfferings.length})</SectionLabel>
          <div className="flex flex-col rounded-xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {selectedOfferings.map((offering, i) => {
                const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
                const isLast = i === selectedOfferings.length - 1
                return (
                  <div
                    key={offering.id}
                    className="flex items-center gap-3"
                    style={{ padding: '10px 12px', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
                  >
                    <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                      <AvatarFallback style={{ fontSize: 12, fontWeight: 600, backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                        {faculty?.initials ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>{course?.code}</span>
                        <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>{course?.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {faculty ? faculty.name : <span style={{ color: 'var(--chart-4)' }}>Unassigned</span>}
                        {' '}· {offering.enrolledCount} enrolled
                      </span>
                    </div>
                    {MOCK_COURSE_ENROLLMENTS[offering.id] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setManageOffering(offering); setManageOpen(true) }}
                        aria-label={`Manage dates for ${course?.code}`}
                      >
                        <i className="fa-light fa-sliders" aria-hidden="true" style={{ fontSize: 12 }} />
                        Manage
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border" />

      {/* ── Invitation email ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3" style={{ maxWidth: 600 }}>
        <div className="flex items-center justify-between gap-3">
          <SectionLabel>Invitation email</SectionLabel>
          <Button variant="outline" size="sm" onClick={() => setTestEmailOpen(v => !v)}>
            <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 11 }} />
            Send test email
          </Button>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Sent to enrolled students on the survey open date.
        </p>

        {testEmailOpen && (
          <div className="flex flex-col gap-2 rounded-lg border border-border" style={{ padding: '12px 14px', background: 'var(--muted)' }}>
            <p className="text-xs font-semibold">Send a test email</p>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendTestEmail() }}
                className="flex-1"
                aria-label="Test email address"
              />
              <Button variant="default" size="sm" disabled={!testEmailAddress.trim()} onClick={handleSendTestEmail}>
                Send
              </Button>
            </div>
            {testEmailSent && (
              <p className="text-xs" style={{ color: 'var(--chart-2)' }}>
                <i className="fa-light fa-circle-check mr-1" aria-hidden="true" />
                Test email sent.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sender-name" className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            From name
          </label>
          <Input
            id="sender-name"
            type="text"
            value={senderName}
            onChange={e => onSenderNameChange(e.target.value)}
            placeholder="e.g. Exxat Surveys"
            aria-label="Sender display name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-subject" className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Subject line
          </label>
          <Input
            id="email-subject"
            type="text"
            value={emailSubject}
            onChange={e => onEmailSubjectChange(e.target.value)}
            aria-label="Email subject line"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-body" className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Body{' '}
            <span style={{ fontWeight: 400 }}>
              (<code className="rounded px-1" style={{ background: 'var(--muted)', fontSize: 12, color: 'var(--muted-foreground)' }}>{'{{variables}}'}</code> supported)
            </span>
          </label>
          <Textarea
            id="email-body"
            value={emailBody}
            onChange={e => onEmailBodyChange(e.target.value)}
            rows={7}
            className="text-sm font-mono resize-y"
            style={{ lineHeight: 1.6 }}
            aria-label="Email body"
          />
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Available variables:{' '}
            {['{{student_first_name}}', '{{course_name}}', '{{close_date}}', '{{survey_link}}'].map((v, i) => (
              <span key={v}>
                {i > 0 && ', '}
                <code className="rounded px-1" style={{ background: 'var(--muted)', fontSize: 12, color: 'var(--muted-foreground)' }}>{v}</code>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* ── Reminder email ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3" style={{ maxWidth: 600 }}>
        <SectionLabel>Reminder email</SectionLabel>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={reminderEnabled} onCheckedChange={v => onReminderEnabledChange(!!v)} aria-label="Enable reminder email" />
          <span className="text-sm">Enable reminder</span>
        </label>
        {reminderEnabled && (
          <div className="flex items-center gap-2 flex-wrap rounded-lg" style={{ padding: '10px 14px', background: 'var(--muted)', border: '1px solid var(--border)' }}>
            <span className="text-sm">Send reminder</span>
            <div style={{ width: 80 }}>
              <Select value={String(reminderDaysBefore)} onValueChange={v => onReminderDaysChange(Number(v))}>
                <SelectTrigger aria-label="Reminder days before close" style={{ height: 32, fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_DAY_OPTIONS.map(d => (
                    <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm">day{reminderDaysBefore !== 1 ? 's' : ''} before close</span>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>to non-respondents only.</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between" style={{ maxWidth: 600 }}>
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

      <CourseManagementDialog
        offering={manageOffering}
        open={manageOpen}
        onOpenChange={setManageOpen}
        globalOpenDate={openDate}
        globalCloseDate={closeDate}
        onApplyDatesToAll={(open, close) => { onOpenDateChange(open); onCloseDateChange(close) }}
      />

      <ExxatPrismSheet
        open={prismOpen}
        onOpenChange={setPrismOpen}
        selectedIds={new Set(prismRecipients.map(r => r.id))}
        onCommit={recipients => { setPrismRecipients(recipients); setPrismOpen(false) }}
      />

      <EmailListSheet
        open={emailListOpen}
        onOpenChange={setEmailListOpen}
        contacts={emailContacts}
        onCommit={contacts => { setEmailContacts(contacts); setEmailListOpen(false) }}
      />
    </div>
  )
}
