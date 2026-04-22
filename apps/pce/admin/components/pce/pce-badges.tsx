'use client'

import { Badge } from '@exxat/ds/packages/ui/src'
import type { SurveyStatus, TemplateSection } from '@/lib/pce-mock-data'
import { SECTION_ABBREV } from '@/lib/pce-mock-data'

const STATUS_CONFIG: Record<SurveyStatus, { label: string; bg: string; fg: string; dot: string }> = {
  draft: {
    label: 'Draft',
    bg: 'var(--pce-status-draft-bg)',
    fg: 'var(--pce-status-draft-fg)',
    dot: 'oklch(0.42 0.12 68)',
  },
  active: {
    label: 'Active',
    bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
    fg: 'var(--brand-color-dark)',
    dot: 'var(--brand-color)',
  },
  collecting: {
    label: 'Collecting',
    bg: 'var(--pce-status-collecting-bg)',
    fg: 'var(--pce-status-collecting-fg)',
    dot: 'oklch(0.48 0.15 184)',
  },
  pending_review: {
    label: 'Pending Review',
    bg: 'var(--pce-status-pending-bg)',
    fg: 'var(--pce-status-pending-fg)',
    dot: 'oklch(0.42 0.12 68)',
  },
  released: {
    label: 'Released',
    bg: 'var(--pce-status-released-bg)',
    fg: 'var(--pce-status-released-fg)',
    dot: 'oklch(0.28 0.12 155)',
  },
  closed: {
    label: 'Closed',
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
    dot: 'var(--muted-foreground)',
  },
}

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const s = STATUS_CONFIG[status]
  return (
    <Badge
      variant="secondary"
      className="rounded gap-1.5 whitespace-nowrap font-medium border-0"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, display: 'inline-block', flexShrink: 0 }}
        aria-hidden="true"
      />
      {s.label}
    </Badge>
  )
}

export function TemplateSectionChips({ sections }: { sections: TemplateSection[] }) {
  return (
    <div className="flex gap-1">
      {sections.map(s => (
        <Badge
          key={s}
          variant="outline"
          className="rounded font-mono border-border"
          style={{ fontSize: 10, padding: '1px 5px' }}
        >
          {SECTION_ABBREV[s]}
        </Badge>
      ))}
    </div>
  )
}
