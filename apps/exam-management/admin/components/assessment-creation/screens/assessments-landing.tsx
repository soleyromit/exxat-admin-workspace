'use client'

/* Assessment landing — rendered inside the course offering's Assessments tab.
   DS-native: status via Badge + --qb-status-* tokens (same as courses/students),
   team via plain DS Avatar/AvatarFallback (muted), readable borderless KPIs,
   and a DS DataTable with clickable rows. No status filter tabs (status is a
   column); no row-count text. */

import { useMemo, useState } from 'react'
import { AvatarGroup, AvatarGroupCount, AvatarInitials, Badge, Button, Input } from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import {
  ASSESSMENTS, FACULTY, aggregatePsy, sectionsForAssessment, flaggedCount,
  type Assessment, type FacultyId,
} from '../data'
import { AssessmentStatusBadge } from '../assessment-status-badge'

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
  const [q, setQ] = useState('')

  const flaggedN = useMemo(() => ASSESSMENTS.reduce((n, a) => n + flaggedCount(sectionsForAssessment(a)), 0), [])
  const avgDiff = useMemo(() => {
    const all = ASSESSMENTS.flatMap(a => sectionsForAssessment(a).flatMap(s => s.questions))
    return all.length ? aggregatePsy(all).p.toFixed(2) : '—'
  }, [])
  const kpis = [
    { l: 'Active assessments', v: ASSESSMENTS.filter(a => ['draft', 'review', 'ready'].includes(a.state)).length },
    { l: 'Awaiting review', v: ASSESSMENTS.filter(a => a.state === 'review').length },
    { l: 'Flagged questions', v: flaggedN },
    { l: 'Avg. difficulty index', v: avgDiff },
  ]

  const rows = ASSESSMENTS.filter(a => q === '' || a.name.toLowerCase().includes(q.toLowerCase())) as Row[]

  const columns: ColumnDef<Row>[] = [
    {
      key: 'title', label: 'Assessment', width: 320, sortable: true, sortKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: 'var(--brand-tint)' }}>
            <i className={`fa-light ${row.type === 'Exam' ? 'fa-file-shield' : 'fa-file-lines'} text-[12px]`} aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{row.name as string}</div>
            <div className="truncate text-xs text-muted-foreground">{row.course as string} · {row.security as string} · {row.graded ? 'Graded' : 'Ungraded'}</div>
          </div>
        </div>
      ),
    },
    { key: 'type', label: 'Type', width: 90, sortable: true, sortKey: 'type', cell: (row) => <Badge variant="outline">{row.type as string}</Badge> },
    { key: 'questions', label: 'Questions', width: 100, sortable: true, sortKey: 'questions', cell: (row) => <span className="text-sm tabular-nums">{(row.questions as number) || '—'}</span> },
    { key: 'points', label: 'Points', width: 90, sortable: true, sortKey: 'points', cell: (row) => <span className="text-sm tabular-nums">{(row.points as number) || '—'}</span> },
    { key: 'status', label: 'Status', width: 130, sortable: true, sortKey: 'state', cell: (row) => <AssessmentStatusBadge state={row.state as Assessment['state']} /> },
    { key: 'team', label: 'Team', width: 120, cell: (row) => <TeamAvatars owner={row.owner as FacultyId} collaborators={row.collaborators as FacultyId[]} /> },
    { key: 'due', label: 'Scheduled', width: 180, sortable: true, sortKey: 'due', cell: (row) => <span className="text-xs text-muted-foreground tabular-nums">{row.due as string}</span> },
    { key: 'chevron', label: '', width: 44, defaultPin: 'right', lockPin: true, cell: () => <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" /> },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* KPI strip — borderless, readable */}
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        {kpis.map(k => (
          <div key={k.l} className="min-w-[120px]">
            <div className="text-xs font-medium text-muted-foreground">{k.l}</div>
            <div className="mt-0.5 text-2xl font-semibold leading-tight text-foreground tabular-nums">{k.v}</div>
          </div>
        ))}
      </div>

      {/* table — every row clickable → detail; search + New Assessment in the toolbar */}
      <DataTable<Row>
        data={rows}
        columns={columns}
        getRowId={(row) => row.id as string}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        onRowClick={(row) => onOpen(row as Assessment)}
        toolbarSlot={() => (
          <>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search assessments…"
              aria-label="Search assessments"
              className="h-8 w-56"
            />
            <Button size="sm" className="ml-auto" onClick={onCreate}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              New Assessment
            </Button>
          </>
        )}
      />
    </div>
  )
}
