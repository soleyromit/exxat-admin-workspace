'use client'

/**
 * Courses landing — Aarti's "primary entry point: course offerings centered."
 *
 * Follows the canonical admin page shell:
 *   <SiteHeader title="..." />
 *   <div>
 *     <PageHeader title="..." subtitle="..." actions={...} />
 *     <KeyMetrics metrics={...} />
 *     <content />
 *   </div>
 *
 * Admin: sees all institutional courses
 * Faculty: sees only courses they're associated with, with access-level chip per course
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Button, Badge, InputGroup, InputGroupAddon, InputGroupInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tooltip, TooltipTrigger, TooltipContent,
  ViewSegmentedControl,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
// KeyMetrics removed — Vishaka: park live-assessments / pending-review / students-count stats on this dashboard. Lead with course cards.
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'
import {
  facultyStudents, facultyAccommodations, courseObjectives,
  facultyExtraAssessments,
} from '@/lib/faculty-mock-data'
import { useAssessmentReviews } from '@/lib/assessment-review-store'
import { useFacultySession } from '@/lib/faculty-session'
import { AccessLevelChip, StatusPill } from '@/components/faculty-ui-kit'
import { ActionItemsPanel } from '@/components/action-items-panel'
import { StubButton } from '@/components/stub-button'

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

interface CourseSummary {
  id: string
  code: string
  name: string
  activeSemester: string
  studentCount: number
  assessmentCount: number
  pendingReviewCount: number
  inProgressCount: number
  publishedCount: number
  draftCount: number
  accommodationsCount: number
  untestedObjectivesCount: number
  accessLevel: 'editor' | 'viewer' | null
}

function buildSummary(
  courseId: string,
  accessLevel: 'editor' | 'viewer' | null,
  reviewByAssessment: Map<string, import('@/lib/faculty-mock-data').AssessmentReview>,
): CourseSummary {
  const course = mockCourses.find(c => c.id === courseId)
  if (!course) {
    return {
      id: courseId, code: '—', name: 'Unknown course', activeSemester: '—',
      studentCount: 0, assessmentCount: 0, pendingReviewCount: 0,
      inProgressCount: 0, publishedCount: 0, draftCount: 0,
      accommodationsCount: 0, untestedObjectivesCount: 0, accessLevel,
    }
  }
  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const activeOffering = offerings.find(o => o.semester.includes('2026')) ?? offerings[0]
  const studentCount = facultyStudents.filter(s => s.enrolledCourseIds.includes(courseId)).length
  const courseAssessments = ALL_ASSESSMENTS.filter(a => a.courseId === courseId)
  let pending = 0, inProgress = 0, published = 0, draft = 0
  for (const a of courseAssessments) {
    const r = reviewByAssessment.get(a.id)
    if (!r || r.state === 'draft') draft++
    else if (r.state === 'pending-chair' || r.state === 'changes-requested') pending++
    else if (r.state === 'in-progress') inProgress++
    else if (r.state === 'published' || r.state === 'submitted' || r.state === 'results-published') published++
  }
  return {
    id: courseId,
    code: course.code,
    name: course.name,
    activeSemester: activeOffering?.semester ?? '—',
    studentCount: studentCount || (activeOffering?.studentCount ?? 0),
    assessmentCount: courseAssessments.length,
    pendingReviewCount: pending,
    inProgressCount: inProgress,
    publishedCount: published,
    draftCount: draft,
    accommodationsCount: facultyAccommodations.filter(a => a.courseId === courseId).length,
    untestedObjectivesCount: courseObjectives.filter(o => o.courseId === courseId && !o.lastAssessed).length,
    accessLevel,
  }
}

export default function CoursesClient() {
  const { role, faculty, accessFor, hydrated } = useFacultySession()
  const { reviewByAssessment } = useAssessmentReviews()
  const [query, setQuery] = useState('')
  const [termFilter, setTermFilter] = useState<'all' | 'active' | 'past'>('active')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  const visibleCourses = useMemo(() => {
    if (!hydrated) return []
    const ids = role === 'faculty' && faculty
      ? faculty.courses.map(c => c.courseId)
      : mockCourses.map(c => c.id)
    return ids.map(id => buildSummary(id, accessFor(id), reviewByAssessment))
  }, [role, faculty, accessFor, hydrated, reviewByAssessment])

  // Normalize the user's query (strip whitespace, lowercase) for matching
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, '')

  const matchesQuery = (c: CourseSummary) =>
    !normalizedQuery ||
    c.name.toLowerCase().includes(normalizedQuery) ||
    c.code.toLowerCase().includes(normalizedQuery)

  const matchesTerm = (c: CourseSummary, t: 'all' | 'active' | 'past') =>
    t === 'all' ||
    (t === 'active' && c.activeSemester.includes('2026')) ||
    (t === 'past' && !c.activeSemester.includes('2026'))

  const filtered = useMemo(() => {
    return visibleCourses.filter(c => matchesQuery(c) && matchesTerm(c, termFilter))
  }, [visibleCourses, normalizedQuery, termFilter])

  // Per Vishaka: when a search has no results in the active filter, look in
  // OTHER filters and tell the user. "Toxicology is in past terms — switch?"
  const otherFilterMatches = useMemo(() => {
    if (filtered.length > 0 || !normalizedQuery) return null
    const candidates = (['active', 'past', 'all'] as const).filter(t => t !== termFilter)
    for (const t of candidates) {
      const hits = visibleCourses.filter(c => matchesQuery(c) && matchesTerm(c, t))
      if (hits.length > 0) return { otherFilter: t, count: hits.length }
    }
    return null
  }, [filtered.length, normalizedQuery, termFilter, visibleCourses])

  const pageTitle = role === 'faculty' && faculty
    ? `Welcome back, ${faculty.title} ${faculty.name.split(' ')[1] ?? faculty.name}`
    : 'Courses'
  const pageSubtitle = role === 'faculty' && faculty
    ? `${faculty.department} · ${visibleCourses.length} ${visibleCourses.length === 1 ? 'course' : 'courses'} this term`
    : `${mockCourses.length} courses · ${mockCourseOfferings.length} offerings across all programs`

  return (
    <>
      <SiteHeader title={role === 'faculty' ? 'My Courses' : 'Courses'} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={
            role === 'admin' ? (
              <StubButton variant="default" size="sm">
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add course offering
              </StubButton>
            ) : undefined
          }
        />

        <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
          {/* Action items — workflow narrative entry point (faculty only).
              Per Vishaka: park the KPI strip + differentiator hero — most KPIs
              (live assessments, students count) are zero or noise on this
              dashboard. Lead with course cards. */}
          {role === 'faculty' && faculty && <ActionItemsPanel faculty={faculty} />}

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <InputGroup className="w-full max-w-sm">
              <InputGroupAddon align="inline-start">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Search by course code (e.g. PHAR 101) or name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search courses"
              />
            </InputGroup>
            {/* Term filter is admin-only — faculty view uses the two-section split (T1) */}
            {role === 'admin' && (
              <Select value={termFilter} onValueChange={(v) => setTermFilter(v as typeof termFilter)}>
                <SelectTrigger className="w-[180px]" aria-label="Filter courses by term">
                  <i className="fa-light fa-calendar-days me-2" aria-hidden="true" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active term (2026)</SelectItem>
                  <SelectItem value="past">Past terms</SelectItem>
                  <SelectItem value="all">All terms</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* View mode toggle — DS ViewSegmentedControl (was a 34-LoC
                hand-roll per display-navigation-atoms.md depth audit).
                Vishaka: "if list goes 5 or 6 then I'll make it like a list view" */}
            <ViewSegmentedControl
              className="ms-auto"
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'cards' | 'list')}
              options={[
                { value: 'cards', label: 'Cards', icon: 'fa-light fa-grid-2' },
                { value: 'list',  label: 'List',  icon: 'fa-light fa-list' },
              ]}
              aria-label="View mode"
            />
          </div>

          {/* Course grid */}
          {role === 'faculty' ? (
            <FacultyCourseSections
              courses={visibleCourses.filter(c => matchesQuery(c))}
              viewMode={viewMode}
              hasQuery={Boolean(query)}
              query={query}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              role={role}
              hasQuery={Boolean(query)}
              query={query}
              crossFilterHint={otherFilterMatches}
              onSwitchFilter={setTermFilter}
            />
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
              {filtered.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <CourseListView courses={filtered} />
          )}
        </div>
      </div>
    </>
  )
}

