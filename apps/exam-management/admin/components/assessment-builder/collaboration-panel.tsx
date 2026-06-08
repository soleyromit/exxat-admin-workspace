'use client'

import { Button } from '@exxatdesignux/ui'
import type { AssessmentDraft } from '@/lib/qb-types'
import { facultyListRows } from '@/lib/faculty-mock-data'

interface Props {
  asmt: AssessmentDraft
  onAssignFaculty: () => void
}

const AVATAR_TINTS = ['var(--brand-color)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-1)', 'var(--chart-3)']

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

type SecStatus = { label: string; tone: 'green' | 'amber' | 'muted' }
function sectionStatus(filled: number, target: number): SecStatus {
  if (target > 0 && filled >= target) return { label: 'Ready for review', tone: 'green' }
  if (filled > 0) return { label: `${filled}/${target || filled} added`, tone: 'amber' }
  return { label: 'Not started', tone: 'muted' }
}

/**
 * Collaboration tab — Section Assignments + Activity Log, mirroring the Claude
 * Design assessment-builder.html collab panel.
 */
export function CollaborationPanel({ asmt, onAssignFaculty }: Props) {
  const activity = buildActivity(asmt)

  return (
    <div className="flex-1 overflow-auto px-6 py-5">
      <div className="mx-auto max-w-3xl flex flex-col gap-5">

        {/* Section Assignments */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Section Assignments</h3>
            <Button variant="default" size="sm" className="gap-1.5" onClick={onAssignFaculty}>
              <i className="fa-light fa-user-plus text-xs" aria-hidden="true" />
              Assign faculty
            </Button>
          </div>

          {asmt.sections.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add sections to assign faculty.</p>
          ) : (
            <div className="flex flex-col">
              {asmt.sections.map((s, i) => {
                const fac = (s.facultyIds ?? []).map(id => facultyListRows.find(f => f.id === id)).filter(Boolean)
                const lead = fac[0]
                const st = sectionStatus(s.questionIds.length, s.questionTarget ?? 0)
                const tint = AVATAR_TINTS[i % AVATAR_TINTS.length]
                return (
                  <div key={s.id} className={`flex items-center gap-3 py-3 ${i < asmt.sections.length - 1 ? 'border-b border-border' : ''}`}>
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: lead ? tint : 'var(--muted-foreground)' }}
                      aria-hidden="true"
                    >
                      {lead ? initials(lead.fullName) : '—'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{lead ? lead.fullName : 'Unassigned'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.title}{s.questionIds.length > 0 ? ` — ${s.questionIds.length} question${s.questionIds.length !== 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                    <StatusTag status={st} />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Activity Log */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Activity Log</h3>
          <ul className="flex flex-col gap-3">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-3 text-xs">
                <span className="text-muted-foreground whitespace-nowrap shrink-0 w-20">{a.when}</span>
                <span className="text-foreground">{a.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function StatusTag({ status }: { status: SecStatus }) {
  const cls =
    status.tone === 'green' ? 'text-[var(--chart-2)]'
    : status.tone === 'amber' ? 'text-[var(--chart-4)]'
    : 'text-muted-foreground'
  return <span className={`text-xs font-medium shrink-0 ${cls}`}>{status.label}</span>
}

function buildActivity(asmt: AssessmentDraft): { when: string; text: string }[] {
  const out: { when: string; text: string }[] = []
  const assigned = asmt.sections.filter(s => (s.facultyIds ?? []).length > 0)
  if (assigned.length > 0) {
    out.push({ when: 'Recently', text: `${assigned.length} section${assigned.length !== 1 ? 's' : ''} assigned to faculty` })
  }
  const withQs = asmt.sections.filter(s => s.questionIds.length > 0)
  if (withQs.length > 0) {
    out.push({ when: 'Earlier', text: `${asmt.questions.length} question${asmt.questions.length !== 1 ? 's' : ''} added across ${withQs.length} section${withQs.length !== 1 ? 's' : ''}` })
  }
  out.push({ when: 'Created', text: `Assessment created as ${asmt.settings.status === 'draft' ? 'Draft' : asmt.settings.status}` })
  return out
}
