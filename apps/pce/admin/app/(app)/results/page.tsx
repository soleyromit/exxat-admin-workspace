'use client'

// ============================================================================
// /results — View Survey Results, Results List (Flow 4 · ST-14).
// Role-scoped: ProgramDirector (≙ user.role 'admin') sees the full program
// table; CoreFaculty (≙ 'faculty') sees only their own results as row cards.
// Display status is DERIVED (lib/pce-results.ts): locked → suppressed →
// available. Default sort Term desc + pagination (spec open item E1 resolved).
// DS OS: PageHeader · DataTablePaginated · PersonIdentityCell · StatusBadge ·
// DataRowList. No red — amber replaces the spec's sub-40% red (aarti_no_red).
// Mobbin: Gorgias scored-surveys table · Employment Hero survey admin table.
// ============================================================================

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PageHeader,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  Badge,
  DataTablePaginated,
  DataRowList,
  PersonIdentityCell,
} from '@exxatdesignux/ui'
import type { ColumnDef } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { TruncatedText } from '@/components/truncated-text'
import { usePce } from '@/components/pce/pce-state'
import {
  deriveResults,
  resultsForUser,
  rateColor,
  scoreColor,
  RESULT_STATUS_BADGE,
  type EvalResult,
} from '@/lib/pce-results'
import { MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'

type ResultRow = EvalResult & { termRank: number } & Record<string, unknown>

/** Chronological rank for Term-desc default sort ("Fall 2025" strings don't sort). */
const TERM_RANK = new Map(
  [...MOCK_PROGRAM_TERMS]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((t, i) => [t.name, i]),
)

/** Small semantic tier indicator — color lives in the dot, numbers stay ink
 *  (color discipline: no green/amber number spray across the table). */
function TierDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
    />
  )
}

function ResponsesCell({ r }: { r: EvalResult }) {
  return (
    <div className="text-right">
      <p className="text-sm tabular-nums font-medium text-foreground flex items-center justify-end gap-1.5">
        <TierDot
          color={rateColor(r.responseRate)}
          label={r.responseRate >= 70 ? 'on target' : 'below target'}
        />
        {r.responseRate}%
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {r.responses}/{r.enrolled}
      </p>
    </div>
  )
}

function ScorePill({ r, decimals = 2 }: { r: EvalResult; decimals?: number }) {
  if (r.status !== 'available' || r.avgScore == null) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-foreground">
      <TierDot
        color={scoreColor(r.avgScore)}
        label={r.avgScore >= 4.2 ? 'strong' : r.avgScore >= 3.7 ? 'typical' : 'below threshold'}
      />
      {r.avgScore.toFixed(decimals)}
    </span>
  )
}

function ResultStatusBadge({ r }: { r: EvalResult }) {
  const s = RESULT_STATUS_BADGE[r.status]
  return <StatusBadge label={s.label} tone={s.tone} icon={s.icon} />
}

/* ── Program Director view ────────────────────────────────────────────────── */

