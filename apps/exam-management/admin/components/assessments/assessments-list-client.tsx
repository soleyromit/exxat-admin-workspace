'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Badge,
  Input,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Card, CardContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@exxatdesignux/ui'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

/* ── Types ──────────────────────────────────────────────────────────────── */

type AssessmentState = 'draft' | 'planned' | 'review' | 'ready' | 'completed' | 'archived'
type AssessmentType = 'Exam' | 'Quiz'

interface Assessment {
  id: string
  name: string
  course: string
  type: AssessmentType
  state: AssessmentState
  questions: number
  points: number
  ownerInitials: string
  ownerName: string
  collaborators: string[]
  due: string
  security: 'Secure' | 'Unsecure'
  graded: boolean
}

/* ── Mock data ──────────────────────────────────────────────────────────── */

const MOCK_ASSESSMENTS: Assessment[] = [
  { id: 'a1', name: 'Cardiovascular Pharmacology — Midterm', course: 'MED-201', type: 'Exam', state: 'draft', questions: 24, points: 100, ownerInitials: 'SC', ownerName: 'Dr. Sarah Chen', collaborators: ['JO', 'PN', 'MW'], due: 'Oct 24, 2026', security: 'Secure', graded: true },
  { id: 'a2', name: 'Antihypertensives — Weekly Quiz 4', course: 'MED-201', type: 'Quiz', state: 'ready', questions: 10, points: 20, ownerInitials: 'JO', ownerName: 'Dr. James Okafor', collaborators: [], due: 'Oct 15, 2026', security: 'Unsecure', graded: false },
  { id: 'a3', name: 'Heart Failure Management — Remedial', course: 'MED-201', type: 'Quiz', state: 'planned', questions: 0, points: 0, ownerInitials: 'PN', ownerName: 'Dr. Priya Nair', collaborators: [], due: 'Nov 2, 2026', security: 'Secure', graded: true },
  { id: 'a4', name: 'ECG Interpretation — Unit Exam', course: 'MED-201', type: 'Exam', state: 'review', questions: 30, points: 120, ownerInitials: 'JO', ownerName: 'Dr. James Okafor', collaborators: ['SC'], due: 'Oct 28, 2026', security: 'Secure', graded: true },
  { id: 'a5', name: 'Anticoagulation Therapy — Final', course: 'MED-301', type: 'Exam', state: 'completed', questions: 40, points: 150, ownerInitials: 'SC', ownerName: 'Dr. Sarah Chen', collaborators: ['PN', 'JO'], due: 'May 12, 2026', security: 'Secure', graded: true },
  { id: 'a6', name: 'Diuretics & Electrolytes — Midterm', course: 'MED-201', type: 'Exam', state: 'completed', questions: 28, points: 100, ownerInitials: 'SC', ownerName: 'Dr. Sarah Chen', collaborators: ['PN'], due: 'Mar 3, 2026', security: 'Secure', graded: true },
  { id: 'a7', name: 'Lipid-Lowering Agents — Spring Final', course: 'MED-201', type: 'Exam', state: 'archived', questions: 35, points: 120, ownerInitials: 'JO', ownerName: 'Dr. James Okafor', collaborators: ['SC', 'PN'], due: 'May 20, 2025', security: 'Secure', graded: true },
]

// DataTable requires TData extends Record<string, unknown>.
type AssessmentRow = Assessment & Record<string, unknown>

/* ── KPI data ───────────────────────────────────────────────────────────── */

interface KpiTile {
  label: string
  value: string | number
  sub: string
  alert?: boolean
  good?: boolean
}

const KPIS: KpiTile[] = [
  { label: 'Active assessments', value: 5, sub: 'across MED-201, MED-301' },
  { label: 'Awaiting your review', value: 2, sub: 'Coordinator + owner sign-off', alert: true },
  { label: 'Flagged questions', value: 2, sub: 'psychometric outliers', alert: true },
  { label: 'Avg. difficulty index', value: '0.62', sub: 'healthy range 0.4–0.8', good: true },
]

