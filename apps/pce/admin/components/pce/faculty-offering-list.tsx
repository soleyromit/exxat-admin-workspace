'use client'

/**
 * By Faculty landing — Faculty Offering List (PRD 2026-09-15, Romit).
 *
 * One row per faculty × course offering — a faculty teaching two courses gets two rows.
 * Built on `courseOfferingListRows()` (`lib/pce-analytics.ts`), the SAME canonical rows
 * `CourseOfferingList` (the Course tab's own landing list) already uses — this list is those
 * rows re-sorted by faculty name with the Role field rendered (present on every row already,
 * just never surfaced by the Course-axis list) rather than a second, possibly-drifting query
 * for the same fact family.
 *
 * Two distinct click targets per row, mirroring `CourseOfferingList`'s own pair: anywhere on
 * the row opens that offering's single-survey analytics in a genuinely NEW browser tab (a real
 * `window.open`); the faculty NAME opens that person's Faculty Analytics as a closable tab
 * INSIDE this browser tab, via `onOpenFaculty` (the `openFacultyTab` mechanism in
 * `app/(app)/analytics/page.tsx`, mirroring `openCourseTab`) — `stopPropagation` keeps that
 * click from also firing the row's new-tab handler. The "View details" action column repeats
 * the row's own destination as a real, keyboard-reachable `<Button>`: the DS DataTable's
 * `onRowClick` renders a bare `onClick` on `<tr>` with no `tabIndex`/`onKeyDown`, so whole-row
 * click alone has no keyboard path (WCAG 2.1.1).
 *
 * Infinite scroll, no pagination (PRD, explicit) — no DS primitive for this exists yet (only
 * `DataTablePaginated`'s page-number bar and `TableViewMoreFooter`'s click-to-expand footer).
 * Built on the SAME `visibleCount` + base `DataTable` + `TableViewMoreFooter` pattern already
 * shipping in this codebase (`dashboard-home.tsx`'s term-history tables) — the base `DataTable`
 * takes whatever `data` it's given with no pager of its own, so slicing `data` to
 * `visibleCount` before passing it in IS the lazy-load. An `IntersectionObserver` sentinel
 * layers the "scrolls in automatically" behavior on top of that same, already-proven
 * click-to-expand foundation; `TableViewMoreFooter`'s button stays rendered underneath it as
 * the keyboard/no-JS/screen-reader path, per its own accessible contract.
 *
 * Known tradeoff, inherited from that same shipping pattern: the DS `DataTable`'s column-sort
 * click handler sorts whatever `data` it is CURRENTLY given, not a caller-supplied global
 * order — sorting therefore applies to the rows loaded so far, not the full filtered set not
 * yet fetched into view. Standard infinite-scroll behavior (same as, e.g., GitHub's issue
 * lists); the default sort (faculty name, A→Z) keeps the common browse path consistent as more
 * rows load in.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Button, DataTable, TableViewMoreFooter,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import type { ColumnDef } from '@exxatdesignux/ui'
import { ChartCard, type ChartLeoInsight } from '@/components/charts-core'
import { TokenSelect } from '@/components/pce/courses-evaluatees/scope-controls'
import {
  courseOfferingListRows, RATING_THRESHOLD, facultyEvalRoleOptions,
  type CourseOfferingListRow, type FacultyEvalRoleId,
} from '@/lib/pce-analytics'

const fmt2 = (v: number) => v.toFixed(2)
const ALL_FACULTY = '__all__'
const ALL_ROLES = '__all__'
/** Rows revealed per "page" of lazy-load — the mock dataset scoped to one term is well under
 *  this, so the sentinel/footer stay visually inert until a wider AY/Term scope makes them
 *  demonstrable; a smaller chunk would trigger sooner but chop realistic scopes into more
 *  clicks than they need. */
const CHUNK = 20

/** Below-median rating tint — same treatment as the Course list's own `RatingCell`
 *  (`course-offering-list.tsx`). Duplicated rather than imported: a 10-line presentational
 *  function is not worth a cross-file dependency between two sibling lists that may still
 *  diverge (e.g. if Faculty ever needs a different threshold rule). */
function RatingCell({ value, below }: { value: number; below: boolean }) {
  return (
    <span
      className="inline-block rounded font-semibold tabular-nums text-foreground"
      style={{ background: below ? 'var(--conditional-rule-red)' : 'transparent', padding: '2px 8px' }}
    >
      {fmt2(value)}
    </span>
  )
}

