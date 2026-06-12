'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Avatar,
  AvatarFallback,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@exxatdesignux/ui'
import { MOCK_STUDENTS, MOCK_FACULTY } from '@/lib/pce-mock-data'

interface StepDistributionGeneralProps {
  onBack: () => void
  onNext: () => void
}

type RecipientRow = {
  id: string
  name: string
  initials: string
  email: string
  source: 'prism' | 'email'
  subtitle: string
}

// Pre-populated mock recipients — students via Prism, a few faculty contacts via Email
const MOCK_RECIPIENTS: RecipientRow[] = [
  ...MOCK_STUDENTS
    .filter(s => s.enrollmentStatus === 'enrolled')
    .map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      initials: `${s.firstName[0]}${s.lastName[0]}`.toUpperCase(),
      email: s.email,
      source: 'prism' as const,
      subtitle: s.cohort,
    })),
  ...MOCK_FACULTY.slice(0, 3).map(f => ({
    id: `email-${f.id}`,
    name: f.name,
    initials: f.initials,
    email: `${f.initials.toLowerCase().replace('.', '')}@clinicalsite.org`,
    source: 'email' as const,
    subtitle: 'External contact',
  })),
]

function SourceBadge({ source }: { source: 'prism' | 'email' }) {
  return (
    <Badge variant="outline" className="rounded shrink-0">
      {source === 'prism' ? 'Prism' : 'Email'}
    </Badge>
  )
}

export function StepDistributionGeneral({ onBack, onNext }: StepDistributionGeneralProps) {
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const prismCount = MOCK_RECIPIENTS.filter(r => r.source === 'prism').length
  const emailCount  = MOCK_RECIPIENTS.filter(r => r.source === 'email').length

  const filteredRecipients = MOCK_RECIPIENTS.filter(r => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
  })

  const selectedRecipients = MOCK_RECIPIENTS.filter(r => !excludedIds.has(r.id))
  const visibleSelectedCount = filteredRecipients.filter(r => !excludedIds.has(r.id)).length
  const allVisibleSelected = filteredRecipients.length > 0 && visibleSelectedCount === filteredRecipients.length
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected

  function handleHeaderCheckbox() {
    const next = new Set(excludedIds)
    if (allVisibleSelected) {
      filteredRecipients.forEach(r => next.add(r.id))
    } else {
      filteredRecipients.forEach(r => next.delete(r.id))
    }
    setExcludedIds(next)
  }

  const noneSelected = selectedRecipients.length === 0

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 640 }}>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Recipients &amp; access</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose who receives this survey.
        </p>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-lg border border-border">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-border">
            <Checkbox
              checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
              onCheckedChange={handleHeaderCheckbox}
              aria-label="Select or deselect all visible recipients"
            />
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {selectedRecipients.length} of {MOCK_RECIPIENTS.length} selected
            </span>
            <div className="flex-1" />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 text-xs" style={{ minWidth: 130 }} aria-label="Filter by source">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="prism">Prism</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex items-center" style={{ minWidth: 180, maxWidth: 220 }}>
              <i className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" aria-hidden="true" />
              <Input
                placeholder="Search recipients…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search recipients"
                className="h-8 pl-7 pr-2 text-xs"
              />
            </div>
          </div>

          {/* Rows — scrollable */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filteredRecipients.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No recipients match your filters.
              </p>
            ) : (
              filteredRecipients.map((r, i) => {
                const checked = !excludedIds.has(r.id)
                const isLast = i === filteredRecipients.length - 1

                return (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      padding: '10px 12px',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      background: checked ? 'var(--card)' : 'var(--muted)',
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        const next = new Set(excludedIds)
                        next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                        setExcludedIds(next)
                      }}
                      aria-label={`Include ${r.name}`}
                    />

                    <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                      <AvatarFallback style={{ fontSize: 12, fontWeight: 600 }}>
                        {r.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>
                          {r.name}
                        </span>
                        <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {r.email}
                        </span>
                        <SourceBadge source={r.source} />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {r.subtitle}
                      </span>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={noneSelected} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

    </div>
  )
}