function DirectorResults({ results, program }: { results: EvalResult[]; program?: string }) {
  const router = useRouter()
  const [facultyFilter, setFacultyFilter] = useState<string>('all')
  // The two most common queries — "last term" and "what's still in review" —
  // must not require sort-and-scan (research walkthrough, 2026-07-08).
  const [termFilter, setTermFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const scoped = useMemo(
    () => (program ? results.filter((r) => r.program === program) : results),
    [results, program],
  )
  const facultyNames = useMemo(
    () => [...new Set(scoped.map((r) => r.facultyName))].sort((a, b) => a.localeCompare(b)),
    [scoped],
  )
  const termNames = useMemo(
    () =>
      [...new Set(scoped.map((r) => r.term))].sort(
        (a, b) => (TERM_RANK.get(b) ?? -1) - (TERM_RANK.get(a) ?? -1),
      ),
    [scoped],
  )
  const filtered = useMemo(
    () =>
      scoped
        .filter((r) => facultyFilter === 'all' || r.facultyName === facultyFilter)
        .filter((r) => termFilter === 'all' || r.term === termFilter)
        .filter((r) => statusFilter === 'all' || r.status === statusFilter),
    [scoped, facultyFilter, termFilter, statusFilter],
  )
  const anyFilter = facultyFilter !== 'all' || termFilter !== 'all' || statusFilter !== 'all'

  const rows: ResultRow[] = useMemo(
    () => filtered.map((r) => ({ ...r, termRank: TERM_RANK.get(r.term) ?? -1 }) as ResultRow),
    [filtered],
  )

  const columns: ColumnDef<ResultRow>[] = useMemo(
    () => [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        cell: (row) => (
          <div className="min-w-0">
            <p className="text-sm font-medium flex items-center gap-2">
              {row.courseCode}
              {row.coTaught && (
                <Badge variant="secondary" className="font-normal text-xs">
                  Co-taught
                </Badge>
              )}
            </p>
            <TruncatedText className="text-xs text-muted-foreground max-w-[220px]">{row.courseName}</TruncatedText>
          </div>
        ),
      },
      {
        key: 'facultyName',
        label: 'Faculty',
        sortable: true,
        width: 210,
        cell: (row) => (
          <PersonIdentityCell name={row.facultyName} initials={row.facultyInitials} />
        ),
      },
      {
        key: 'term',
        label: 'Term',
        sortable: true,
        sortKey: 'termRank',
        width: 130,
        cell: (row) => (
          <div>
            <p className="text-sm">{row.term}</p>
            {row.academicYear && (
              <p className="text-xs text-muted-foreground">AY {row.academicYear}</p>
            )}
          </div>
        ),
      },
      {
        key: 'responseRate',
        label: 'Responses',
        sortable: true,
        width: 110,
        header: () => <span className="block text-right">Responses</span>,
        cell: (row) => <ResponsesCell r={row} />,
      },
      {
        key: 'avgScore',
        label: 'Avg Score',
        sortable: true,
        width: 110,
        header: () => <span className="block text-right">Avg Score</span>,
        cell: (row) => (
          <div className="text-right">
            <ScorePill r={row} />
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: 190,
        header: () => <span className="block text-right">Status</span>,
        cell: (row) => (
          <div className="flex justify-end">
            <ResultStatusBadge r={row} />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <SiteHeader title="Results" />
      <PageHeader title="Program Evaluation Results" subtitle={program ?? 'All Programs'} />
      <div className="flex-1 px-7 py-4">
        <div className="flex flex-col gap-4 max-w-5xl">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-muted-foreground shrink-0" htmlFor="results-faculty-filter">
              Filter by faculty:
            </label>
            <Select value={facultyFilter} onValueChange={setFacultyFilter}>
              <SelectTrigger id="results-faculty-filter" className="h-8 w-56 text-sm" aria-label="Filter by faculty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculty</SelectItem>
                {facultyNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by term">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {termNames.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="locked">In review</SelectItem>
                <SelectItem value="suppressed">Draft</SelectItem>
              </SelectContent>
            </Select>
            {anyFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="px-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFacultyFilter('all')
                  setTermFilter('all')
                  setStatusFilter('all')
                }}
              >
                Clear filters
              </Button>
            )}
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {anyFilter
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
                : `${facultyNames.length} faculty · ${filtered.length} results`}
            </span>
          </div>

          <div className="-mx-4 lg:-mx-6">
            <DataTablePaginated<ResultRow>
              data={rows}
              columns={columns}
              getRowId={(row) => row.id}
              searchable={false}
              showQueryControls={false}
              defaultSort={{ key: 'term', dir: 'desc' }}
              pagination={{ pageSize: 10 }}
              onRowClick={(row) => router.push(`/results/${encodeURIComponent(row.id)}`)}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-8">
                  <i className="fa-light fa-square-poll-vertical text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                  <p className="text-sm font-medium">No results found for your program.</p>
                  <p className="text-xs text-muted-foreground">
                    Results appear here once surveys close.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Faculty view — row cards, own results only (spec ST-14) ─────────────── */

function FacultyResults({ results }: { results: EvalResult[] }) {
  const rows = useMemo(
    () =>
      [...results].sort(
        (a, b) => (TERM_RANK.get(b.term) ?? -1) - (TERM_RANK.get(a.term) ?? -1),
      ),
    [results],
  )

  return (
    <>
      <SiteHeader title="My Results" />
      <PageHeader
        title="My Evaluation Results"
        subtitle="Post-course evaluation results for your courses."
      />
      <div className="flex-1 px-7 py-4">
        <div className="flex flex-col gap-2 max-w-3xl">
          <DataRowList<EvalResult>
            rows={rows}
            getRowId={(r) => r.id}
            renderRow={(r) => (
              <Link
                href={`/results/${encodeURIComponent(r.id)}`}
                className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 mb-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    {r.courseCode} — {r.courseName}
                    <ResultStatusBadge r={r} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.term}
                    {r.academicYear ? ` · AY ${r.academicYear}` : ''} · {r.program}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {r.responses}/{r.enrolled} responded ({r.responseRate}%)
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  {r.status === 'available' && r.avgScore != null ? (
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: scoreColor(r.avgScore) }}
                    >
                      {r.avgScore.toFixed(1)}/5
                    </span>
                  ) : r.status === 'locked' ? (
                    <span className="text-xs" style={{ color: 'var(--chip-4)' }}>
                      In review
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Draft</span>
                  )}
                  <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" />
                </div>
              </Link>
            )}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-12 rounded-lg border border-dashed border-border bg-muted/25">
                <i className="fa-light fa-square-poll-vertical text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">No results available</p>
                <p className="text-xs text-muted-foreground" style={{ maxWidth: 340, textAlign: 'center' }}>
                  Evaluation results will appear here once surveys close and grades are submitted.
                </p>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}

/* ── Page — role gate (spec ST-14 access control) ────────────────────────── */

export default function ResultsPage() {
  const { user, surveys } = usePce()
  const results = useMemo(() => deriveResults(surveys), [surveys])
  const scoped = useMemo(() => resultsForUser(user, results), [user, results])

  if (user.role === 'admin') return <DirectorResults results={scoped} program={user.program} />
  if (user.role === 'faculty') return <FacultyResults results={scoped} />

  return (
    <>
      <SiteHeader title="Results" />
      <PageHeader title="Results" />
      <div className="flex-1 px-7 py-4">
        <div className="flex flex-col items-center gap-2 py-12 max-w-3xl rounded-lg border border-dashed border-border bg-muted/25">
          <i className="fa-light fa-lock text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
          <p className="text-sm font-medium">No results available for your role.</p>
          <p className="text-xs text-muted-foreground">
            Evaluation results are available to faculty and program leadership.
          </p>
        </div>
      </div>
    </>
  )
}
