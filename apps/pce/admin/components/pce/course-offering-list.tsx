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
 * The course NAME opens the course-wide analytics tab in THIS browser tab, via `onOpenCourse`
 * (same mechanism `AnalyticsOverviewPanel`'s Course Leaderboard also uses).
 *
 * Infinite scroll + Course/Faculty/Role filters (Vishal, 2026-09-15 — "Infinite scroll with lazy
 * loading. No pagination." / "Filters: Course, faculty & role") — exact mirror of
 * `faculty-offering-list.tsx`'s own pattern (same `visibleCount`/`CHUNK` + `IntersectionObserver`
 * + `TableViewMoreFooter` lazy-load, same `filterSlot` portal so the row lives in the page's
 * sticky AY/Term bar instead of scrolling away with the table).
 *
 * Row grain regrouped to course × term × cohort (Vishal, 2026-09-16: "a row can have more than
 * one faculty... show role along with faculty name") — `courseOfferingGroupedRows()`
 * (`lib/pce-analytics.ts`) folds every section/instructor that ran under the same
 * course+term+cohort into one row's `faculty[]` list, confirmed against the fixture data as
 * genuinely DIFFERENT sections (different roster, response rate, and course rating per faculty
 * line) rather than one section with a co-teacher — so every per-faculty metric stays a stacked
 * per-line list, never averaged into one shared number. Faculty name + role render together,
 * avatar-led, one line per section — same stacked anatomy the push wizard's own multi-faculty
 * cell uses (`step-courses-evaluatees.tsx`'s flow-ledger column: `PersonAvatar` + name +
 * `· role`), which is the "similar design as in survey distribution" the feedback pointed at.
 * The Course/Faculty rating and Response rate columns are stacked to match, line-for-line.
 *
 * Each faculty LINE is its own click target (opens that section's own `/results/[id]` in a new
 * tab) — replaces the old whole-row click, which had no single "the" survey once a row can hold
 * several sections' worth of distinct surveys. The Faculty and Faculty & Role filters were
 * combined into one `TokenSelect` (Vishal, 2026-09-16: "combine faculty and role filter into
 * one"), grouped by role heading so the role facet isn't lost, just folded into the one control.
 */

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button, DataTable, TableViewMoreFooter } from '@exxatdesignux/ui'
import type { ColumnDef } from '@exxatdesignux/ui'
import { ChartCard, type ChartLeoInsight } from '@/components/charts-core'
import { TokenSelect } from '@/components/pce/courses-evaluatees/scope-controls'
import { PersonAvatar } from '@/components/pce/person-avatar'
import {
  courseOfferingGroupedRows, medianOf, facultyEvalRoleOptions,
  type CourseOfferingGroupRow,
} from '@/lib/pce-analytics'

const fmt2 = (v: number) => v.toFixed(2)
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
  const roleOrder = useMemo(() => facultyEvalRoleOptions().map((r) => r.label), [])

  const allRows = useMemo(() => courseOfferingGroupedRows(terms), [terms])

  const courseOptions = useMemo(() => {
    const byCode = new Map(allRows.map((r) => [r.courseCode, r.courseName]))
    return [...byCode.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, name]) => ({ value, label: `${value} · ${name}` }))
  }, [allRows])

  const [courseFilter, setCourseFilter] = useState<string[]>([])
  const toggleCourse = (v: string) =>
    setCourseFilter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))

  /** Faculty and Role, combined into one control (Vishal, 2026-09-16: "combine faculty and role
   *  filter into one — faculty & role"). One option per distinct faculty member, grouped under
   *  their role's heading — the role facet isn't lost, just folded into the same picker instead
   *  of a second dropdown. A person's role is read off their FIRST appearance in scope; the
   *  fixture data doesn't currently have anyone holding two different roles across offerings, so
   *  this doesn't need to fork a person into two option rows. */
  const facultyRoleOptions = useMemo(() => {
    const byId = new Map<string, { name: string; role: string }>()
    allRows.forEach((r) => r.faculty.forEach((f) => {
      if (!byId.has(f.facultyId)) byId.set(f.facultyId, { name: f.facultyName, role: roleLabelById.get(f.role) ?? f.role })
    }))
    return [...byId.entries()]
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([value, { name, role }]) => ({ value, label: name, group: role }))
  }, [allRows, roleLabelById])
  const [facultyRoleFilter, setFacultyRoleFilter] = useState<string[]>([])
  const toggleFacultyRole = (v: string) =>
    setFacultyRoleFilter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (!courseFilter.length || courseFilter.includes(r.courseCode)) &&
          (!facultyRoleFilter.length || r.faculty.some((f) => facultyRoleFilter.includes(f.facultyId))),
      ),
    [allRows, courseFilter, facultyRoleFilter],
  )
  /** Medians computed over every FACULTY LINE in scope, not one per row — a multi-section row
   *  contributes each of its sections' own values, same as if they'd stayed separate rows. */
  const allLines = useMemo(() => rows.flatMap((r) => r.faculty), [rows])
  const courseMedian = useMemo(
    () => medianOf(allLines.map((f) => f.courseAvg).filter((v): v is number => v != null)),
    [allLines],
  )
  const facultyMedian = useMemo(() => medianOf(allLines.map((f) => f.facultyAvg)), [allLines])

  const [visibleCount, setVisibleCount] = useState(CHUNK)
  useEffect(() => setVisibleCount(CHUNK), [courseFilter, facultyRoleFilter, terms])
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

  /** Per-line row height (avatar row + gap) every stacked column shares, so a Faculty cell's
   *  N lines and the same row's Course rating/Faculty rating/Response rate cells' N lines stay
   *  vertically aligned — same person, same rating, same shelf. */
  const LINE_H = 28

  const openLine = (f: CourseOfferingGroupRow['faculty'][number]) => (e: MouseEvent) => {
    e.stopPropagation()
    if (!f.surveyId) return
    window.open(`/results/${encodeURIComponent(f.surveyId)}?from=analytics`, '_blank', 'noopener,noreferrer')
  }

  const columns: ColumnDef<CourseOfferingGroupRow>[] = useMemo(
    () => [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        sortKey: 'courseCode',
        width: 220,
        cell: (row) => (
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={(e) => {
              e.stopPropagation()
              onOpenCourse(row.courseCode)
            }}
            className="flex h-auto w-full flex-col items-start justify-center truncate text-left font-normal hover:underline"
          >
            <span className="font-medium text-foreground">{row.courseCode}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.courseName}</span>
          </Button>
        ),
      },
      { key: 'academicYear', label: 'AY', sortable: true, sortKey: 'academicYear', width: 110 },
      { key: 'term', label: 'Term', sortable: true, sortKey: 'term', width: 130 },
      {
        // One line per section/instructor — avatar + name + role, same stacked anatomy as the
        // push wizard's multi-faculty cell. This line is the row's real click target now: opens
        // THAT section's own survey results in a new tab (the whole-row click this replaced had
        // no single "the" survey once a row can hold several sections).
        key: 'faculty',
        label: 'Faculty',
        width: 220,
        cell: (row) => (
          <div className="flex flex-col gap-1" style={{ minHeight: row.faculty.length * LINE_H }}>
            {row.faculty.map((f) => (
              <Button
                key={f.facultyId}
                type="button"
                variant="ghost"
                size="default"
                onClick={openLine(f)}
                disabled={!f.surveyId}
                className="flex h-auto min-w-0 items-center justify-start gap-1.5 rounded text-left font-normal disabled:cursor-default"
                style={{ height: LINE_H - 4 }}
              >
                <PersonAvatar name={f.facultyName} />
                <span className={`text-sm truncate ${f.surveyId ? 'hover:underline' : ''}`}>
                  {f.facultyName}
                  <span className="text-xs text-muted-foreground"> · {roleLabelById.get(f.role) ?? f.role}</span>
                </span>
              </Button>
            ))}
          </div>
        ),
      },
      {
        key: 'courseAvgSort',
        label: 'Course rating',
        sortable: true,
        sortKey: 'courseAvgSort',
        width: 120,
        cell: (row) => (
          <div className="flex flex-col gap-1" style={{ minHeight: row.faculty.length * LINE_H }}>
            {row.faculty.map((f) => (
              <span key={f.facultyId} className="flex items-center" style={{ height: LINE_H - 4 }}>
                <RatingCell value={f.courseAvg} below={f.courseAvg != null && f.courseAvg < courseMedian} />
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'facultyAvgSort',
        label: 'Faculty rating',
        sortable: true,
        sortKey: 'facultyAvgSort',
        width: 120,
        cell: (row) => (
          <div className="flex flex-col gap-1" style={{ minHeight: row.faculty.length * LINE_H }}>
            {row.faculty.map((f) => (
              <span key={f.facultyId} className="flex items-center" style={{ height: LINE_H - 4 }}>
                <RatingCell value={f.facultyAvg} below={f.facultyAvg < facultyMedian} />
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'responseRateSort',
        label: 'Response rate',
        sortable: true,
        sortKey: 'responseRateSort',
        width: 120,
        cell: (row) => (
          <div className="flex flex-col gap-1" style={{ minHeight: row.faculty.length * LINE_H }}>
            {row.faculty.map((f) => (
              <span key={f.facultyId} className="tabular-nums flex items-center" style={{ height: LINE_H - 4 }}>
                {f.responseRate}%
              </span>
            ))}
          </div>
        ),
      },
    ],
    [courseMedian, facultyMedian, onOpenCourse, roleLabelById],
  )

  const leo: ChartLeoInsight | null = useMemo(() => {
    const scored = allLines.filter((f) => f.courseAvg != null)
    if (!scored.length) return null
    const worstLine = [...scored].sort((a, b) => (a.courseAvg as number) - (b.courseAvg as number))[0]!
    const worstRow = rows.find((r) => r.faculty.some((f) => f.facultyId === worstLine.facultyId && f.courseAvg === worstLine.courseAvg))!
    const below = allLines.filter((f) => (f.courseAvg != null && f.courseAvg < courseMedian) || f.facultyAvg < facultyMedian)
    return {
      headline: `${worstRow.courseCode} rates lowest at ${fmt2(worstLine.courseAvg as number)}`,
      explanation: `${below.length} of ${allLines.length} offerings fall below the ${fmt2(courseMedian)} course-rating median or the ${fmt2(facultyMedian)} faculty-rating median for ${termsLabel}.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: fmt2(worstLine.courseAvg as number), label: worstRow.courseCode },
      bullets: [
        `${worstRow.courseCode} · ${worstRow.courseName} · ${worstRow.term} · ${worstLine.facultyName}: ${fmt2(worstLine.courseAvg as number)} course, ${fmt2(worstLine.facultyAvg)} faculty.`,
        `${below.length} of ${allLines.length} offerings below either median.`,
      ],
    }
  }, [allLines, rows, courseMedian, facultyMedian, termsLabel])

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
        <label id="course-list-faculty-role-label" className="text-xs font-medium text-muted-foreground">Faculty &amp; role</label>
        <TokenSelect
          labelId="course-list-faculty-role-label"
          contentLabel="Filter by faculty and role"
          placeholder="All faculty"
          options={facultyRoleOptions}
          selected={facultyRoleFilter}
          onToggle={toggleFacultyRole}
          onClear={() => setFacultyRoleFilter([])}
          groupOrder={roleOrder}
        />
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
        <DataTable<CourseOfferingGroupRow>
          data={visibleRows}
          columns={columns}
          getRowId={(r) => r.id}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          defaultSort={{ key: 'courseAvgSort', dir: 'asc' }}
          emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No course offerings for {termsLabel} yet.</p>}
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
