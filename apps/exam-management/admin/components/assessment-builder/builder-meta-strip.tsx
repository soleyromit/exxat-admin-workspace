'use client'

import type { AssessmentDraft } from '@/lib/qb-types'

interface Props {
  asmt: AssessmentDraft
}

function fmtSchedule(iso: string | null): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

/**
 * Builder meta strip — at-a-glance assessment facts under the header, shown on
 * every tab. Mirrors the Claude Design assessment-builder.html meta strip:
 * Type · Weightage · Delivery · Duration · Total Marks · Scheduled.
 */
export function BuilderMetaStrip({ asmt }: Props) {
  const totalMarks = asmt.questions.reduce((s, q) => s + (q.points ?? 0), 0) || asmt.settings.totalMarks
  const sched = fmtSchedule(asmt.settings.openDate)

  return (
    <div
      className="flex items-stretch border-b border-border bg-card shrink-0 overflow-x-auto"
      role="group"
      aria-label="Assessment summary"
    >
      <Chip label="Type">
        <Tag tone="brand">{asmt.settings.type}</Tag>
      </Chip>
      <Chip label="Weightage">
        <Tag tone={asmt.settings.graded ? 'green' : 'muted'}>{asmt.settings.graded ? 'Graded' : 'Ungraded'}</Tag>
      </Chip>
      <Chip label="Delivery">
        <span className="text-[13px] font-semibold text-foreground">Standalone</span>
      </Chip>
      <Chip label="Duration">
        <span className="text-[13px] font-semibold text-foreground tabular-nums">{asmt.durationMinutes} min</span>
      </Chip>
      <Chip label="Total Marks" sub={`${asmt.sections.length} section${asmt.sections.length !== 1 ? 's' : ''} · ${asmt.questions.length} question${asmt.questions.length !== 1 ? 's' : ''}`}>
        <span className="text-[13px] font-semibold text-foreground tabular-nums">{totalMarks}</span>
        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-px rounded">AUTO</span>
      </Chip>
      <Chip label="Scheduled" sub={sched?.time}>
        <span className="text-[13px] font-semibold text-foreground tabular-nums">{sched ? sched.date : 'Not scheduled'}</span>
      </Chip>
    </div>
  )
}

function Chip({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-2 border-r border-border last:border-r-0 shrink-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">{children}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

function Tag({ tone, children }: { tone: 'brand' | 'green' | 'muted'; children: React.ReactNode }) {
  const cls =
    tone === 'green' ? 'bg-muted text-[var(--chart-2)]'
    : tone === 'brand' ? 'bg-[var(--brand-tint)] text-[var(--brand-color)]'
    : 'bg-muted text-muted-foreground'
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${cls}`}>{children}</span>
}