// Format Prism course code: "PHAR101" → "PHAR 101" (Vishaka: faculty search by this)
function formatCourseCode(code: string): string {
  const m = code.match(/^(\D+)(\d+)$/)
  return m ? `${m[1]} ${m[2]}` : code
}

// ─── Faculty course sections — "Active this term" on top, all others below ──
//
// Per Aarti's May 8 directive (T1): split faculty home into two groups based on
// whether the course's activeSemester matches the current term. Both groups are
// searched together by the same query filter; no term-filter toggle needed.
function FacultyCourseSections({
  courses,
  viewMode,
  hasQuery,
  query,
}: {
  courses: CourseSummary[]
  viewMode: 'cards' | 'list'
  hasQuery: boolean
  query: string
}) {
  const active = courses.filter(c => c.activeSemester.includes('2026'))
  const others = courses.filter(c => !c.activeSemester.includes('2026'))

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-muted">
          <i className="fa-light fa-magnifying-glass text-muted-foreground text-xl" aria-hidden="true" />
        </div>
        {hasQuery ? (
          <>
            <p className="font-semibold text-foreground">No courses match your search</p>
            <p className="text-sm text-muted-foreground mt-1">
              &ldquo;{query}&rdquo; didn&apos;t match any of your courses.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">No courses assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You haven&apos;t been assigned to any course offerings. Contact your program administrator to request access.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {active.length > 0 && (
        <section aria-labelledby="active-courses-heading">
          <h2
            id="active-courses-heading"
            className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-3"
          >
            Active this term
          </h2>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
              {active.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <CourseListView courses={active} />
          )}
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="all-courses-heading">
          <h2
            id="all-courses-heading"
            className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-3"
          >
            All my courses
          </h2>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
              {others.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <CourseListView courses={others} />
          )}
        </section>
      )}
    </div>
  )
}

