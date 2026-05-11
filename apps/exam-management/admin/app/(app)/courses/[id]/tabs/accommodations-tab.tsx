'use client'

/**
 * ACCOMMODATIONS TAB — read-only by faculty.
 *
 * Aarti / Granola: "Accommodations approved by Student Services. Faculty
 * cannot modify accommodations." This tab makes that policy visible — the
 * approver is named on every accommodation, and the only action is to
 * contact Student Services.
 */

import { useMemo } from 'react'
import { Avatar, AvatarFallback, Button, LocalBanner } from '@exxat/ds/packages/ui/src'
import { StubButton } from '@/components/stub-button'
import type { Student, Accommodation, AccommodationType } from '@/lib/faculty-mock-data'

interface AccommodationsTabProps {
  accommodations: Accommodation[]
  students: Student[]
}

export function AccommodationsTab({ accommodations, students }: AccommodationsTabProps) {
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students])

  const grouped = useMemo(() => {
    const m = new Map<string, Accommodation[]>()
    for (const a of accommodations) {
      if (!m.has(a.studentId)) m.set(a.studentId, [])
      m.get(a.studentId)!.push(a)
    }
    return m
  }, [accommodations])

  const groupedEntries = Array.from(grouped.entries()).sort((a, b) => {
    const sa = studentMap.get(a[0])?.lastName ?? ''
    const sb = studentMap.get(b[0])?.lastName ?? ''
    return sa.localeCompare(sb)
  })

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const a of accommodations) c[a.type] = (c[a.type] ?? 0) + 1
    return c
  }, [accommodations])

  if (accommodations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full mx-auto mb-3 bg-muted">
          <i className="fa-light fa-universal-access text-muted-foreground text-xl" aria-hidden="true" />
        </div>
        <p className="font-heading text-lg font-semibold text-foreground">
          No accommodations on file for this course
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Accommodations are managed by Student Services. If a student should have an accommodation,
          contact your Student Services coordinator.
        </p>
        <StubButton variant="outline" size="default" className="mt-4 gap-2">
          <i className="fa-light fa-envelope" aria-hidden="true" />
          Contact Student Services
        </StubButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* DS LocalBanner (was hand-rolled info strip per dialog-banner-badge audit) */}
      <LocalBanner
        variant="info"
        title="Managed by Student Services"
        action={{
          label: 'Email Student Services',
          onClick: () => { /* StubButton hook — wired when Student Services contact lands */ },
        }}
      >
        You cannot modify accommodations from this surface. They apply automatically to all
        assessments in this course. To request a change, contact the approver listed on each entry.
      </LocalBanner>

      {/* Type rollup */}
      <section className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {Object.entries(typeCounts).map(([type, count]) => (
          <TypeTile key={type} type={type as AccommodationType} count={count} />
        ))}
      </section>

      {/* Per-student grouped list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {groupedEntries.map(([studentId, accs]) => {
          const student = studentMap.get(studentId)
          if (!student) return null
          return (
            <div
              key={studentId}
              className="flex items-start gap-4 px-4 py-4 border-b border-border last:border-b-0"
            >
              <Avatar className="size-9 rounded-full shrink-0">
                <AvatarFallback className="rounded-full text-[10px] font-bold bg-chart-1/14 text-chart-1">
                  {student.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="font-semibold text-foreground">{student.firstName} {student.lastName}</p>
                  <span className="text-xs text-muted-foreground">{student.studentId}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{accs.length} {accs.length === 1 ? 'accommodation' : 'accommodations'}</span>
                </div>

                <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                  {accs.map(a => <AccommodationCard key={a.id} acc={a} />)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TypeMeta — Tailwind utility class–driven ───────────────────────────────
const TYPE_META: Record<AccommodationType, {
  label: string
  icon: string
  bgClass: string
  fgClass: string
  borderClass: string
}> = {
  'extended-time':   { label: 'Extended time',   icon: 'fa-clock',        bgClass: 'bg-chart-1/8',  fgClass: 'text-chart-1',     borderClass: 'border-chart-1/22' },
  'separate-room':   { label: 'Separate room',   icon: 'fa-door-open',    bgClass: 'bg-chart-3/10', fgClass: 'text-chart-3',     borderClass: 'border-chart-3/22' },
  'extended-breaks': { label: 'Extended breaks', icon: 'fa-mug-hot',      bgClass: 'bg-chart-5/10', fgClass: 'text-chart-5',     borderClass: 'border-chart-5/22' },
  'screen-reader':   { label: 'Screen reader',   icon: 'fa-display-code', bgClass: 'bg-brand/10',   fgClass: 'text-brand-dark',  borderClass: 'border-brand/22' },
  'quiet-room':      { label: 'Quiet room',      icon: 'fa-volume-off',   bgClass: 'bg-chart-2/10', fgClass: 'text-chart-2',     borderClass: 'border-chart-2/22' },
}

// ─── Type rollup tile ───────────────────────────────────────────────────────
function TypeTile({ type, count }: { type: AccommodationType; count: number }) {
  const meta = TYPE_META[type]
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
      <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${meta.bgClass}`}>
        <i className={`fa-light ${meta.icon} ${meta.fgClass} text-sm`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{meta.label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-bold ${meta.fgClass}`}>{count}</span>
          <span className="text-xs text-muted-foreground">{count === 1 ? 'student' : 'students'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Accommodation detail card ──────────────────────────────────────────────
function AccommodationCard({ acc }: { acc: Accommodation }) {
  const meta = TYPE_META[acc.type]
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${meta.bgClass} ${meta.borderClass}`}>
      <div className="flex items-start gap-2">
        <i className={`fa-solid ${meta.icon} ${meta.fgClass} text-xs mt-0.5`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${meta.fgClass}`}>
            {meta.label}
          </p>
          <p className="text-sm text-foreground mt-0.5 leading-snug">{acc.detail}</p>
          {acc.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">{acc.notes}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <i className="fa-light fa-user-check" aria-hidden="true" />
              <span className="text-foreground font-medium">{acc.approvedBy}</span>
            </span>
            <span>·</span>
            <span>Approved {relativeTime(acc.approvedDate)}</span>
            {acc.expiryDate && (
              <>
                <span>·</span>
                <span>Expires {relativeTime(acc.expiryDate)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const days = Math.round((Date.now() - then) / 86_400_000)
  if (days < 0) {
    const future = -days
    if (future === 0) return 'today'
    if (future === 1) return 'in 1 day'
    if (future < 30) return `in ${future}d`
    if (future < 365) return `in ${Math.round(future / 30)}mo`
    return `in ${Math.round(future / 365)}y`
  }
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}
