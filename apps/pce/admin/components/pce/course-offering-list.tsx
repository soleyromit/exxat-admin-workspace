'use client'

/**
 * By Course landing — Course Leaderboard (PRD 2026-09-14, revised same day).
 *
 * Started as two pieces — a Course Leaderboard card plus a flat, filterable "every offering"
 * table below it (the PRD's original "Course offering list"). Romit, same day: "remove the
 * course offering list table with filters, keep course leaderboard" — the leaderboard is now
 * the whole landing surface, with a Course/Faculty toggle added so it covers both rankings the
 * flat table used to split across its own filter row.
 *
 * The toggle was pulled once (2026-09-14) on the theory that the page-level "Faculty" tab
 * already owns faculty ranking and a second, thinner one behind this toggle was a confusing
 * duplicate — Romit put it back the same day ("i need that toggle"): the in-place peek at
 * faculty ranking without leaving the Course tab is wanted after all, even with the fuller
 * Faculty tab existing separately. Keep both.
 *
 * Went through two other controls the same day before landing on a `Select`:
 * `ChartCard`'s `variant="tabs"` underline strip — reverted, same visual language as the
 * page's own Overview/Course/Faculty tabs sitting right above it, read as a second level of
 * page navigation rather than a mode switch scoped to this one card; then a segmented
 * `ToggleGroup` "pill" — also reverted (Romit: "the pill design doesn't work"), and checked
 * live via `node tools/ds/source.mjs Toggle`: this DS's `toggleVariants` only has
 * `default`/`outline`/`bare`, no pill/capsule variant exists to reach for, so `outline` was
 * never actually a pill, just bordered segmented buttons. `Select` sidesteps chasing a shape
 * the DS doesn't have — compact, unambiguous, and the same control Overview's Faculty card
 * already uses for its own role filter. DataTablePaginated keeps the `key=` remount trick
 * (see the comment above it) since a ternary doesn't give each mode its own isolated mount
 * the way `ChartCard`'s per-tab `TabsContent` would have.
 *
 * Course Leaderboard: same histogram + ranked-table composition Overview's own Course
 * Leaderboard uses (`analytics-overview-panel.tsx`), duplicated rather than extracted into a
 * shared component — Overview's version has no toggle (a deliberate, separate PRD decision:
 * "the reference's Course/Faculty toggle, which the PRD drops" for THAT tab) and jumps
 * cross-tab via `window.open`; this one toggles in place and opens in-app via
 * `onOpenCourse`/`onOpenFaculty`, different enough surrounding chrome that sharing one
 * component would need several divergent props for not much less code.
 */

import { useMemo, useState } from 'react'
import { DataTablePaginated } from '@exxatdesignux/ui'
import type { ColumnDef } from '@exxatdesignux/ui'
import { ChartCard, type ChartLeoInsight } from '@/components/charts-core'
import { RatingDistributionHistogram } from '@/components/pce/analytics-plots'
import { courseStats, facultyStats, medianOf, offeringPoints, type DualMean } from '@/lib/pce-analytics'

const fmt2 = (v: number) => v.toFixed(2)

interface CourseLeaderboardRow extends Record<string, unknown> {
  courseCode: string
  courseName: string
  offerings: number
  courseScore: number | null
  facultyScore: number | null
  responseRate: number
  /* Each rating column flags against ITS OWN median, independently (same fix as Overview's
     Course Leaderboard, analytics-overview-panel.tsx) — a single shared flag painted a healthy
     Course rating red whenever that course's UNRELATED Faculty rating dipped, and vice versa
     (caught live: a 4.21 course rating shown red because its faculty score was the one below
     median). */
  courseBelow: boolean
  facultyBelow: boolean
}

interface FacultyLeaderboardRow extends Record<string, unknown> {
  facultyId: string
  name: string
  rating: number | null
  responseRate: number
  offerings: number
  belowThreshold: boolean
}