// ─── Course card — clean, minimal, single accent ────────────────────────────
function CourseCard({ course }: { course: CourseSummary }) {
  // One plain-text status line instead of 5 colored pills.
  const statusBits: string[] = []
  if (course.pendingReviewCount > 0) statusBits.push(`${course.pendingReviewCount} pending review`)
  if (course.inProgressCount > 0)    statusBits.push(`${course.inProgressCount} live`)
  if (course.draftCount > 0)         statusBits.push(`${course.draftCount} draft${course.draftCount === 1 ? '' : 's'}`)
  if (course.untestedObjectivesCount > 0) {
    statusBits.push(
      `${course.untestedObjectivesCount} untested assessment objective${course.untestedObjectivesCount === 1 ? '' : 's'}`
    )
  }

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl border border-border bg-card px-5 py-5 flex flex-col gap-3 transition-colors hover:bg-muted/30 no-underline"
    >
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {formatCourseCode(course.code)}
        </p>
        <p className="font-heading text-base font-semibold text-foreground leading-snug truncate mt-0.5 group-hover:underline underline-offset-2">
          {course.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{course.activeSemester}</p>
      </div>

      <div className="flex items-baseline gap-4 text-xs text-muted-foreground">
        <span><span className="text-foreground font-semibold tabular-nums">{course.studentCount}</span> students</span>
        <span><span className="text-foreground font-semibold tabular-nums">{course.assessmentCount}</span> assessments</span>
        <span><span className="text-foreground font-semibold tabular-nums">{course.accommodationsCount}</span> accommodations</span>
      </div>

      {statusBits.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {statusBits.join(' · ')}
        </p>
      )}
    </Link>
  )
}

