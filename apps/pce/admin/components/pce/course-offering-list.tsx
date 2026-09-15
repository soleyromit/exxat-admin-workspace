'use client'

/**
 * By Course landing — Course Offering List (Vishal, 2026-09-15, supersedes the 2026-09-14
 * "Course Leaderboard + toggle" version this file held).
 *
 * Was a per-COURSE leaderboard (one row per course code, aggregated across every offering) with
 * a Course/Faculty ranking toggle Romit had asked to keep ("i need that toggle") the same day it
 * was first built. Retired now on Vishal's explicit read of that same toggle: "remove rank by as
 * user can sort the respective column" — a flat, per-OFFERING list with real sortable columns
 * makes the toggle (and the faculty-ranking half of this card) redundant; the page's own
 * "Faculty" tab already owns faculty ranking on its own.
 *
 * Row grain changed from "one row per course" to "one row per offering" (course × term ×
 * instructor) — `courseOfferingListRows()` (`lib/pce-analytics.ts`, built same 2026-09-14 PRD
 * session but never wired to a screen until now) already returns exactly this shape with
 * AY/Term/Faculty fields the old per-course rows had no way to carry (a course spanning several
 * terms/instructors collapsed them all into one row). "# of Offerings" is gone because every
 * row IS one offering now — the count would always read 1.
 *
 * Two distinct click targets on the same row (Vishal, 2026-09-15): anywhere on the row opens
 * that offering's own single-survey analytics (`/results/[id]`) in a genuinely NEW browser tab
 * — a real `window.open`, unlike the Overview leaderboards' same-tab fix, because this is a
 * different destination (one specific offering's results, not the course-wide tab). The course
 * NAME specifically opens the course-wide analytics tab in THIS browser tab instead, via
 * `onOpenCourse` (same mechanism `AnalyticsOverviewPanel`'s Course Leaderboard now also uses) —
 * `stopPropagation` keeps that click from also firing the row's own new-tab handler.
 *
 * Infinite scroll + Course/Faculty/Role filters (Vishal, 2026-09-15 — "Infinite scroll with lazy
 * loading. No pagination." / "Filters: Course, faculty & role") — exact mirror of
 * `faculty-offering-list.tsx`'s own pattern (same shared `courseOfferingListRows()` rows, same
 * `visibleCount`/`CHUNK` + `IntersectionObserver` + `TableViewMoreFooter` lazy-load, same
 * `filterSlot` portal so the row lives in the page's sticky AY/Term bar instead of scrolling away
 * with the table). This file previously used `DataTablePaginated` with no filters at all — a
 * gap the Course-side audit (2026-09-15 compliance pass) caught by diffing against this file's
 * own Faculty sibling, which already had both.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DataTable, TableViewMoreFooter,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import type { ColumnDef } from '@exxatdesignux/ui'
import { ChartCard, type ChartLeoInsight } from '@/components/charts-core'
import { TokenSelect } from '@/components/pce/courses-evaluatees/scope-controls'
import {
  courseOfferingListRows, medianOf, facultyEvalRoleOptions,
  type CourseOfferingListRow, type FacultyEvalRoleId,
} from '@/lib/pce-analytics'

const fmt2 = (v: number) => v.toFixed(2)
const ALL_FACULTY = '__all__'
const ALL_ROLES = '__all__'
/** Same chunk size as `FacultyOfferingList` — one shared lazy-load rhythm across both landing
 *  lists rather than two independently-tuned numbers for the same interaction. */
const CHUNK = 20

/** Below-threshold rating cell — same treatment as Overview's leaderboards
 *  (`analytics-overview-panel.tsx`'s `RatingCell`): a pale red tint, `--foreground` text. Scoped
 *  exception to the amber house rule (VIZ-004) for this leaderboard family, per the 2026-09-14
 *  PRD. */
function RatingCell({ value, below }: { value: number | null; below: boolean }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  // Same padding whether or not the tint applies (Romit's catch, 2026-09-15) — the un-tinted
  // branch used to render with NO padding at all, so a tinted number's digits started 8px
  // further right than a plain one in the same column, misaligning every row that mixed both.
  return (
    <span
      className="inline-block rounded font-semibold tabular-nums text-foreground"
      style={{ background: below ? 'var(--conditional-rule-red)' : 'transparent', padding: '2px 8px' }}
    >
      {fmt2(value)}
    </span>
  )
}

