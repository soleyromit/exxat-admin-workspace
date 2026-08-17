'use client'

/**
 * Overview row 3 — the raw grain, and the end of the funnel.
 *
 * §2.1 describes Overview as a deliberate **aggregate → rank → pattern → raw** sequence.
 * Ours stopped at "pattern": four charts explaining a program, with no way to reach the thing
 * they were explaining. This is "raw", and the round trip §3 asks for — "every aggregate is
 * meant to be a door" — lands here, at what Monil calls the final node.
 *
 * ── Why this reads offerings, not deriveResults() ──────────────────────────────
 * The obvious build was `deriveResults(MOCK_SURVEYS)`: it has result ids, statuses and
 * suppression already. It also disagrees with every chart on this tab, because MOCK_SURVEYS
 * and MOCK_FACULTY_OFFERINGS are two unreconciled universes. Verified:
 *   · DPT-505 is "Biomechanics I" in offerings and "Neuroanatomy" in surveys
 *   · DPT-502 is "Exercise Physiology" vs "Physiology & Pathophysiology"
 *   · DPT-710 / 711 / 801 / 506 exist only in offerings; DPT-504 / 511 / 520 only in surveys
 *   · co-taught instructors come back byte-identical (`deriveResultsForSurvey` hands every
 *     instructor on a survey the same avgScore), so the table showed two faculty with the
 *     same 4.20 on the same course
 * Putting that table under charts built from offerings would ship the exact "numbers disagree
 * with each other" bug this layer exists to prevent — at the bottom of the tab that explains
 * them. So the register derives from the same grain as the charts, and links to a result only
 * where the offering actually carries a surveyId.
 *
 * Sorted newest-first, not worst-first: the charts above already rank by weakness, and a
 * register you look things up in should be chronological.
 *
 * DataTable from the DS package, not the vendored copy — DS-023 bans the vendored import in
 * new files (analytics-panels.tsx predates the rule). The ColumnDef shape is identical.
 */

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DataTablePaginated, Avatar, AvatarFallback, StatusBadge } from '@exxatdesignux/ui'
import type { ColumnDef } from '@exxatdesignux/ui'
import { TruncatedText } from '@/components/truncated-text'
import { MINIMUM_THRESHOLD } from '@/lib/pce-results'
import {
  offeringPoints, compareTerms, medianOf, courseStats, facultyStats, RESPONSE_TARGET,
} from '@/lib/pce-analytics'

interface Row extends Record<string, unknown> {
  id: string
  term: string
  courseCode: string
  courseName: string
  facultyName: string
  initials: string
  courseAvg: number | null
  facultyAvg: number
  responseRate: number
  responded: number
  enrolled: number
  suppressed: boolean
  surveyId?: string
}

/* Amber below 3.7, brand 3.7–4.3, green at or above 4.3 — never red (VIZ-004, Aarti).
   Same tiers analytics-panels uses, so a score means one thing across the product. */
/* Below the median is amber, everything else plain — the same rule as the By Term breakdown
   and every chart. See the long note on `belowMedianColor` in analytics-panels.tsx: this file
   had its own copy of the old absolute ladder, brand middle tier and all, so the register and
   the tables were colouring the same numbers by different rules. */
const belowMedianColor = (v: number, median: number) =>
  v < median ? 'var(--chip-4)' : 'var(--foreground)'

const scoreCell = (v: number | null, suppressed: boolean, median: number) => (
  <div
    className="text-right text-sm font-semibold tabular-nums"
    style={{ color: v != null && !suppressed ? belowMedianColor(v, median) : 'var(--muted-foreground)' }}
  >
    {suppressed ? '—' : v != null ? v.toFixed(2) : '—'}
  </div>
)

/* Factory — the score cells need medians to split on, and a module const can't hold them.
   Program medians, matching the Overview charts, so a row flagged here is flagged there. */