/* ── Tab definitions ────────────────────────────────────────────────────── */

interface TabDef {
  id: AssessmentState | 'all'
  label: string
}

const TABS: TabDef[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'In Review' },
  { id: 'ready', label: 'Ready' },
  { id: 'planned', label: 'Planned' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
]

/* ── Helpers ────────────────────────────────────────────────────────────── */

function stateChipClass(state: AssessmentState): string {
  switch (state) {
    case 'draft':
    case 'planned':
      return 'state-chip state-chip--muted'
    case 'review':
      return 'state-chip state-chip--review'
    case 'ready':
      return 'state-chip state-chip--ready'
    case 'completed':
      return 'state-chip state-chip--completed'
    case 'archived':
      return 'state-chip state-chip--archived'
  }
}

function stateLabel(state: AssessmentState): string {
  switch (state) {
    case 'draft': return 'Draft'
    case 'planned': return 'Planned'
    case 'review': return 'In Review'
    case 'ready': return 'Ready'
    case 'completed': return 'Completed'
    case 'archived': return 'Archived'
  }
}

function typeIcon(type: AssessmentType): string {
  return type === 'Exam' ? 'fa-light fa-file-lines' : 'fa-light fa-circle-question'
}

function isBuilderState(state: AssessmentState): boolean {
  return state === 'draft' || state === 'planned' || state === 'review'
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function KpiStrip() {
  return (
    <div
      style={{ borderBottom: '1px solid var(--border)' }}
      className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0"
      role="region"
      aria-label="Assessment overview metrics"
    >
      {KPIS.map((kpi, i) => (
        <div key={i} className="flex flex-col gap-1 px-6 py-4">
          <span className="text-xs text-muted-foreground">{kpi.label}</span>
          <span
            className="text-2xl font-semibold tabular-nums leading-none"
            style={{
              color: kpi.alert
                ? 'var(--chart-4)'
                : kpi.good
                ? 'var(--chart-2)'
                : 'var(--foreground)',
            }}
          >
            {kpi.value}
          </span>
          <span className="text-xs text-muted-foreground">{kpi.sub}</span>
        </div>
      ))}
    </div>
  )
}

interface StateChipProps {
  state: AssessmentState
}

function StateChip({ state }: StateChipProps) {
  const baseClass =
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-none'

  const colorStyle: React.CSSProperties = (() => {
    switch (state) {
      case 'draft':
      case 'planned':
        return {
          background: 'var(--muted)',
          color: 'var(--muted-foreground)',
        }
      case 'review':
        return {
          background: 'oklch(from var(--chart-4) l c h / 0.15)',
          color: 'var(--chart-4)',
        }
      case 'ready':
        return {
          background: 'oklch(from var(--chart-2) l c h / 0.15)',
          color: 'var(--chart-2)',
        }
      case 'completed':
        return {
          background: 'var(--muted)',
          color: 'var(--foreground)',
        }
      case 'archived':
        return {
          background: 'var(--muted)',
          color: 'var(--muted-foreground)',
          opacity: 0.7,
        }
    }
  })()

  return (
    <span className={baseClass} style={colorStyle}>
      {stateLabel(state)}
    </span>
  )
}

interface OwnerCellProps {
  ownerInitials: string
  ownerName: string
  collaborators: string[]
}

function OwnerCell({ ownerInitials, ownerName, collaborators }: OwnerCellProps) {
  const allInitials = [ownerInitials, ...collaborators]
  return (
    <div className="flex items-center gap-2">
      <AvatarGroup>
        {allInitials.map((initials, i) => (
          <Avatar key={i} className="h-6 w-6">
            <AvatarFallback
              className="text-xs font-semibold"
              style={{
                background: 'var(--muted)',
                color: 'var(--foreground)',
                fontSize: '10px',
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <span className="text-sm text-muted-foreground hidden lg:inline">{ownerName}</span>
    </div>
  )
}

interface RowMenuProps {
  assessment: Assessment
  onOpenBuilder: () => void
}

function RowMenu({ assessment, onOpenBuilder }: RowMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${assessment.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onClick={onOpenBuilder}>
          <i className="fa-light fa-hammer" aria-hidden="true" />
          Open in builder
        </DropdownMenuItem>
        <DropdownMenuItem>
          <i className="fa-light fa-copy" aria-hidden="true" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <i className="fa-light fa-file-export" aria-hidden="true" />
          Export
        </DropdownMenuItem>
        <DropdownMenuItem>
          <i className="fa-light fa-drafting-compass" aria-hidden="true" />
          Use as blueprint
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant={assessment.state === 'archived' ? 'default' : 'destructive'}>
          {assessment.state === 'archived' ? (
            <>
              <i className="fa-light fa-box-open" aria-hidden="true" />
              Restore
            </>
          ) : (
            <>
              <i className="fa-light fa-box-archive" aria-hidden="true" />
              Archive
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Column definitions ─────────────────────────────────────────────────── */

function buildColumns(onOpenBuilder: (a: Assessment) => void): ColumnDef<AssessmentRow>[] {
  return [
    {
      key: 'type-icon',
      label: 'Type icon',
      width: 40,
      cell: (row) => (
        <i className={`${typeIcon(row.type as AssessmentType)} text-muted-foreground text-sm`} aria-hidden="true" />
      ),
    },
    {
      key: 'name',
      label: 'Assessment',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground leading-snug">{row.name as string}</span>
          <span className="text-xs text-muted-foreground">
            {row.course as string} · {row.security as string}{row.graded ? ' · Graded' : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: 80,
      cell: (row) => <Badge variant="outline">{row.type as string}</Badge>,
    },
    {
      key: 'questions',
      label: 'Questions',
      width: 80,
      sortable: true,
      cell: (row) => (
        <span className="text-sm tabular-nums text-foreground text-right block">
          {(row.questions as number) > 0 ? row.questions as number : '—'}
        </span>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      width: 72,
      sortable: true,
      cell: (row) => (
        <span className="text-sm tabular-nums text-foreground text-right block">
          {(row.points as number) > 0 ? row.points as number : '—'}
        </span>
      ),
    },
    {
      key: 'state',
      label: 'Status',
      width: 110,
      cell: (row) => <StateChip state={row.state as AssessmentState} />,
    },
    {
      key: 'team',
      label: 'Team',
      width: 160,
      cell: (row) => (
        <OwnerCell
          ownerInitials={row.ownerInitials as string}
          ownerName={row.ownerName as string}
          collaborators={row.collaborators as string[]}
        />
      ),
    },
    {
      key: 'due',
      label: 'Scheduled',
      width: 112,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.due as string}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      defaultPin: 'right',
      lockPin: true,
      cell: (row) => (
        <RowMenu
          assessment={row as unknown as Assessment}
          onOpenBuilder={() => onOpenBuilder(row as unknown as Assessment)}
        />
      ),
    },
  ]
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function AssessmentsListClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AssessmentState | 'all'>('all')
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<AssessmentType | null>(null)

  const filtered = useMemo(() => {
    let list = MOCK_ASSESSMENTS

    if (activeTab !== 'all') {
      list = list.filter((a) => a.state === activeTab)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.course.toLowerCase().includes(q) ||
          a.ownerName.toLowerCase().includes(q),
      )
    }

    if (filterCourse) {
      list = list.filter((a) => a.course === filterCourse)
    }

    if (filterType) {
      list = list.filter((a) => a.type === filterType)
    }

    return list
  }, [activeTab, search, filterCourse, filterType])

  function tabCount(tabId: AssessmentState | 'all'): number {
    if (tabId === 'all') return MOCK_ASSESSMENTS.length
    return MOCK_ASSESSMENTS.filter((a) => a.state === tabId).length
  }

  function handleRowClick(assessment: Assessment) {
    if (isBuilderState(assessment.state)) {
      router.push('/assessment-builder')
    } else {
      router.push(`/assessments/${assessment.id}`)
    }
  }

  const hasFilters = !!search.trim() || !!filterCourse || !!filterType

  const courses = Array.from(new Set(MOCK_ASSESSMENTS.map((a) => a.course)))

  return (
    <div className="flex flex-col" style={{ minHeight: 0, flex: 1 }}>
      {/* Page header */}
      <PageHeader
        title="Assessments"
        subtitle={`${MOCK_ASSESSMENTS.length} items · Cardiovascular Pharmacology · Last updated now`}
        actions={
          <>
            <Button variant="outline" size="sm">
              <i className="fa-light fa-file-import" aria-hidden="true" />
              Import
            </Button>
            <Button variant="default" size="sm" onClick={() => router.push('/assessment-builder/create')}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Create Assessment
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <KpiStrip />

      {/* Lifecycle tabs */}
      <div
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}
        className="flex items-center gap-1 px-6"
        role="tablist"
        aria-label="Assessment lifecycle"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const count = tabCount(tab.id)
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="relative gap-1.5 py-3 px-1 rounded-none transition-colors"
              style={{
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: isActive ? 500 : 400,
                borderBottom: isActive
                  ? '2px solid var(--brand-color)'
                  : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
              {tab.id !== 'all' && count > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium leading-none tabular-nums"
                  style={{
                    minWidth: '1.25rem',
                    background: 'var(--muted)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {count}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* Filter row */}
      <div
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}
        className="flex items-center gap-2 px-6 py-3"
      >
        <div className="relative w-56">
          <i
            className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments…"
            className="pl-8 h-8 text-sm"
            aria-label="Search assessments"
          />
        </div>

        {/* Course filter pill */}
        <div className="flex items-center gap-1">
          {courses.map((course) => (
            <Button
              key={course}
              variant={filterCourse === course ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilterCourse(filterCourse === course ? null : course)}
              className="rounded-full h-7 text-xs px-3"
              aria-pressed={filterCourse === course}
            >
              Course: {course}
            </Button>
          ))}
        </div>

        {/* Type filter pill */}
        {(['Exam', 'Quiz'] as AssessmentType[]).map((t) => (
          <Button
            key={t}
            variant={filterType === t ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFilterType(filterType === t ? null : t)}
            className="rounded-full h-7 text-xs px-3"
            aria-pressed={filterType === t}
          >
            {t}
          </Button>
        ))}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setFilterCourse(null)
              setFilterType(null)
            }}
            className="ml-1 text-xs text-muted-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table — canonical DataTable (vendored) */}
      <div style={{ flex: 1, minHeight: 0, background: 'var(--background)' }}>
        <DataTable<AssessmentRow>
          data={filtered as AssessmentRow[]}
          columns={buildColumns(handleRowClick)}
          getRowId={(row) => row.id as string}
          getRowSelectionLabel={(row) => row.name as string}
          onRowClick={(row) => handleRowClick(row as unknown as Assessment)}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <i className="fa-light fa-file-lines text-3xl opacity-30" aria-hidden="true" />
              <span className="text-sm">No assessments match the current filters.</span>
            </div>
          }
        />
      </div>

      {/* Info banner */}
      <div className="px-6 pb-6 pt-4">
        <Card className="text-sm">
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <i
              className="fa-duotone fa-star-christmas shrink-0"
              style={{ color: 'var(--brand-color)' }}
              aria-hidden="true"
            />
            <span>
              <strong>Recycle a past assessment to start faster.</strong> Leo can ingest the
              sections, question mix, and historical difficulty from any completed exam — then you
              customize everything.
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
