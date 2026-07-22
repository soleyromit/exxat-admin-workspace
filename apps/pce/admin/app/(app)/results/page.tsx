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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  programScoreBenchmarks,
  groupByOffering,
  facultyFacingState,
  EVAL_SCOPE_LABEL,
  RESULT_STATUS_BADGE,
  type EvalResult,
  type OfferingGroup,
} from '@/lib/pce-results'
import { MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'
import { withFrom } from '@/lib/pce-nav-origin'

type ResultRow = EvalResult & { termRank: number; members: EvalResult[] } & Record<string, unknown>

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

/** Offering-level badge for split-survey offerings — mixed visibility across
 *  the offering's surveys derives "Partially available" (never stored). */
const OFFERING_BADGE: Record<
  OfferingGroup['offeringState'],
  { label: string; tone: 'success' | 'warning' | 'neutral' | 'info'; icon: string }
> = {
  available: RESULT_STATUS_BADGE.available,
  partial: { label: 'Partially available', tone: 'info', icon: 'fa-circle-half-stroke' },
  'review-pending': RESULT_STATUS_BADGE.locked,
  draft: RESULT_STATUS_BADGE.suppressed,
}

/* ── list-card score cluster (RUBRIC v2 Gate 0 + 3) ───────────────────────────
   Row slots get NUMBERS, not marks: the previous 112px dot track rendered 0.1
   differences at 5.6px under 10px dots — fails the Perceivable-Difference
   test. The score number is the primary encoding; trend and benchmark arrive
   as signed delta chips (self-describing, no legend needed). */

function DeltaChip({ delta, vs }: { delta: number; vs: string }) {
  const up = delta >= 0
  return (
    <Badge
      variant="secondary"
      className="font-normal tabular-nums"
      style={{ color: up ? 'var(--chart-2)' : 'var(--chip-4)' }}
    >
      <i className={`fa-light ${up ? 'fa-arrow-up' : 'fa-arrow-down'}`} aria-hidden="true" />
      {Math.abs(delta).toFixed(2)} {vs}
    </Badge>
  )
}

function FacultyScoreCluster({ r, benchmark }: { r: EvalResult; benchmark: number | null }) {
  if (r.status !== 'available' || r.avgScore == null) return null
  const prev = r.trend.length >= 2 ? r.trend[r.trend.length - 2] : null
  const termDelta = prev ? r.avgScore - prev.value : null
  const progDelta = benchmark != null ? r.avgScore - benchmark : null
  return (
    <>
      {termDelta != null && Math.abs(termDelta) > 0.05 && prev && (
        <DeltaChip delta={termDelta} vs={`vs ${prev.term}`} />
      )}
      {progDelta != null && Math.abs(progDelta) > 0.05 && (
        <DeltaChip delta={progDelta} vs="vs program" />
      )}
      <span
        className="text-sm font-semibold tabular-nums w-16 text-right"
        style={{ color: scoreColor(r.avgScore) }}
      >
        {r.avgScore.toFixed(2)}
        <span className="text-xs font-normal text-muted-foreground">/5</span>
      </span>
    </>
  )
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

  /* One table row per OFFERING × faculty (Romit 2026-07-17): a split
     offering's surveys merge into a single row with stacked per-survey
     values and kind-labeled status chips. Filters run per survey first, so
     filtering by status narrows the merged row to its matching surveys. */
  const rows: ResultRow[] = useMemo(() => {
    const map = new Map<string, EvalResult[]>()
    for (const r of filtered) {
      const k = `${r.offeringId ?? `${r.courseCode}|${r.term}`}|${r.facultyId}`
      map.set(k, [...(map.get(k) ?? []), r])
    }
    const rank = { course: 0, instructor: 1 } as Record<string, number>
    return [...map.values()].map((group) => {
      const members = [...group].sort(
        (a, b) => (rank[a.evalScope ?? ''] ?? 2) - (rank[b.evalScope ?? ''] ?? 2),
      )
      const lead = members.find((m) => m.status === 'available' && m.avgScore != null) ?? members[0]
      return {
        ...members[0],
        avgScore: lead.avgScore,
        members,
        termRank: TERM_RANK.get(members[0].term) ?? -1,
      } as ResultRow
    })
  }, [filtered])

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
        width: 120,
        header: () => <span className="block text-right">Responses</span>,
        cell: (row) => (
          <div className="flex flex-col gap-1.5 items-end">
            {(row.members as EvalResult[]).map((m) => (
              <ResponsesCell key={m.id} r={m} />
            ))}
          </div>
        ),
      },
      {
        key: 'avgScore',
        label: 'Avg Score',
        sortable: true,
        width: 110,
        header: () => <span className="block text-right">Avg Score</span>,
        cell: (row) => (
          <div className="flex flex-col gap-2 items-end text-right">
            {(row.members as EvalResult[]).map((m) => (
              <ScorePill key={m.id} r={m} />
            ))}
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: 230,
        header: () => <span className="block text-right">Status</span>,
        cell: (row) => (
          <div className="flex flex-col gap-1.5 items-end">
            {(row.members as EvalResult[]).map((m) => (
              <span key={m.id} className="inline-flex items-center gap-2">
                {m.evalScope && (
                  <span className="text-xs text-muted-foreground">
                    {m.evalScope === 'course' ? 'Course' : 'Instructor'}
                  </span>
                )}
                {/* Split rows surface the RELEASE divergence to the PD — an
                    available-but-unreleased survey reads "Pending release". */}
                {m.evalScope && m.status === 'available' && !m.releasedToFaculty ? (
                  <StatusBadge label="Pending release" tone="warning" icon="fa-hourglass-half" />
                ) : (
                  <ResultStatusBadge r={m} />
                )}
              </span>
            ))}
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
              <SelectTrigger className="h-8 w-44 text-sm" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Results Available</SelectItem>
                <SelectItem value="locked">Review Pending</SelectItem>
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
              onRowClick={(row) => router.push(withFrom(`/results/${encodeURIComponent(row.id)}`, 'results'))}
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

function FacultyResults({
  results,
  benchmarks,
}: {
  results: EvalResult[]
  benchmarks: Map<string, number>
}) {
  const rows = useMemo(
    () =>
      [...results].sort(
        (a, b) => (TERM_RANK.get(b.term) ?? -1) - (TERM_RANK.get(a.term) ?? -1),
      ),
    [results],
  )
  const groups = useMemo(() => {
    const g = groupByOffering(rows)
    return g.sort((a, b) => (TERM_RANK.get(b.term) ?? -1) - (TERM_RANK.get(a.term) ?? -1))
  }, [rows])

  return (
    <>
      <SiteHeader title="My Results" />
      <PageHeader
        title="My Evaluation Results"
        subtitle="Post-course evaluation results for your courses."
      />
      <div className="flex-1 px-7 py-4">
        <div className="flex flex-col gap-2 max-w-3xl">
          <DataRowList<OfferingGroup>
            rows={groups}
            getRowId={(g) => g.key}
            renderRow={(g) =>
              g.rows.length === 1 ? (
                (() => {
                  const r = g.rows[0]
                  return (
                    <Link
                      href={withFrom(`/results/${encodeURIComponent(r.id)}`, 'results')}
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
                      <div className="shrink-0 flex items-center gap-2">
                        {r.status === 'available' && r.avgScore != null ? (
                          <FacultyScoreCluster r={r} benchmark={benchmarks.get(r.program) ?? null} />
                        ) : r.status === 'locked' ? (
                          <span className="text-xs" style={{ color: 'var(--chip-4)' }}>
                            Review Pending
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Draft</span>
                        )}
                        <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" />
                      </div>
                    </Link>
                  )
                })()
              ) : (
                /* Split-survey offering — one DS Card, one row per survey,
                   each with its OWN status (statuses genuinely diverge). */
                <Card className="mb-2 gap-2 py-3">
                  <CardHeader className="px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 flex-wrap">
                      {g.courseCode} — {g.courseName}
                      <StatusBadge {...OFFERING_BADGE[g.offeringState]} />
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {g.term}
                      {g.academicYear ? ` · AY ${g.academicYear}` : ''} · {g.program}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pt-0 flex flex-col">
                    {g.rows.map((r) => {
                      const state = facultyFacingState(r)
                      return (
                        <Link
                          key={r.id}
                          href={withFrom(`/results/${encodeURIComponent(r.id)}`, 'results')}
                          className="flex items-center gap-4 py-2 border-t border-border rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted/40 -mx-2 px-2"
                        >
                          <span className="flex-1 min-w-0 text-sm truncate">
                            {r.evalScope ? EVAL_SCOPE_LABEL[r.evalScope] : 'Evaluation'}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {r.responses}/{r.enrolled} ({r.responseRate}%)
                          </span>
                          {state === 'score' && r.avgScore != null ? (
                            <span
                              className="text-sm font-semibold tabular-nums w-16 text-right"
                              style={{ color: scoreColor(r.avgScore) }}
                            >
                              {r.avgScore.toFixed(2)}
                              <span className="text-xs font-normal text-muted-foreground">/5</span>
                            </span>
                          ) : state === 'review-pending' ? (
                            <span className="text-xs w-24 text-right" style={{ color: 'var(--chip-4)' }}>
                              Review Pending
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground w-24 text-right">Draft</span>
                          )}
                          <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" />
                        </Link>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            }
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
  // Benchmark from the FULL program result set (aggregate only — no peer rows
  // leak to faculty; experience-principles: cohort-relative, never a rank).
  const benchmarks = useMemo(() => programScoreBenchmarks(results), [results])

  if (user.role === 'admin') return <DirectorResults results={scoped} program={user.program} />
  if (user.role === 'faculty') return <FacultyResults results={scoped} benchmarks={benchmarks} />

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