function CardMetric({ value, label }: { value: number | string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 min-w-0">
      <span className="text-base font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  )
}

// Old icon-based metric — kept for the table-view rendering below.
function CardMetricLegacy({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5 min-w-0">
      <div className="flex items-baseline gap-1.5">
        <i className={`fa-light ${icon} text-muted-foreground text-xs`} aria-hidden="true" />
        <span className="text-base font-bold text-foreground leading-none">{value}</span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate w-full">
        {label}
      </span>
    </div>
  )
}

// ─── Differentiator strip — Aarti's "show me what's different" surface ──────
//
// Five pillars, each driven by live data from the visible course set.
// Designed to read as positioning ("this is what we built differently"),
// not a feature list. Subtle brand gradient bg + colored live-data chips.
function DifferentiatorStrip({ courses }: { courses: CourseSummary[] }) {
  const totalUntested = courses.reduce((n, c) => n + c.untestedObjectivesCount, 0)
  const totalPendingReview = courses.reduce((n, c) => n + c.pendingReviewCount, 0)
  const totalAssessments = courses.reduce((n, c) => n + c.assessmentCount, 0)
  const courseCount = courses.length

  type Tone = 'brand' | 'info' | 'warning' | 'success'
  const pillars: Array<{ icon: string; title: string; sub: string; live: string; tone: Tone }> = [
    {
      icon: 'fa-grid-2',
      title: 'Curricular loop',
      sub: 'Three-way: objectives → questions → performance',
      live: totalUntested > 0
        ? `${totalUntested} untested ${totalUntested === 1 ? 'objective' : 'objectives'}`
        : 'Curriculum fully covered',
      tone: totalUntested > 0 ? 'warning' : 'success',
    },
    {
      icon: 'fa-shield-check',
      title: 'Chair-approved',
      sub: 'Pre-publication review workflow',
      live: totalPendingReview > 0
        ? `${totalPendingReview} awaiting review`
        : 'All approved',
      tone: totalPendingReview > 0 ? 'info' : 'success',
    },
    {
      icon: 'fa-chart-mixed',
      title: 'Embedded psychometrics',
      sub: 'Point-biserial at decision time, not in a separate report',
      live: 'Live in question bank',
      tone: 'brand',
    },
    {
      icon: 'fa-duotone fa-solid fa-star-christmas',
      title: 'AI gap-fill',
      sub: 'Generate questions directly from course objectives',
      live: totalUntested > 0 ? 'Ready to close gaps' : 'No gaps detected',
      tone: 'brand',
    },
    {
      icon: 'fa-bullseye-arrow',
      title: 'Cross-course competency',
      sub: 'Cumulative student insight across courses',
      live: `${courseCount} ${courseCount === 1 ? 'course' : 'courses'} · ${totalAssessments} assessments`,
      tone: 'info',
    },
  ]

  return (
    <section
      aria-labelledby="differentiator-heading"
      className="rounded-xl border border-border p-5"
      style={{
        background: 'linear-gradient(135deg, color-mix(in oklch, var(--brand-color) 6%, var(--background)) 0%, var(--card) 55%, var(--card) 100%)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <i
            className="fa-duotone fa-solid fa-sparkles text-sm"
            style={{ color: 'var(--brand-color)' }}
            aria-hidden="true"
          />
          <h2
            id="differentiator-heading"
            className="text-[10px] uppercase tracking-[0.22em] font-bold text-muted-foreground"
          >
            Built differently · 5 pillars at work in your courses
          </h2>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {pillars.map((p) => (
          <DifferentiatorPillar key={p.title} {...p} />
        ))}
      </div>
    </section>
  )
}

function DifferentiatorPillar({
  icon, title, sub, live, tone,
}: {
  icon: string; title: string; sub: string; live: string;
  tone: 'brand' | 'info' | 'warning' | 'success';
}) {
  const toneColor =
    tone === 'warning' ? 'var(--chart-4)'
    : tone === 'info'    ? 'var(--chart-1)'
    : tone === 'success' ? 'var(--chart-2)'
    : 'var(--brand-color)'

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: `color-mix(in oklch, ${toneColor} 14%, var(--background))`,
            color: toneColor,
          }}
        >
          <i className={icon} aria-hidden="true" style={{ fontSize: 13 }} />
        </span>
        <span className="text-[13px] font-semibold text-foreground leading-tight">
          {title}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
      <span
        className="text-[11px] font-semibold leading-tight mt-0.5"
        style={{ color: toneColor }}
      >
        {live}
      </span>
    </div>
  )
}