const columnsFor = (courseMedian: number, facultyMedian: number): ColumnDef<Row>[] => [
  {
    key: 'term', label: 'Term', sortable: true, width: 110,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.term}</span>,
  },
  {
    key: 'courseCode', label: 'Course', sortable: true,
    cell: (row) => (
      <div>
        <p className="text-sm font-medium">{row.courseCode}</p>
        <TruncatedText className="text-xs text-muted-foreground max-w-[200px]">{row.courseName}</TruncatedText>
      </div>
    ),
  },
  {
    key: 'facultyName', label: 'Faculty', sortable: true, width: 180,
    cell: (row) => (
      <div className="flex w-fit items-center gap-1.5">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback
            className="text-xs"
            style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
          >
            {row.initials}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium">{row.facultyName}</span>
      </div>
    ),
  },
  {
    // Both rated entities, never merged into one "score" (D7/D27).
    key: 'courseAvg', label: 'Content', sortable: true, width: 92,
    header: () => <span className="block text-right">Content</span>,
    cell: (row) => scoreCell(row.courseAvg, row.suppressed, courseMedian),
  },
  {
    key: 'facultyAvg', label: 'Teaching', sortable: true, width: 92,
    header: () => <span className="block text-right">Teaching</span>,
    cell: (row) => scoreCell(row.facultyAvg, row.suppressed, facultyMedian),
  },
  {
    key: 'responseRate', label: 'Response', sortable: true, width: 118,
    header: () => <span className="block text-right">Response</span>,
    cell: (row) => (
      <div className="text-right">
        <span className="block text-sm font-semibold tabular-nums" style={{ color: row.responseRate < RESPONSE_TARGET ? 'var(--chip-4)' : 'var(--foreground)' }}>
          {row.responseRate}%
        </span>
        {/* Frequency alongside the rate — Aarti D17: "8 of 20" beats "40%". */}
        <span className="block text-xs tabular-nums text-muted-foreground">
          {row.responded} of {row.enrolled}
        </span>
      </div>
    ),
  },
  {
    key: 'status', label: 'Result', sortable: true, width: 150,
    cell: (row) =>
      row.suppressed ? (
        <StatusBadge label="Suppressed" tone="neutral" icon="fa-eye-slash" />
      ) : row.surveyId ? (
        <StatusBadge label="Available" tone="success" icon="fa-circle-check" />
      ) : (
        <span className="text-xs text-muted-foreground">Archived offering</span>
      ),
  },
]

export function AnalyticsSurveyDetails() {
  /* Program medians — same split the Overview charts use, so the raw register and the charts
     above it never disagree about which numbers are flagged. */
  const columns = useMemo(
    () => columnsFor(
      medianOf(courseStats().map(c => c.score.weighted)),
      medianOf(facultyStats().map(f => f.score.weighted)),
    ),
    [],
  )

  const router = useRouter()

  const rows = useMemo<Row[]>(
    () =>
      offeringPoints()
        .map((o) => ({
          id: `${o.facultyId}:${o.courseCode}:${o.term}`,
          term: o.term,
          courseCode: o.courseCode,
          courseName: o.courseName,
          facultyName: o.facultyName,
          initials: o.initials,
          courseAvg: o.courseAvg ?? null,
          facultyAvg: o.avgRating,
          responseRate: o.responseRate,
          responded: o.responded,
          enrolled: o.enrolled,
          // The anonymity gate is settled and applies here too — a register that shows a
          // score the result page would withhold defeats the gate. So compare against the
          // OFFERING's threshold (its survey's override, else the program default), which
          // is what `pce-results` gates on. The bare constant happens to agree on today's
          // fixture and would stop agreeing the moment a survey raises its own gate.
          suppressed: o.responded < o.minimumThreshold,
          surveyId: o.surveyId,
        }))
        .sort((a, b) => compareTerms(b.term, a.term) || a.courseCode.localeCompare(b.courseCode)),
    [],
  )

  const suppressed = rows.filter((r) => r.suppressed).length
  const linkable = rows.filter((r) => r.surveyId).length

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">Every offering</h2>
      <p className="text-xs text-muted-foreground">
        One row per course, term and instructor · {linkable} of {rows.length} open a result
        {suppressed > 0 && (
          <> {suppressed} {suppressed === 1 ? 'is' : 'are'} suppressed below the anonymity
          threshold and show no score — {MINIMUM_THRESHOLD} responses by default, though a
          survey can set its own.</>
        )}
      </p>
      <div className="-mx-4 lg:-mx-6">
        {/* Paginated, not the full 106-row scroll. This is the funnel's `raw` step (§2.1) — a
            register you look things up in, so it has to stay reachable; but a dashboard shows a
            page of it, not all of it. `DataTablePaginated` is the DS primitive for exactly this;
            10 rows matches the §2.1 reference (22 rows) far better than rendering every row. */}
        <DataTablePaginated<Row>
          data={rows}
          columns={columns}
          pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50, 100] }}
          getRowId={(row) => row.id}
          searchable
          toolbarSlot={() => null}
          onRowClick={(row) =>
            row.surveyId && router.push(`/results/${encodeURIComponent(row.surveyId)}?from=analytics`)
          }
          emptyState={
            <div className="flex flex-col items-center gap-2 py-8">
              <i className="fa-light fa-clipboard-list text-2xl text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No evaluated offerings yet</p>
              <p className="text-xs text-muted-foreground">Rows appear here once a survey closes.</p>
            </div>
          }
        />
      </div>
    </div>
  )
}
