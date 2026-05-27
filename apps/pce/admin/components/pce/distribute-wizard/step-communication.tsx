'use client'

import {
  Button,
  Checkbox,
  DatePickerField,
  LocalBanner,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Textarea,
} from '@exxat/ds/packages/ui/src'

interface StepCommunicationProps {
  openDate: Date | undefined
  closeDate: Date | undefined
  emailSubject: string
  emailBody: string
  reminderEnabled: boolean
  reminderDaysBefore: number
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
  onEmailSubjectChange: (v: string) => void
  onEmailBodyChange: (v: string) => void
  onReminderEnabledChange: (v: boolean) => void
  onReminderDaysChange: (v: number) => void
  onBack: () => void
  onPush: () => void
}

const REMINDER_DAY_OPTIONS = [1, 2, 3, 5, 7, 14]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
      {children}
    </p>
  )
}

export function StepCommunication({
  openDate,
  closeDate,
  emailSubject,
  emailBody,
  reminderEnabled,
  reminderDaysBefore,
  onOpenDateChange,
  onCloseDateChange,
  onEmailSubjectChange,
  onEmailBodyChange,
  onReminderEnabledChange,
  onReminderDaysChange,
  onBack,
  onPush,
}: StepCommunicationProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateOrderError =
    openDate && closeDate && closeDate <= openDate
      ? 'Close date must be after open date.'
      : null

  const openInPast = openDate && openDate < today
  const canContinue = !dateOrderError

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Step 4 of 4
        </p>
        <h2 className="text-lg font-semibold">Communication</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Set the survey window and configure invitation emails.
        </p>
      </div>

      {/* Date error banner */}
      {dateOrderError && (
        <LocalBanner variant="error">
          {dateOrderError}
        </LocalBanner>
      )}

      {/* Open in past warning */}
      {openInPast && !dateOrderError && (
        <LocalBanner variant="warning">
          The open date is in the past. Students will receive an invitation immediately upon push.
        </LocalBanner>
      )}

      {/* Survey window */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Survey window</SectionLabel>
        <div
          className="grid gap-4 rounded-xl border border-border"
          style={{ padding: 16, gridTemplateColumns: '1fr 1fr', background: 'var(--card)' }}
        >
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
      </div>

      <div className="border-t border-border" />

      {/* Invitation email */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Invitation email</SectionLabel>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Sent to enrolled students on the survey open date.
        </p>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email-subject"
            className="text-xs font-medium"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Subject line
          </label>
          <input
            id="email-subject"
            type="text"
            value={emailSubject}
            onChange={e => onEmailSubjectChange(e.target.value)}
            className="w-full rounded-md text-sm"
            style={{
              padding: '7px 10px',
              border: '1px solid var(--border-control-35)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
            aria-label="Email subject line"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email-body"
            className="text-xs font-medium"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Body{' '}
            <span style={{ fontWeight: 400 }}>
              (
              <code
                className="rounded px-1"
                style={{
                  background: 'var(--muted)',
                  fontSize: 12,
                  color: 'var(--muted-foreground)',
                }}
              >
                {'{{variables}}'}
              </code>{' '}
              supported)
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
            {[
              '{{student_first_name}}',
              '{{course_name}}',
              '{{close_date}}',
              '{{survey_link}}',
            ].map((v, i) => (
              <span key={v}>
                {i > 0 && ', '}
                <code
                  className="rounded px-1"
                  style={{
                    background: 'var(--muted)',
                    fontSize: 12,
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {v}
                </code>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Reminder email */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Reminder email</SectionLabel>

        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={reminderEnabled}
            onCheckedChange={v => onReminderEnabledChange(!!v)}
            aria-label="Enable reminder email"
          />
          <span className="text-sm">Enable reminder</span>
        </label>

        {reminderEnabled && (
          <div
            className="flex items-center gap-2 flex-wrap rounded-lg"
            style={{
              padding: '10px 14px',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            <span className="text-sm">Send reminder</span>
            <div style={{ width: 80 }}>
              <Select
                value={String(reminderDaysBefore)}
                onValueChange={v => onReminderDaysChange(Number(v))}
              >
                <SelectTrigger
                  aria-label="Reminder days before close"
                  style={{ height: 32, fontSize: 13 }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_DAY_OPTIONS.map(d => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm">day{reminderDaysBefore !== 1 ? 's' : ''} before close</span>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              to non-respondents only.
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={!canContinue}
          onClick={onPush}
        >
          <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
          Push surveys
        </Button>
      </div>
    </div>
  )
}