function EmptyState({
  role,
  hasQuery,
  query,
  crossFilterHint,
  onSwitchFilter,
}: {
  role: 'admin' | 'faculty'
  hasQuery: boolean
  query: string
  crossFilterHint: { otherFilter: 'all' | 'active' | 'past'; count: number } | null
  onSwitchFilter: (next: 'all' | 'active' | 'past') => void
}) {
  if (hasQuery) {
    const filterLabel: Record<'all' | 'active' | 'past', string> = {
      all: 'all terms',
      active: 'active term',
      past: 'past terms',
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-muted">
          <i className="fa-light fa-magnifying-glass text-muted-foreground text-xl" aria-hidden="true" />
        </div>
        {crossFilterHint ? (
          <>
            <p className="font-semibold text-foreground">
              &ldquo;{query}&rdquo; isn&apos;t in your current filter
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              We found {crossFilterHint.count} {crossFilterHint.count === 1 ? 'match' : 'matches'} in{' '}
              <strong className="text-foreground">{filterLabel[crossFilterHint.otherFilter]}</strong>.
            </p>
            <Button
              variant="default"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => onSwitchFilter(crossFilterHint.otherFilter)}
            >
              <i className="fa-light fa-arrow-right" aria-hidden="true" />
              Switch to {filterLabel[crossFilterHint.otherFilter]}
            </Button>
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">No courses match your search</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
          </>
        )}
      </div>
    )
  }
  if (role === 'faculty') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-brand/12">
          <i className="fa-light fa-graduation-cap text-brand text-xl" aria-hidden="true" />
        </div>
        <p className="font-semibold text-foreground">No courses assigned yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          You haven&apos;t been assigned to any course offerings. Contact your program administrator to request access.
        </p>
        <StubButton variant="outline" size="sm" className="mt-3 gap-2">
          <i className="fa-light fa-envelope" aria-hidden="true" />
          Request access
        </StubButton>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-muted">
        <i className="fa-light fa-graduation-cap text-muted-foreground text-xl" aria-hidden="true" />
      </div>
      <p className="font-semibold text-foreground">No courses yet</p>
      <p className="text-sm text-muted-foreground mt-1">Create your first course to get started.</p>
    </div>
  )
}

// ─── Course list view — denser alternative for many courses ──────────────────
//
// Per Vishaka: "if I have 30 courses, the card grid leads to infinite scroll.
// A list view with one row per course is faster to scan."
function CourseListView({ courses }: { courses: CourseSummary[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border">
        {courses.map(c => {
          const isActive = c.activeSemester.includes('2026')
          const statusPill =
            c.pendingReviewCount > 0 ? { tone: 'warning', label: `${c.pendingReviewCount} pending review` } :
            c.inProgressCount > 0    ? { tone: 'info',    label: `${c.inProgressCount} live now` } :
            c.draftCount > 0         ? { tone: 'neutral', label: `${c.draftCount} draft` } :
            c.untestedObjectivesCount > 0 ? { tone: 'warning', label: `${c.untestedObjectivesCount} untested` } :
            null
          return (
            <li key={c.id}>
              <Link
                href={`/courses/${c.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors no-underline"
              >
                <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-muted text-muted-foreground shrink-0 min-w-[80px] text-center">
                  {formatCourseCode(c.code)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.activeSemester}</p>
                </div>
                <div className="hidden md:flex items-center gap-5 shrink-0 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">{c.studentCount}</strong> students</span>
                  <span><strong className="text-foreground">{c.assessmentCount}</strong> assessments</span>
                  {c.accommodationsCount > 0 && (
                    <span><strong className="text-foreground">{c.accommodationsCount}</strong> accommodations</span>
                  )}
                </div>
                {statusPill && (
                  <StatusPill
                    tone={statusPill.tone as 'warning' | 'info' | 'neutral'}
                    icon=""
                    label={statusPill.label}
                  />
                )}
                {c.accessLevel && <AccessLevelChip level={c.accessLevel} />}
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <span className={`inline-block size-1.5 rounded-full ${isActive ? 'bg-chart-2' : 'bg-muted-foreground'}`} />
                  {isActive ? 'Active' : 'Past'}
                </span>
                <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" style={{ fontSize: 11 }} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
