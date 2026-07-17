'use client'

/* Assessment landing — rendered inside the course offering's Assessments tab.
   DS-native: status via Badge + --qb-status-* tokens (same as courses/students),
   team via plain DS Avatar/AvatarFallback (muted), readable borderless KPIs,
   and a DS DataTable with clickable rows. No status filter tabs (status is a
   column); no row-count text. */

import { useMemo } from 'react'
import { AvatarGroup, AvatarGroupCount, AvatarInitials, Badge, Button } from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { KeyMetrics, type MetricItem } from '@/components/key-metrics'
import { EmptyState } from '@/components/empty-state'
import {
  ASSESSMENTS, FACULTY, aggregatePsy, sectionsForAssessment, flaggedCount,
  type Assessment, type FacultyId,
} from '../data'
import { AssessmentStatusBadge } from '../assessment-status-badge'

// ── Active-exam ring strip ────────────────────────────────────────────────────
// Aggregate view of all currently-live (state='ready') assessments.
// Only rendered when at least one assessment is active.
function ActiveExamsStrip({ assessments, onOpen }: { assessments: Assessment[]; onOpen: (a: Assessment) => void }) {
  if (!assessments.length) return null
  return (
    <div
      role="region"
      aria-label="Active exams"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-color)', display: 'inline-block', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>Active now</span>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{assessments.length} exam{assessments.length !== 1 ? 's' : ''} in progress</span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {assessments.map(a => {
          const applicable = a.applicableStudents ?? 0
          const completed = a.completedStudents ?? 0
          const pending = applicable - completed
          const pct = applicable ? Math.round((completed / applicable) * 100) : 0
          const r = 24, cx = 26, cy = 26, circ = 2 * Math.PI * r
          const dash = (pct / 100) * circ
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpen(a)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--background)',
                cursor: 'pointer', textAlign: 'left', minWidth: 220,
              }}
              aria-label={`${a.name} — ${completed} of ${applicable} submitted`}
            >
              <svg width={52} height={52} aria-hidden="true" style={{ flexShrink: 0 }}>
                {/* track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={4} />
                {/* progress */}
                <circle
                  cx={cx} cy={cy} r={r} fill="none"
                  stroke="var(--brand-color)" strokeWidth={4}
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
                <text x={cx} y={cy + 5} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--foreground)' }}>{pct}%</text>
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                  <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{completed}</span> submitted · <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{pending}</span> pending
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>{a.due}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Mini ring chart ─────────────────────────────────────────────────────────
// Shows submitted / applicable ratio. Only rendered for ready + completed rows.
function RingChart({ completed, applicable, state }: { completed: number; applicable: number; state: Assessment['state'] }) {
  if (!applicable) return <span className="text-sm text-muted-foreground tabular-nums">—</span>
  const pct = Math.round((completed / applicable) * 100)
  const r = 10, cx = 13, cy = 13
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const ringColor = state === 'completed' ? 'var(--chart-2)' : 'var(--brand-color)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <svg width={26} height={26} aria-hidden="true" style={{ flexShrink: 0 }}>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={3} />
        {/* fill */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={ringColor} strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div>
        <div className="text-sm tabular-nums font-medium">{completed} <span className="text-muted-foreground font-normal">/ {applicable}</span></div>
        <div className="text-xs text-muted-foreground">{pct}% submitted</div>
      </div>
    </div>
  )
}

// Formats an ISO date string (YYYY-MM-DD) → "Oct 15, 2026"
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

type Row = Assessment & Record<string, unknown>