export function CourseOfferingList({
  terms,
  onOpenCourse,
  filterSlot,
}: {
  /** AY/term scope from the page's own selector above the tabs — the same rows every other
   *  Analytics tab reads for this scope. */
  terms: string[]
  /** Course NAME click → same-tab course analytics (the `tab=course:<code>` scheme). */
  onOpenCourse: (courseCode: string) => void
  /** Portals the Course/Faculty/Role filter row into this DOM node — exact mirror of
   *  `FacultyOfferingList`'s own `filterSlot` prop (see that file's doc comment). Omit to render
   *  the row inline. */
  filterSlot?: HTMLElement | null
}) {
  const termsLabel = terms.length === 1 ? terms[0]! : `${terms.length} terms`
  const roleLabelById = useMemo(() => new Map(facultyEvalRoleOptions().map((r) => [r.id, r.label])), [])

  const allRows = useMemo(() => courseOfferingListRows(terms), [terms])

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

  /** Faculty dropdown depends on Role, same as the Faculty tab's own filter row — its options
   *  narrow to faculty who hold the selected role; a stale selection outside that set is
   *  cleared rather than left selected-but-hidden. */
  const facultyOptions = useMemo(() => {
    const rows = roleFilter ? allRows.filter((r) => r.role === roleFilter) : allRows
    const byId = new Map(rows.map((r) => [r.facultyId, r.facultyName]))
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ id, name }))
  }, [allRows, roleFilter])
  useEffect(() => {
    if (facultyFilter && !facultyOptions.some((f) => f.id === facultyFilter)) setFacultyFilter(undefined)
  }, [facultyOptions, facultyFilter])

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (!courseFilter.length || courseFilter.includes(r.courseCode)) &&
          (!facultyFilter || r.facultyId === facultyFilter) &&
          (!roleFilter || r.role === roleFilter),
      ),
    [allRows, courseFilter, facultyFilter, roleFilter],
  )
  const courseMedian = useMemo(
    () => medianOf(rows.map((r) => r.courseAvg).filter((v): v is number => v != null)),
    [rows],
  )
  const facultyMedian = useMemo(() => medianOf(rows.map((r) => r.facultyAvg)), [rows])

  const [visibleCount, setVisibleCount] = useState(CHUNK)
  useEffect(() => setVisibleCount(CHUNK), [courseFilter, facultyFilter, roleFilter, terms])
  const visibleRows = rows.slice(0, visibleCount)

  /** Auto-load on scroll, `TableViewMoreFooter`'s click affordance stays rendered underneath it
   *  as the keyboard/no-JS path — exact mirror of `FacultyOfferingList`'s own sentinel. */
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visibleCount >= rows.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + CHUNK, rows.length))
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visibleCount, rows.length])

  const columns: ColumnDef<CourseOfferingListRow>[] = useMemo(
    () => [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        sortKey: 'courseCode',
        width: 220,
        cell: (row) => (
          <span
            className="block truncate cursor-pointer hover:underline"
            onClick={(e) => {
              // Own click target, distinct from the row's new-tab handler below.
              e.stopPropagation()
              onOpenCourse(row.courseCode)
            }}
          >
            <span className="font-medium text-foreground">{row.courseCode}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.courseName}</span>
          </span>
        ),
      },
      { key: 'academicYear', label: 'AY', sortable: true, sortKey: 'academicYear', width: 110 },
      { key: 'term', label: 'Term', sortable: true, sortKey: 'term', width: 130 },
      {
        key: 'facultyName',
        label: 'Faculty',
        sortable: true,
        sortKey: 'facultyName',
        width: 160,
        cell: (row) => <span className="block truncate">{row.facultyName}</span>,
      },
      {
        key: 'courseAvg',
        label: 'Course rating',
        sortable: true,
        sortKey: 'courseAvg',
        width: 120,
        cell: (row) => <RatingCell value={row.courseAvg} below={row.courseAvg != null && row.courseAvg < courseMedian} />,
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
        key: 'responseRate',
        label: 'Response rate',
        sortable: true,
        sortKey: 'responseRate',
        width: 120,
        cell: (row) => <span className="tabular-nums">{row.responseRate}%</span>,
      },
    ],
    [courseMedian, facultyMedian, onOpenCourse],
  )

  const leo: ChartLeoInsight | null = useMemo(() => {
    const scored = rows.filter((r) => r.courseAvg != null)
    if (!scored.length) return null
    const worst = [...scored].sort((a, b) => (a.courseAvg as number) - (b.courseAvg as number))[0]!
    const below = rows.filter((r) => (r.courseAvg != null && r.courseAvg < courseMedian) || r.facultyAvg < facultyMedian)
    return {
      headline: `${worst.courseCode} rates lowest at ${fmt2(worst.courseAvg as number)}`,
      explanation: `${below.length} of ${rows.length} offerings fall below the ${fmt2(courseMedian)} course-rating median or the ${fmt2(facultyMedian)} faculty-rating median for ${termsLabel}.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: fmt2(worst.courseAvg as number), label: worst.courseCode },
      bullets: [
        `${worst.courseCode} · ${worst.courseName} · ${worst.term}: ${fmt2(worst.courseAvg as number)} course, ${fmt2(worst.facultyAvg)} faculty.`,
        `${below.length} of ${rows.length} offerings below either median.`,
      ],
    }
  }, [rows, courseMedian, facultyMedian, termsLabel])

  const filterRow = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label id="course-list-course-label" className="text-xs font-medium text-muted-foreground">Course</label>
        <TokenSelect
          labelId="course-list-course-label"
          contentLabel="Filter by course"
          placeholder="All courses"
          options={courseOptions}
          selected={courseFilter}
          onToggle={toggleCourse}
          onClear={() => setCourseFilter([])}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="course-list-faculty">Faculty</label>
        <Select value={facultyFilter ?? ALL_FACULTY} onValueChange={(v) => setFacultyFilter(v === ALL_FACULTY ? undefined : v)}>
          <SelectTrigger id="course-list-faculty" className="h-8 w-48 text-sm" aria-label="Filter by faculty"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FACULTY}>All faculty</SelectItem>
            {facultyOptions.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="course-list-role">Role</label>
        <Select
          value={roleFilter ?? ALL_ROLES}
          onValueChange={(v) => setRoleFilter(v === ALL_ROLES ? undefined : (v as FacultyEvalRoleId))}
          disabled={roleOptions.length === 0}
        >
          <SelectTrigger id="course-list-role" className="h-8 w-44 text-sm" aria-label="Filter by role"><SelectValue /></SelectTrigger>
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
      {/* ChartCard titles are h3 — without a section h2 the document jumps h1 → h3 (axe
          `heading-order`), same real-not-visible section every other panel in this file uses. */}
      <h2 className="sr-only">Course offerings</h2>

      {filterSlot ? createPortal(filterRow, filterSlot) : filterRow}

      <ChartCard hideAskLeo variant="normal" title="Course Leaderboard" leoInsight={leo}>
        <DataTable<CourseOfferingListRow>
          data={visibleRows}
          columns={columns}
          getRowId={(r) => r.id}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          defaultSort={{ key: 'courseAvg', dir: 'asc' }}
          emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No course offerings for {termsLabel} yet.</p>}
          onRowClick={(row) => {
            // Anywhere on the row (except the course-name cell, which stops propagation above)
            // opens THIS offering's single-survey analytics in a genuinely new tab — a
            // different destination from the course-wide tab the name click opens, so a real
            // `window.open`, not the same-tab `onOpenCourse` mechanism.
            if (!row.surveyId) return
            window.open(`/results/${encodeURIComponent(row.surveyId)}?from=analytics`, '_blank', 'noopener,noreferrer')
          }}
        />
        <TableViewMoreFooter
          totalCount={rows.length}
          visibleCount={visibleRows.length}
          onViewMore={() => setVisibleCount((c) => Math.min(c + CHUNK, rows.length))}
          edgeInset={false}
        />
        {/* Auto-load trigger — invisible, sits just below the footer so it enters the viewport
            (rootMargin: 200px) before the reader reaches the bottom of the list. */}
        <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
        <p aria-live="polite" className="sr-only">
          Loaded {visibleRows.length} of {rows.length} course offerings.
        </p>
      </ChartCard>
    </div>
  )
}
