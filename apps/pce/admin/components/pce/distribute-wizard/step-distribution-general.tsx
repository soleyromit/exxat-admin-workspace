'use client'

import { useState } from 'react'
import {
  Button, Badge,
  Input, InputGroup, InputGroupAddon,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { ExxatPrismSheet, type PrismRecipient } from './exxat-prism-sheet'
import { EmailListSheet, type EmailContact } from './email-list-sheet'
import { EmailTemplateSheet } from './email-template-sheet'

interface StepDistributionGeneralProps {
  onBack: () => void
  onNext: () => void
}

const MOCK_LINK = 'https://survey.exxat.com/s/b9xkp4mr'

const DEFAULT_SUBJECT = 'You have been assigned a survey'
const DEFAULT_BODY = `Dear {{firstName}} {{lastName}},

You have been assigned a new survey titled {{surveyName}} by {{assignedBy}}

Your feedback is important and helps us improve our processes.

Please take a few minutes to complete the survey using the link below:
{{surveyLink}}

Thank you for your time and participation!

Best Regards!`

export function StepDistributionGeneral({ onBack, onNext }: StepDistributionGeneralProps) {
  const [prismOpen, setPrismOpen]         = useState(false)
  const [emailListOpen, setEmailListOpen] = useState(false)
  const [templateOpen, setTemplateOpen]   = useState(false)

  const [prismRecipients, setPrismRecipients] = useState<PrismRecipient[]>([])
  const [emailContacts, setEmailContacts]     = useState<EmailContact[]>([])
  const [anonymousGenerated, setAnonymousGenerated] = useState(false)
  const [linkCopied, setLinkCopied]           = useState(false)

  const [emailSubject, setEmailSubject]   = useState(DEFAULT_SUBJECT)
  const [emailBody, setEmailBody]         = useState(DEFAULT_BODY)
  const [senderName, setSenderName]       = useState('Exxat Surveys')

  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  function handleCopyLink() {
    navigator.clipboard.writeText(MOCK_LINK).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // Unified recipient list
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
      : []
    ),
  ]

  const filteredRecipients = allRecipients.filter(r => {
    const matchesType   = typeFilter === 'all' || r.source === typeFilter
    const q             = search.toLowerCase()
    const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 960 }}>

      {/* Step header + email template CTA */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Select Recipients</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Choose how to distribute your survey
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => setTemplateOpen(true)}>
          <i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 12 }} />
          Select Email Template
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4" style={{ minHeight: 440 }}>

        {/* Left — channel cards */}
        <div className="flex flex-col gap-3 shrink-0" style={{ width: 340 }}>

          {/* Via Exxat Prism */}
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

          {/* Additional Email */}
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

          {/* Anonymous Link */}
          <ChannelCard
            icon={<i className="fa-light fa-globe" aria-hidden="true" style={{ fontSize: 16, color: 'var(--muted-foreground)' }} />}
            iconBg="var(--muted)"
            title="Anonymous Link"
            description="Distribute an open link via email or social platforms."
          >
            {anonymousGenerated ? (
              <div
                className="flex items-center gap-2 rounded-md"
                style={{ padding: '6px 10px', background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <code
                  className="text-xs flex-1 truncate"
                  style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
                >
                  {MOCK_LINK}
                </code>
                <Button variant="ghost" size="icon-sm" onClick={handleCopyLink} aria-label="Copy public link">
                  <i
                    className={`fa-light fa-${linkCopied ? 'check' : 'copy'}`}
                    aria-hidden="true"
                    style={{ fontSize: 12, color: linkCopied ? 'var(--chart-2)' : undefined }}
                  />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setAnonymousGenerated(true)}
              >
                Generate Public Link
              </Button>
            )}
          </ChannelCard>
        </div>

        {/* Right — selected recipients panel */}
        {/* overflow-hidden safe — floating uses Radix Portal */}
        <div
          className="flex flex-col flex-1 rounded-xl border border-border overflow-hidden"
          style={{ background: 'var(--card)' }}
        >
          {/* Panel title */}
          <div
            className="flex items-center shrink-0 border-b border-border"
            style={{ padding: '11px 14px' }}
          >
            <p className="text-sm font-semibold flex-1">
              Selected Recipients ({allRecipients.length})
            </p>
          </div>

          {/* Search + type filter */}
          <div
            className="flex items-center gap-2 shrink-0 border-b border-border"
            style={{ padding: '9px 14px' }}
          >
            <InputGroup className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search recipients"
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger style={{ width: 130, height: 34, fontSize: 13 }} aria-label="Filter by type">
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
                <i
                  className="fa-light fa-inbox text-4xl"
                  aria-hidden="true"
                  style={{ color: 'var(--muted-foreground)' }}
                />
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
                    style={{
                      padding: '9px 14px',
                      borderBottom: i < filteredRecipients.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full text-xs font-semibold"
                      style={{ width: 28, height: 28, background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    >
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {r.source === 'anonymous' ? r.email : r.email}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded shrink-0"
                      style={{ fontSize: 11, paddingInline: 6, paddingBlock: 2 }}
                    >
                      {r.source === 'prism' ? 'Prism' : r.source === 'email' ? 'Email' : 'Link'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wizard nav */}
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

      {/* Sheets */}
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
      <EmailTemplateSheet
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        subject={emailSubject}
        body={emailBody}
        senderName={senderName}
        onSave={(s, b, sender) => { setEmailSubject(s); setEmailBody(b); setSenderName(sender); setTemplateOpen(false) }}
      />
    </div>
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
    <div
      className="flex flex-col gap-3 rounded-xl border border-border"
      style={{ padding: 16, background: 'var(--card)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 flex items-center justify-center rounded-lg"
          style={{ width: 40, height: 40, background: iconBg, flexShrink: 0 }}
        >
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