function TeamAvatars({ owner, collaborators }: { owner: FacultyId; collaborators: FacultyId[] }) {
  const ids = [owner, ...collaborators]
  const shown = ids.slice(0, 4)
  const extra = ids.length - shown.length
  return (
    <AvatarGroup>
      {shown.map(id => <AvatarInitials key={id} size="sm" initials={FACULTY[id].initials} />)}
      {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
    </AvatarGroup>
  )
}

export function AssessmentsLanding({ onOpen, onCreate }: { onOpen: (a: Assessment) => void; onCreate: () => void }) {
  const activeExams = useMemo(() => ASSESSMENTS.filter(a => a.state === 'ready' && (a.applicableStudents ?? 0) > 0), [])
  const flaggedN = useMemo(() => ASSESSMENTS.reduce((n, a) => n + flaggedCount(sectionsForAssessment(a)), 0), [])
  const avgDiff = useMemo(() => {
    const all = ASSESSMENTS.flatMap(a => sectionsForAssessment(a).flatMap(s => s.questions))
    return all.length ? aggregatePsy(all).p.toFixed(2) : '—'
  }, [])
  const totalApplicable = ASSESSMENTS.reduce((s, a) => s + (a.applicableStudents ?? 0), 0)
  const totalCompleted = ASSESSMENTS.reduce((s, a) => s + (a.completedStudents ?? 0), 0)
  const metrics: MetricItem[] = [
    { id: 'active', label: 'Active assessments', value: ASSESSMENTS.filter(a => ['draft', 'review', 'ready'].includes(a.state)).length, delta: `of ${ASSESSMENTS.length} total`, trend: 'neutral' },
    { id: 'review', label: 'Awaiting review', value: ASSESSMENTS.filter(a => a.state === 'review').length, delta: 'pending sign-off', trend: 'neutral' },
    { id: 'submissions', label: 'Student submissions', value: totalCompleted, delta: `of ${totalApplicable} applicable`, trend: 'neutral' },
    { id: 'avg-diff', label: 'Avg. difficulty index', value: avgDiff, delta: '0–1 scale', trend: 'neutral' },
  ]

  const rows = ASSESSMENTS as Row[]

  const columns: ColumnDef<Row>[] = [
    {
      key: 'title', label: 'Assessment', width: 380, minWidth: 300, sortable: true, sortKey: 'name',
      cell: (row) => {
        const timed = row.timedMinutes as number | null
        const graded = row.graded as boolean
        return (
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: 'var(--brand-tint)' }}>
              <i className={`fa-light ${row.type === 'Exam' ? 'fa-file-shield' : 'fa-file-lines'} text-[12px]`} aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{row.name as string}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{row.course as string}</span>
                {graded && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[11px] h-4">
                    Scored
                  </Badge>
                )}
                {timed != null && timed > 0 && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[11px] h-4">
                    <i className="fa-light fa-clock mr-0.5 text-[10px]" aria-hidden="true" />{timed}m
                  </Badge>
                )}
                {row.security === 'Secure' && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[11px] h-4">
                    <i className="fa-light fa-lock mr-0.5 text-[10px]" aria-hidden="true" />Secure
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status', label: 'Status', width: 150, sortable: true, sortKey: 'state',
      cell: (row) => {
        const published = row.publishedAt as string | null
        const state = row.state as Assessment['state']
        return (
          <div>
            <AssessmentStatusBadge state={state} />
            {published && (
              <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                {['ready', 'completed', 'archived'].includes(state) ? 'Published ' : ''}{fmtDate(published)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'students', label: 'Students', width: 160,
      cell: (row) => {
        const state = row.state as Assessment['state']
        const applicable = row.applicableStudents as number
        const completed = row.completedStudents as number
        if (!['ready', 'completed', 'archived'].includes(state) || !applicable) {
          return <span className="text-sm text-muted-foreground">—</span>
        }
        return (
          <RingChart
            completed={completed}
            applicable={applicable}
            state={state}
          />
        )
      },
    },
    { key: 'questions', label: 'Questions', width: 100, sortable: true, sortKey: 'questions', cell: (row) => <span className="text-sm tabular-nums">{(row.questions as number) || '—'}</span> },
    { key: 'points', label: 'Points', width: 80, sortable: true, sortKey: 'points', cell: (row) => <span className="text-sm tabular-nums">{(row.points as number) || '—'}</span> },
    { key: 'team', label: 'Team', width: 110, cell: (row) => <TeamAvatars owner={row.owner as FacultyId} collaborators={row.collaborators as FacultyId[]} /> },
    { key: 'due', label: 'Scheduled', width: 180, sortable: true, sortKey: 'due', cell: (row) => <span className="text-xs text-muted-foreground tabular-nums">{row.due as string}</span> },
    { key: 'chevron', label: '', width: 44, defaultPin: 'right', lockPin: true, cell: () => <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" /> },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Active-exam ring strip — only visible when ≥1 exam is live */}
      <ActiveExamsStrip assessments={activeExams} onOpen={onOpen} />

      {/* KPI strip — DS KeyMetrics flat band (borderless, no redundant header /
          non-functional period selector); canonical embedded-strip pattern */}
      <KeyMetrics variant="flat" showHeader={false} metricsSingleRow metrics={metrics} />

      {/* table — every row clickable → detail; DS collapse/expand search (⌘K) +
          New Assessment live in the DataTable toolbar */}
      <DataTable<Row>
        data={rows}
        columns={columns}
        getRowId={(row) => row.id as string}
        selectable={false}
        searchable
        showQueryControls
        onRowClick={(row) => onOpen(row as Assessment)}
        toolbarSlot={() => (
          <Button variant="default" size="sm" onClick={onCreate}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New Assessment
          </Button>
        )}
        emptyState={
          <EmptyState
            align="center"
            icon="fa-clipboard-list"
            title="No assessments yet"
            description="Create an assessment for this course offering."
            footer={
              <Button variant="default" size="sm" onClick={onCreate}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                New Assessment
              </Button>
            }
          />
        }
      />
    </div>
  )
}
