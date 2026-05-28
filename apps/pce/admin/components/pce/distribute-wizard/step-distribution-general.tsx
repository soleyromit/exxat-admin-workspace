'use client'

import { useState } from 'react'
import {
  Button,
  Checkbox,
  Textarea,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { MOCK_STUDENTS } from '@/lib/pce-mock-data'

interface StepDistributionGeneralProps {
  onBack: () => void
  onNext: () => void
}

const MOCK_LINK = 'https://survey.exxat.com/s/b9xkp4mr'

export function StepDistributionGeneral({ onBack, onNext }: StepDistributionGeneralProps) {
  const [search, setSearch] = useState('')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [recipientEmails, setRecipientEmails] = useState('')
  const [recipientRole, setRecipientRole] = useState('alumni')
  const [anonymousLink, setAnonymousLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const q = search.toLowerCase().trim()
  const results = q
    ? MOCK_STUDENTS.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      ).slice(0, 6)
    : []

  function toggle(id: string) {
    setAddedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(MOCK_LINK).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 640 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Step 2 of 4</p>
        <h1 className="text-lg font-semibold">Distribution</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose who receives this survey. Search the program directory, invite by email, or share a public link.
        </p>
      </div>

      {/* Search program directory */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Search program directory
        </p>
        <div
          className="flex items-center gap-2 rounded-md"
          style={{ padding: '6px 10px', border: '1px solid var(--border-control-35)', background: 'var(--card)' }}
        >
          <i
            className="fa-light fa-magnifying-glass text-xs shrink-0"
            aria-hidden="true"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1"
            style={{ color: 'var(--foreground)' }}
            aria-label="Search program directory"
          />
        </div>
        {results.length > 0 && (
          <div
            className="flex flex-col rounded-xl border border-border overflow-hidden"
            style={{ background: 'var(--card)' }}
          >
            {results.map((person, i) => {
              const isAdded = addedIds.has(person.id)
              return (
                <div
                  key={person.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: '9px 14px',
                    borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{person.firstName} {person.lastName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                      {person.cohort} · {person.email}
                    </p>
                  </div>
                  <div onClick={() => toggle(person.id)} className="cursor-pointer">
                    <Checkbox
                      checked={isAdded}
                      onCheckedChange={() => toggle(person.id)}
                      aria-label={isAdded
                        ? `Remove ${person.firstName} ${person.lastName}`
                        : `Add ${person.firstName} ${person.lastName}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {addedIds.size > 0 && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {addedIds.size} recipient{addedIds.size !== 1 ? 's' : ''} added from directory
          </p>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Invite by email */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Invite by email</p>
        <div className="flex gap-2 items-start">
          <div style={{ width: 200, flexShrink: 0 }}>
            <Select value={recipientRole} onValueChange={setRecipientRole}>
              <SelectTrigger aria-label="Recipient role" style={{ height: 36, fontSize: 13 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="preceptor">Preceptor / site supervisor</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="ta">Teaching assistant</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Textarea
              value={recipientEmails}
              onChange={e => setRecipientEmails(e.target.value)}
              rows={2}
              placeholder="One email per line, or comma-separated"
              className="text-sm resize-none"
              aria-label="Email addresses to invite"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Anonymous link */}
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={anonymousLink}
            onCheckedChange={v => setAnonymousLink(!!v)}
            aria-label="Generate anonymous public link"
            style={{ marginTop: 2 }}
          />
          <div>
            <p className="text-sm font-medium">Public link (anonymous responses)</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Share with anyone — preceptors, alumni, or external reviewers. Responses are anonymous.
            </p>
          </div>
        </label>
        {anonymousLink && (
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{ padding: '8px 12px', background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <code
              className="text-xs flex-1 truncate"
              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
            >
              {MOCK_LINK}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyLink} aria-label="Copy public survey link">
              <i
                className={`fa-light fa-${linkCopied ? 'check' : 'copy'}`}
                aria-hidden="true"
                style={{ fontSize: 12, color: linkCopied ? 'var(--chart-2)' : undefined }}
              />
              {linkCopied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        )}
      </div>

      {/* Nav */}
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
    </div>
  )
}
