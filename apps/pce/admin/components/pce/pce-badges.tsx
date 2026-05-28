'use client'

import { Badge } from '@exxat/ds/packages/ui/src'
import type { SurveyStatus, TemplateSection } from '@/lib/pce-mock-data'
import { SECTION_ABBREV } from '@/lib/pce-mock-data'

/* Variant carries the semantics; bg/fg/dot carry the product-design brand tint.
 *   - default  → state has user attention (pending review, active collecting)
 *   - outline  → de-emphasized state (draft, closed)
 *   - secondary→ neutral informational state (released)
 * No destructive used — per memory feedback_aarti_no_red: no red in status viz.
 */
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link'

const STATUS_CONFIG: Record<SurveyStatus, { label: string; variant: BadgeVariant; bg: string; fg: string; dot: string }> = {
  draft: {
    label: 'Draft',
    variant: 'outline',
    bg: 'var(--pce-status-draft-bg)',
    fg: 'var(--pce-status-draft-fg)',
    dot: 'var(--pce-status-draft-fg)',
  },
  active: {
    label: 'Active',
    variant: 'default',
    bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
    fg: 'var(--brand-color-dark)',
    dot: 'var(--brand-color)',
  },
  collecting: {
    label: 'Collecting',
    variant: 'default',
    bg: 'var(--pce-status-collecting-bg)',
    fg: 'var(--pce-status-collecting-fg)',
    dot: 'var(--pce-status-collecting-dot)',
  },
  pending_review: {
    label: 'Pending Review',
    variant: 'default',
    bg: 'var(--pce-status-pending-bg)',
    fg: 'var(--pce-status-pending-fg)',
    dot: 'var(--pce-status-pending-fg)',
  },
  released: {
    label: 'Shared with Faculty',
    variant: 'secondary',
    bg: 'var(--pce-status-released-bg)',
    fg: 'var(--pce-status-released-fg)',
    dot: 'var(--pce-status-released-fg)',
  },
  closed: {
    label: 'Closed',
    variant: 'outline',
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
    dot: 'var(--muted-foreground)',
  },
}

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const s = STATUS_CONFIG[status]
  return (
    <Badge
      variant={s.variant}
      data-status={status}
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
          className="rounded font-mono border-border text-[10px] px-[5px] py-[1px]"
        >
          {SECTION_ABBREV[s]}
        </Badge>
      ))}
    </div>
  )
}