/** Below-threshold rating cell — same treatment as Overview's Course Leaderboard
 *  (`analytics-overview-panel.tsx`'s `RatingCell`): a pale red tint, `--foreground` text (not
 *  `--destructive` — axe failed that pairing at 3.66:1 there). Scoped exception to the amber
 *  house rule (VIZ-004) for this one leaderboard, per the 2026-09-14 PRD. */
function RatingCell({ value, below }: { value: number | null; below: boolean }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  if (!below) return <span className="font-semibold tabular-nums">{fmt2(value)}</span>
  return (
    <span
      className="inline-block rounded font-semibold tabular-nums text-foreground"
      style={{ background: 'var(--conditional-rule-red)', padding: '2px 8px' }}
    >
      {fmt2(value)}
    </span>
  )
}

export function CourseOfferingList({
  terms,
  onOpenCourse,
  onOpenFaculty,
}: {
  /** AY/term scope from the page's own selector above the tabs — the same rows every other
   *  Analytics tab reads for this scope. */
  terms: string[]
  onOpenCourse: (courseCode: string) => void
  onOpenFaculty: (facultyId: string) => void
}) {
  const termsLabel = terms.length === 1 ? terms[0]! : `${terms.length} terms`
  const [view, setView] = useState<'course' | 'faculty'>('course')

  /* ── Course ranking — same shape as Overview's Course Leaderboard. ── */
  const scoredCourses = useMemo(
    () =>
      courseStats(terms).filter(
        (c): c is typeof c & { score: { state: 'value'; value: DualMean } } => c.score.state === 'value',
      ),
    [terms],
  )
  const courseMedian = useMemo(() => medianOf(scoredCourses.map((c) => c.score.value.weighted)), [scoredCourses])
  const courseFacultyMedian = useMemo(
    () =>
      medianOf(
        scoredCourses
          .filter((c): c is typeof c & { facultyScore: { state: 'value'; value: DualMean } } => c.facultyScore.state === 'value')
          .map((c) => c.facultyScore.value.weighted),
      ),
    [scoredCourses],
  )
  const courseRows: CourseLeaderboardRow[] = useMemo(
    () =>
      scoredCourses.map((c) => {
        const facultyVal = c.facultyScore.state === 'value' ? c.facultyScore.value.weighted : null
        const count = offeringPoints().filter((o) => o.courseCode === c.courseCode && terms.includes(o.term)).length
        return {
          courseCode: c.courseCode,
          courseName: c.courseName,
          offerings: count,
          courseScore: c.score.value.weighted,
          facultyScore: facultyVal,
          responseRate: c.responseRate,
          courseBelow: c.score.value.weighted < courseMedian,
          facultyBelow: facultyVal != null && facultyVal < courseFacultyMedian,
        }
      }),
    [scoredCourses, courseMedian, courseFacultyMedian, terms],
  )
  const courseColumns: ColumnDef<CourseLeaderboardRow>[] = useMemo(
    () => [
      {
        key: 'courseCode', label: 'Course', sortable: true, sortKey: 'courseCode', width: 220,
        cell: (row) => (
          <span className="block truncate">
            <span className="font-medium text-foreground">{row.courseCode}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.courseName}</span>
          </span>
        ),
      },
      { key: 'offerings', label: '# of Offerings', sortable: true, sortKey: 'offerings', width: 120, cell: (row) => <span className="tabular-nums">{row.offerings}</span> },
      { key: 'courseScore', label: 'Course rating', sortable: true, sortKey: 'courseScore', width: 120, cell: (row) => <RatingCell value={row.courseScore} below={row.courseBelow} /> },
      { key: 'facultyScore', label: 'Faculty rating', sortable: true, sortKey: 'facultyScore', width: 120, cell: (row) => <RatingCell value={row.facultyScore} below={row.facultyBelow} /> },
      { key: 'responseRate', label: 'Response rate', sortable: true, sortKey: 'responseRate', width: 120, cell: (row) => <span className="tabular-nums">{row.responseRate}%</span> },
    ],
    [],
  )
  const courseLeo: ChartLeoInsight | null = useMemo(() => {
    if (!courseRows.length) return null
    const worst = [...courseRows].sort((a, b) => (a.courseScore ?? 99) - (b.courseScore ?? 99))[0]!
    const below = courseRows.filter((r) => r.courseBelow || r.facultyBelow)
    return {
      headline: `${worst.courseCode} rates lowest at ${worst.courseScore != null ? fmt2(worst.courseScore) : '—'}`,
      explanation: `${below.length} of ${courseRows.length} courses fall below the ${fmt2(courseMedian)} course-rating median or the ${fmt2(courseFacultyMedian)} faculty-rating median for ${termsLabel}.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: worst.courseScore != null ? fmt2(worst.courseScore) : '—', label: worst.courseCode },
      bullets: [
        `${worst.courseCode} · ${worst.courseName}: ${worst.courseScore != null ? fmt2(worst.courseScore) : '—'} course, ${worst.facultyScore != null ? fmt2(worst.facultyScore) : '—'} faculty.`,
        `${below.length} of ${courseRows.length} courses below threshold.`,
      ],
    }
  }, [courseRows, courseMedian, courseFacultyMedian, termsLabel])

  /* ── Faculty ranking — same shape as Overview's Faculty Leaderboard, minus its own Role
     toggle (this card's toggle already switches the whole card between the two rankings; a
     second, nested toggle for role would be one control too many here). ── */
  const scoredFaculty = useMemo(() => facultyStats(terms).filter((f) => f.score.state === 'value'), [terms])
  const facultyMedian = useMemo(
    () => medianOf(scoredFaculty.map((f) => (f.score as { state: 'value'; value: DualMean }).value.weighted)),
    [scoredFaculty],
  )
  const facultyRows: FacultyLeaderboardRow[] = useMemo(
    () =>
      scoredFaculty.map((f) => {
        const rating = (f.score as { state: 'value'; value: DualMean }).value.weighted
        return {
          facultyId: f.facultyId,
          name: f.name,
          rating,
          responseRate: f.responseRate,
          offerings: f.offerings,
          belowThreshold: rating < facultyMedian,
        }
      }),
    [scoredFaculty, facultyMedian],
  )
  const facultyColumns: ColumnDef<FacultyLeaderboardRow>[] = useMemo(
    () => [
      { key: 'name', label: 'Faculty', sortable: true, sortKey: 'name', width: 220 },
      { key: 'rating', label: 'Rating', sortable: true, sortKey: 'rating', width: 120, cell: (row) => <RatingCell value={row.rating} below={row.belowThreshold} /> },
      { key: 'responseRate', label: 'Response rate', sortable: true, sortKey: 'responseRate', width: 130, cell: (row) => <span className="tabular-nums">{row.responseRate}%</span> },
      { key: 'offerings', label: 'Offerings', sortable: true, sortKey: 'offerings', width: 100, cell: (row) => <span className="tabular-nums">{row.offerings}</span> },
    ],
    [],
  )
  const facultyLeo: ChartLeoInsight | null = useMemo(() => {
    if (!facultyRows.length) return null
    const worst = [...facultyRows].sort((a, b) => (a.rating ?? 99) - (b.rating ?? 99))[0]!
    const below = facultyRows.filter((r) => r.belowThreshold)
    return {
      headline: `${worst.name} rates lowest at ${worst.rating != null ? fmt2(worst.rating) : '—'}`,
      explanation: `${below.length} of ${facultyRows.length} faculty fall below the ${fmt2(facultyMedian)} rating median for ${termsLabel}.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: worst.rating != null ? fmt2(worst.rating) : '—', label: worst.name },
      bullets: [
        `${worst.name}: ${worst.rating != null ? fmt2(worst.rating) : '—'} across ${worst.offerings} offering${worst.offerings === 1 ? '' : 's'}.`,
        `${below.length} of ${facultyRows.length} faculty below the median.`,
      ],
    }
  }, [facultyRows, facultyMedian, termsLabel])

  const isCourse = view === 'course'

  return (
    <div className="flex flex-col gap-4">
      {/* ChartCard titles are h3 — without a section h2 the document jumps h1 → h3 (axe
          `heading-order`), same real-not-visible section every other panel in this file uses. */}
      <h2 className="sr-only">Course offerings</h2>

      <ChartCard
        hideAskLeo
        // `variant="selector"` puts the Select in the HEADER, next to the title — same DS
        // mechanism as Overview's Faculty role filter, and the same fix already applied to
        // Overview's own leaderboards (card-level controls belong in the header, not floating
        // in the body above content they aren't about). Labels are "Rank by course"/"Rank by
        // faculty" rather than bare "Course"/"Faculty" — a closed Select showing just "Course"
        // doesn't say what selecting it DOES; the verb makes the collapsed value self-explanatory.
        variant="selector"
        title="Course Leaderboard"
        description={isCourse
          ? `${courseRows.length} course${courseRows.length === 1 ? '' : 's'} in ${termsLabel}, ranked by rating`
          : `${facultyRows.length} faculty in ${termsLabel}, ranked by rating`}
        leoInsight={isCourse ? courseLeo : facultyLeo}
        filterOptions={[
          { value: 'course', label: 'Rank by course' },
          { value: 'faculty', label: 'Rank by faculty' },
        ]}
        defaultFilter={view}
        onFilterChange={(v) => setView(v as 'course' | 'faculty')}
      >
        {/* `gap-4` — ChartCard's own CardContent has no gap, so these were flush against each
            other with zero spacing. */}
        <div className="flex flex-col gap-4">
          {isCourse ? (
            <>
              <p className="text-xs font-medium text-muted-foreground -mb-2">Rating distribution</p>
              <RatingDistributionHistogram values={courseRows.map((r) => r.courseScore).filter((v): v is number => v != null)} />
              {/* `key` forces a full remount on toggle — without it, React reuses the same
                  DataTablePaginated instance across the Course/Faculty switch (same JSX
                  position, same component type), so its INTERNAL column-order/sort state
                  (initialized once from the first mount's columns) survives the `columns`/
                  `defaultSort` prop change instead of resetting. Caught live: toggling to
                  Faculty rendered a shuffled column order and descending sort even though
                  `defaultSort` said ascending — the mounted instance was still carrying course
                  columns' internal order state. */}
              <DataTablePaginated<CourseLeaderboardRow>
                key="course"
                data={courseRows}
                columns={courseColumns}
                getRowId={(r) => r.courseCode}
                selectable={false}
                searchable={false}
                showQueryControls={false}
                edgeInset={false}
                defaultSort={{ key: 'courseScore', dir: 'asc' }}
                pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
                emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No scored courses for {termsLabel} yet.</p>}
                onRowClick={(row) => onOpenCourse(row.courseCode)}
              />
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground -mb-2">Rating distribution</p>
              <RatingDistributionHistogram values={facultyRows.map((r) => r.rating).filter((v): v is number => v != null)} />
              <DataTablePaginated<FacultyLeaderboardRow>
                key="faculty"
                data={facultyRows}
                columns={facultyColumns}
                getRowId={(r) => r.facultyId}
                selectable={false}
                searchable={false}
                showQueryControls={false}
                edgeInset={false}
                defaultSort={{ key: 'rating', dir: 'asc' }}
                pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
                emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No scored faculty for {termsLabel} yet.</p>}
                onRowClick={(row) => onOpenFaculty(row.facultyId)}
              />
            </>
          )}
        </div>
      </ChartCard>
    </div>
  )
}
