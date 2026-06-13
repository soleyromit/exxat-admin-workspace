'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  RadioGroup,
  RadioGroupItem,
  Textarea,
} from '@exxatdesignux/ui'
import { EmailTemplateSheet } from '../distribute-wizard/email-template-sheet'

export type ReminderDays = 0 | 3 | 7

interface StepEmailProps {
  termEndDate: string
  termName: string
  senderName: string
  emailSubject: string
  emailBody: string
  reminderDays: ReminderDays
  onSenderNameChange: (v: string) => void
  onEmailSubjectChange: (v: string) => void
  onEmailBodyChange: (v: string) => void
  onReminderDaysChange: (v: ReminderDays) => void
  onBack: () => void
  onNext: () => void
}

function reminderLabel(days: ReminderDays, termEndDate: string, termName: string) {
  if (days === 0) return null
  const end = new Date(termEndDate + 'T00:00:00')
  const d = new Date(end.getTime() - days * 86400_000)
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${label} · ${days} days before ${termName} ends`
}

export function StepEmail({
  termEndDate,
  termName,
  senderName,
  emailSubject,
  emailBody,
  reminderDays,
  onSenderNameChange,
  onEmailSubjectChange,
  onEmailBodyChange,
  onReminderDaysChange,
  onBack,
  onNext,
}: StepEmailProps) {
  const [templateOpen, setTemplateOpen] = useState(false)

  const r3label = reminderLabel(3, termEndDate, termName)
  const r7label = reminderLabel(7, termEndDate, termName)

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 560 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Review email &amp; reminders
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Students receive one invitation when the survey opens. Reminders anchor to the term end date.
        </p>
      </div>

      {/* Invitation email */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Invitation email</p>

        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-border"
          style={{ padding: '12px 16px', background: 'var(--card)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="shrink-0 flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: 'var(--muted)' }}
            >
              <i className="fa-light fa-envelope-open-text" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-semibold truncate">
                {emailSubject || 'Your course evaluation is now open'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                Sent on survey open date · From: {senderName || 'Exxat Surveys'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setTemplateOpen(true)}>
            Edit
          </Button>
        </div>
      </div>

      {/* Reminders */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Reminder</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Sent to non-respondents. Anchored to {termName} end date — not survey close.
          </p>
        </div>

        <RadioGroup
          value={String(reminderDays)}
          onValueChange={v => onReminderDaysChange(Number(v) as ReminderDays)}
          className="flex flex-col gap-2"
          aria-label="Reminder schedule"
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <RadioGroupItem value="0" id="reminder-none" />
            <span className="text-sm">No reminder</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <RadioGroupItem value="3" id="reminder-3" />
            <div className="flex flex-col gap-0">
              <span className="text-sm">3 days before term end</span>
              {r3label && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r3label}</span>}
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <RadioGroupItem value="7" id="reminder-7" />
            <div className="flex flex-col gap-0">
              <span className="text-sm">7 days before term end</span>
              {r7label && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r7label}</span>}
            </div>
          </label>
        </RadioGroup>
      </div>

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

      <EmailTemplateSheet
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        subject={emailSubject}
        body={emailBody}
        senderName={senderName}
        onSave={(subject, body, sender) => {
          onEmailSubjectChange(subject)
          onEmailBodyChange(body)
          onSenderNameChange(sender)
          setTemplateOpen(false)
        }}
      />
    </div>
  )
}
