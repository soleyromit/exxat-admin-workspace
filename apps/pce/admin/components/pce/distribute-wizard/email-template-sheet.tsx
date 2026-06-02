'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Button, Checkbox,
  Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Textarea,
} from '@exxatdesignux/ui'

const TEMPLATES = [
  { id: 'standard', label: 'Standard Template' },
  { id: 'reminder', label: 'Reminder Template' },
  { id: 'followup', label: 'Follow-up Template' },
]

const DEFAULT_SUBJECT = 'You have been assigned a survey'
const DEFAULT_BODY = `Dear {{firstName}} {{lastName}},

You have been assigned a new survey titled {{surveyName}} by {{assignedBy}}

Your feedback is important and helps us improve our processes.

Please take a few minutes to complete the survey using the link below:
{{surveyLink}}

Thank you for your time and participation!

Best Regards!`

const MERGE_FIELDS = [
  { label: 'First Name',          variable: '{{firstName}}' },
  { label: 'Last Name',           variable: '{{lastName}}' },
  { label: 'Survey Name',         variable: '{{surveyName}}' },
  { label: 'Survey Closing Date', variable: '{{surveyClosingDate}}' },
  { label: 'Survey Link',         variable: '{{surveyLink}}' },
  { label: 'Assigned By',         variable: '{{assignedBy}}' },
]

interface EmailTemplateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  body: string
  senderName: string
  onSave: (subject: string, body: string, senderName: string) => void
}

export function EmailTemplateSheet({ open, onOpenChange, subject, body, senderName, onSave }: EmailTemplateSheetProps) {
  const [templateId, setTemplateId] = useState('standard')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [draftSubject, setDraftSubject] = useState(subject || DEFAULT_SUBJECT)
  const [draftBody, setDraftBody] = useState(body || DEFAULT_BODY)
  const [draftSenderName, setDraftSenderName] = useState(senderName || 'Exxat Surveys')
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [testEmailSent, setTestEmailSent] = useState(false)
  const [testEmailOpen, setTestEmailOpen] = useState(false)

  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef    = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setDraftSubject(subject || DEFAULT_SUBJECT)
      setDraftBody(body || DEFAULT_BODY)
      setDraftSenderName(senderName || 'Exxat Surveys')
      setTestEmailOpen(false)
      setTestEmailSent(false)
    }
  }, [open])

  function handleSendTestEmail() {
    if (!testEmailAddress.trim()) return
    setTestEmailSent(true)
    setTestEmailAddress('')
    setTimeout(() => setTestEmailSent(false), 3000)
  }

  function insertMergeField(variable: string) {
    const activeEl = document.activeElement
    if (subjectRef.current && activeEl === subjectRef.current) {
      const el = subjectRef.current
      const start = el.selectionStart ?? draftSubject.length
      const end   = el.selectionEnd ?? start
      const next  = draftSubject.slice(0, start) + variable + draftSubject.slice(end)
      setDraftSubject(next)
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length) }, 0)
    } else {
      const el = bodyRef.current
      if (!el) return
      const start = el.selectionStart ?? draftBody.length
      const end   = el.selectionEnd ?? start
      const next  = draftBody.slice(0, start) + variable + draftBody.slice(end)
      setDraftBody(next)
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length) }, 0)
    }
  }

  function handleTemplateChange(id: string) {
    setTemplateId(id)
    setDraftSubject(DEFAULT_SUBJECT)
    setDraftBody(DEFAULT_BODY)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-5xl">

        {/* Header */}
        <SheetHeader className="flex flex-row items-center gap-3 shrink-0 border-b border-border" style={{ padding: '14px 20px' }}>
          <SheetTitle className="flex-1 text-base font-semibold">Email Template</SheetTitle>
          <Button variant="default" size="sm" onClick={() => onSave(draftSubject, draftBody, draftSenderName)}>
            Save template
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-auto flex flex-col gap-5" style={{ padding: '20px 24px' }}>

          {/* Template selector */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Select Template</p>
            <Select value={templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger aria-label="Select email template" style={{ height: 38, fontSize: 14 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Set as default */}
          <label
            className="flex items-center gap-3 cursor-pointer rounded-xl"
            style={{ padding: '10px 14px', background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Checkbox
              checked={setAsDefault}
              onCheckedChange={v => setSetAsDefault(!!v)}
              aria-label="Set as default template"
            />
            <span className="text-sm font-medium">Set as default template</span>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              This template will be used by default for all new surveys.
            </span>
          </label>

          {/* Sender name + Test email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-semibold">From Name</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Display name recipients see in their inbox.
              </p>
              <Input
                value={draftSenderName}
                onChange={e => setDraftSenderName(e.target.value)}
                placeholder="e.g. Exxat Surveys"
                aria-label="Sender display name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Test Email</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Preview how this email looks in an inbox.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTestEmailOpen(v => !v)}>
                  <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 11 }} />
                  Send test
                </Button>
              </div>
              {testEmailOpen && (
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
              )}
              {testEmailSent && (
                <p className="text-xs" style={{ color: 'var(--chart-2)' }}>
                  <i className="fa-light fa-circle-check mr-1" aria-hidden="true" />
                  Test email sent.
                </p>
              )}
            </div>
          </div>

          {/* Subject line */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">Subject Line</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Appears in recipients' inboxes. Merge fields supported.
              </p>
            </div>
            <Input
              ref={subjectRef}
              value={draftSubject}
              onChange={e => setDraftSubject(e.target.value)}
              placeholder="Subject line"
              aria-label="Email subject line"
            />
          </div>

          {/* Merge fields */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">Merge Fields</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Click a field to insert at your cursor position.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {MERGE_FIELDS.map(f => (
                <Button
                  key={f.variable}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => insertMergeField(f.variable)}
                >
                  <i className="fa-solid fa-at text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Compose + Preview */}
          <div className="grid grid-cols-2 gap-5">

            {/* Compose */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Compose</p>
              <Textarea
                ref={bodyRef}
                value={draftBody}
                onChange={e => setDraftBody(e.target.value)}
                rows={16}
                className="text-sm resize-none"
                style={{ lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}
                aria-label="Email body"
              />
            </div>

            {/* Preview */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Preview</p>
              {/* overflow-hidden safe — floating uses Radix Portal */}
              <div
                className="flex-1 rounded-md border border-border overflow-hidden"
                style={{ background: 'var(--background)', minHeight: 340 }}
              >
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    From: <span className="font-medium" style={{ color: 'var(--foreground)' }}>{draftSenderName || '—'}</span>
                  </p>
                  <p className="text-sm font-semibold mt-1">{draftSubject || '—'}</p>
                </div>
                <div className="text-sm" style={{ padding: '14px', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--foreground)' }}>
                  {draftBody}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