export function FacultyOfferingList({
  terms,
  onOpenFaculty,
  filterSlot,
}: {
  /** AY/term scope from the page's own selector above the tabs — "offered in the selected
   *  AY/terms" (PRD), the same rows every other Analytics tab reads for this scope. */
  terms: string[]
  /** Faculty NAME click → the faculty's own Faculty Analytics, as a new tab in this browser
   *  tab (the `tab=faculty:<id>` scheme). */
  onOpenFaculty: (facultyId: string) => void
  /**
   * Portals the Course/Faculty/Role filter row into this DOM node instead of rendering it
   * inline above the table — Romit, 2026-09-15: "migrate these filter to the sticky filter...
   * whenever I am at the faculty tab, there shouldn't be any filter [below the tab strip]."
   * Same mechanism `ByCoursePanel`'s own Faculty filter already uses (`facultyFilterSlot` in
   * `app/(app)/analytics/page.tsx`) — the slot lives in the page's sticky AY/Term row, visible
   * only while this tab is active. Omit to render the row inline (e.g. a future standalone
   * usage with no such slot to join).
   */
  filterSlot?: HTMLElement | null
}) {
  const termsLabel = terms.length === 1 ? terms[0]! : `${terms.length} terms`
  const roleLabelById = useMemo(() => new Map(facultyEvalRoleOptions().map((r) => [r.id, r.label])), [])

  const allRows = useMemo(
    () =>
      courseOfferingListRows(terms)
        .slice()
        .sort((a, b) => a.facultyName.localeCompare(b.facultyName) || a.term.localeCompare(b.term)),
    [terms],
  )

  const courseOptions = useMemo(() => {
    const byCode = new Map(allRows.map((r) => [r.courseCode, r.courseName]))
    return [...byCode.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, name]) => ({ value, label: `${value} · ${name}` }))
  }, [allRows])
  const roleOptions = useMemo(() => {
    const present = new Set(allRows.map((r) => r.role))
    return facultyEvalRoleOptions().filter((r) => present.has(r.id))
  }, [allRows])

  const [courseFilter, setCourseFilter] = useState<string[]>([])
  const [facultyFilter, setFacultyFilter] = useState<string | undefined>(undefined)
  const [roleFilter, setRoleFilter] = useState<FacultyEvalRoleId | undefined>(undefined)
  const toggleCourse = (v: string) =>
    setCourseFilter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))

  /** Faculty dropdown is dependent on Role (Romit, 2026-09-15) — its option list narrows to
   *  only faculty who hold the selected role, not every faculty in scope. A stale selection
   *  left over from a wider role is cleared rather than silently kept selected-but-hidden. */
  const facultyOptions = useMemo(() => {
    const rows = roleFilter ? allRows.filter((r) => r.role === roleFilter) : allRows
    const byId = new Map(rows.map((r) => [r.facultyId, r.facultyName]))
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ id, name }))
  }, [allRows, roleFilter])
  useEffect(() => {
    if (facultyFilter && !facultyOptions.some((f) => f.id === facultyFilter)) setFacultyFilter(undefined)
  }, [facultyOptions, facultyFilter])

  const filteredRows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (!courseFilter.length || courseFilter.includes(r.courseCode)) &&
          (!facultyFilter || r.facultyId === facultyFilter) &&
          (!roleFilter || r.role === roleFilter),
      ),
    [allRows, courseFilter, facultyFilter, roleFilter],
  )
  // Fixed `RATING_THRESHOLD` (4.0), not a per-selection median — same flag rule as every other
  // list/leaderboard in Analytics and the Dashboard KPI band (2026-09-16).
  const facultyMedian = RATING_THRESHOLD

  const [visibleCount, setVisibleCount] = useState(CHUNK)
  useEffect(() => setVisibleCount(CHUNK), [courseFilter, facultyFilter, roleFilter, terms])
  const visibleRows = filteredRows.slice(0, visibleCount)

  /** Auto-load on scroll, layered on top of `TableViewMoreFooter`'s own click affordance
   *  (which stays rendered as the keyboard/no-JS path — see the file's own doc comment). */
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visibleCount >= filteredRows.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + CHUNK, filteredRows.length))
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visibleCount, filteredRows.length])

  const columns: ColumnDef<CourseOfferingListRow>[] = useMemo(
    () => [
      {
        key: 'facultyName',
        label: 'Faculty',
        sortable: true,
        sortKey: 'facultyName',
        width: 180,
        cell: (row) => (
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onOpenFaculty(row.facultyId)
            }}
          >
            {row.facultyName}
          </Button>
        ),
      },
      {
        key: 'role',
        label: 'Role',
        sortable: true,
        sortKey: 'role',
        width: 150,
        cell: (row) => <span className="text-sm">{roleLabelById.get(row.role) ?? row.role}</span>,
      },
      { key: 'academicYear', label: 'AY', sortable: true, sortKey: 'academicYear', width: 100 },
      { key: 'term', label: 'Term', sortable: true, sortKey: 'term', width: 130 },
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        sortKey: 'courseCode',
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.courseCode}</p>
            <p className="truncate text-xs text-muted-foreground">{row.courseName}</p>
          </div>
        ),
      },
      {
        key: 'facultyAvg',
        label: 'Faculty rating',
        sortable: true,
        sortKey: 'facultyAvg',
        width: 120,
        cell: (row) => <RatingCell value={row.facultyAvg} below={row.facultyAvg < facultyMedian} />,
      },
      {
        key: 'actions',
        label: 'Action',
        width: 90,
        resizable: false,
        cell: (row) =>
          row.surveyId ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`View details for ${row.facultyName}, ${row.courseCode}`}
              onClick={(e) => {
                e.stopPropagation()
                window.open(`/results/${encodeURIComponent(row.surveyId!)}?from=analytics`, '_blank', 'noopener,noreferrer')
              }}
            >
              <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
            </Button>
          ) : null,
      },
    ],
    [facultyMedian, roleLabelById, onOpenFaculty],
  )

  const leo: ChartLeoInsight | null = useMemo(() => {
    const scored = filteredRows.filter((r) => r.facultyAvg != null)
    if (!scored.length) return null
    const worst = [...scored].sort((a, b) => a.facultyAvg - b.facultyAvg)[0]!
    const below = filteredRows.filter((r) => r.facultyAvg < facultyMedian)
    return {
      headline: `${worst.facultyName} rates lowest at ${fmt2(worst.facultyAvg)}`,
      explanation: `${below.length} of ${filteredRows.length} offerings fall below the ${RATING_THRESHOLD.toFixed(1)} faculty-rating threshold for ${termsLabel}.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: fmt2(worst.facultyAvg), label: worst.facultyName },
      bullets: [
        `${worst.facultyName} · ${worst.courseCode} · ${worst.term}: ${fmt2(worst.facultyAvg)}.`,
        `${below.length} of ${filteredRows.length} offerings below the ${RATING_THRESHOLD.toFixed(1)} threshold.`,
      ],
    }
  }, [filteredRows, facultyMedian, termsLabel])

  const filterRow = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label id="faculty-list-course-label" className="text-xs font-medium text-muted-foreground">Course</label>
        <TokenSelect
          labelId="faculty-list-course-label"
          contentLabel="Filter by course"
          placeholder="All courses"
          options={courseOptions}
          selected={courseFilter}
          onToggle={toggleCourse}
          onClear={() => setCourseFilter([])}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="faculty-list-faculty">Faculty</label>
        <Select value={facultyFilter ?? ALL_FACULTY} onValueChange={(v) => setFacultyFilter(v === ALL_FACULTY ? undefined : v)}>
          <SelectTrigger id="faculty-list-faculty" className="h-8 w-48 text-sm" aria-label="Filter by faculty"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FACULTY}>All faculty</SelectItem>
            {facultyOptions.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="faculty-list-role">Role</label>
        <Select
          value={roleFilter ?? ALL_ROLES}
          onValueChange={(v) => setRoleFilter(v === ALL_ROLES ? undefined : (v as FacultyEvalRoleId))}
          disabled={roleOptions.length === 0}
        >
          <SelectTrigger id="faculty-list-role" className="h-8 w-44 text-sm" aria-label="Filter by role"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All roles</SelectItem>
            {roleOptions.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="sr-only">Faculty offerings</h2>

      {filterSlot ? createPortal(filterRow, filterSlot) : filterRow}

      <ChartCard hideAskLeo variant="normal" title="Faculty offerings" leoInsight={leo}>
        <DataTable<CourseOfferingListRow>
          data={visibleRows}
          columns={columns}
          getRowId={(r) => r.id}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          defaultSort={{ key: 'facultyName', dir: 'asc' }}
          emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No faculty offerings for {termsLabel} yet.</p>}
          onRowClick={(row) => {
            if (!row.surveyId) return
            window.open(`/results/${encodeURIComponent(row.surveyId)}?from=analytics`, '_blank', 'noopener,noreferrer')
          }}
        />
        <TableViewMoreFooter
          totalCount={filteredRows.length}
          visibleCount={visibleRows.length}
          onViewMore={() => setVisibleCount((c) => Math.min(c + CHUNK, filteredRows.length))}
          edgeInset={false}
        />
        {/* Auto-load trigger — invisible, sits just below the footer so it enters the viewport
            (rootMargin: 200px) before the reader reaches the bottom of the list. */}
        <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
        <p aria-live="polite" className="sr-only">
          Loaded {visibleRows.length} of {filteredRows.length} faculty offerings.
        </p>
      </ChartCard>
    </div>
  )
}
