// ============================================================================
// Course readiness — live, type-aware derivation for the push-flow
// "Courses & Evaluatees" step (spec: docs/specs/2026-07-06-courses-evaluatees-audit.md).
//
// There is NO "run audit" step: because the Students / Instructor / Coordinator
// columns are live-linked to Prism, readiness is a pure derivation over the live
// offering data, recomputed whenever scope / criteria / data change. Gaps are
// surfaced inline (amber) with an optional new-tab Prism deep-link ("Add data").
// ============================================================================

import {
  type CourseOffering,
  type DeliveryMode,
  deliveryModeOf,
  MOCK_FACULTY,
  MOCK_MASTER_COURSES,
} from './pce-mock-data'

const PRISM_BASE = 'https://app.exxat.com/prism/dpt'

/** The three evaluatee dimensions an admin can choose to evaluate. */
export type Criterion = 'students' | 'instructor' | 'coordinator'

export const ALL_CRITERIA: Criterion[] = ['students', 'instructor', 'coordinator']

/** Labels for the "What to evaluate" toggles (generic; per-course label lives in CRITERION_BY_TYPE). */
export const CRITERION_TOGGLE_LABEL: Record<Criterion, string> = {
  students: 'Course',
  instructor: 'Instructor',
  coordinator: 'Course Coordinator',
}

interface CriterionResolver {
  /** Column header + gap verb for this course type, e.g. "Clinical Coordinator". */
  label: string
  /** Live value if present in Prism, else null (= gap). */
  resolve: (o: CourseOffering) => string | null
  /** Prism deep-link segment used by prismAddHref(). */
  prismTarget: string
}

function facultyName(id?: string | null): string | null {
  if (!id) return null
  return MOCK_FACULTY.find((f) => f.id === id)?.name ?? null
}

/**
 * How each criterion resolves per delivery mode. This is the type-aware core:
 * "Coordinator" is a Course Coordinator on CB, a Clinical Coordinator on PB;
 * "Instructor" is a Lab Instructor on LB, Placement Faculty on PB.
 *
 * Data-semantics (by design): coordinator = `primaryFacultyId`; instructor = a SEPARATE person
 * (`collaboratorIds[0]` / `labTaIds` / `placementFacultyIds`). So a course taught solely by its
 * coordinator (empty collaborators) reads as an instructor gap — intentional: the two evaluatee
 * roles are distinct, matching the prototype's separate Instructor / Coordinator columns.
 */
export const CRITERION_BY_TYPE: Record<DeliveryMode, Record<Criterion, CriterionResolver>> = {
  classroom: {
    students: { label: 'Students', resolve: (o) => (o.enrolledCount > 0 ? `${o.enrolledCount} students` : null), prismTarget: 'roster' },
    instructor: { label: 'Instructor', resolve: (o) => facultyName(o.collaboratorIds[0]), prismTarget: 'instructor' },
    coordinator: { label: 'Coordinator', resolve: (o) => facultyName(o.primaryFacultyId), prismTarget: 'coordinator' },
  },
  lab: {
    students: { label: 'Students', resolve: (o) => (o.enrolledCount > 0 ? `${o.enrolledCount} students` : null), prismTarget: 'roster' },
    instructor: { label: 'Lab Instructor', resolve: (o) => facultyName(o.collaboratorIds[0] ?? o.labTaIds?.[0]), prismTarget: 'lab-instructor' },
    coordinator: { label: 'Coordinator', resolve: (o) => facultyName(o.primaryFacultyId), prismTarget: 'coordinator' },
  },
  practice: {
    students: { label: 'Students', resolve: (o) => (o.enrolledCount > 0 ? `${o.enrolledCount} students` : null), prismTarget: 'roster' },
    instructor: { label: 'Placement Faculty', resolve: (o) => facultyName(o.placementFacultyIds?.[0]), prismTarget: 'placement-faculty' },
    coordinator: { label: 'Clinical Coordinator', resolve: (o) => facultyName(o.primaryFacultyId), prismTarget: 'clinical-coordinator' },
  },
}

export interface CellReadiness {
  ok: boolean
  /** Live value ("40 students" / "Dr. Chen") when present. */
  value: string | null
  /** Type-aware label for the column / gap CTA ("Clinical Coordinator"). */
  label: string
  /** New-tab Prism deep-link to add the missing record (null when ok). */
  prismHref: string | null
}

export interface CourseReadiness {
  offering: CourseOffering
  deliveryMode: DeliveryMode
  /** Course label "DPT-510 – Neuroanatomy" (from master course). */
  courseLabel: string
  /** Only the selected criteria are present. */
  cells: Partial<Record<Criterion, CellReadiness>>
  /** True if any evaluated criterion is a gap. */
  hasGap: boolean
}

/** `https://app.exxat.com/prism/dpt/offerings/{id}?add={target}` — matches the existing PRISM_BASE pattern. */
export function prismAddHref(o: CourseOffering, c: Criterion): string {
  const target = CRITERION_BY_TYPE[deliveryModeOf(o)][c].prismTarget
  return `${PRISM_BASE}/offerings/${o.id}?add=${target}`
}

export function courseLabelOf(o: CourseOffering): string {
  const mc = MOCK_MASTER_COURSES.find((m) => m.id === o.masterCourseId)
  return mc ? `${mc.code} – ${mc.name}` : o.masterCourseId
}

function cellFor(o: CourseOffering, mode: DeliveryMode, c: Criterion): CellReadiness {
  const spec = CRITERION_BY_TYPE[mode][c]
  const value = spec.resolve(o)
  const ok = value != null
  return { ok, value, label: spec.label, prismHref: ok ? null : prismAddHref(o, c) }
}

/** Derive per-course readiness for the chosen criteria — pure; call on any scope/criteria/data change. */
export function deriveReadiness(offerings: CourseOffering[], criteria: Criterion[]): CourseReadiness[] {
  return offerings.map((o) => {
    const mode = deliveryModeOf(o)
    const cells: Partial<Record<Criterion, CellReadiness>> = {}
    let hasGap = false
    for (const c of criteria) {
      const cell = cellFor(o, mode, c)
      cells[c] = cell
      if (!cell.ok) hasGap = true
    }
    return { offering: o, deliveryMode: mode, courseLabel: courseLabelOf(o), cells, hasGap }
  })
}

/** Named-check summary: ok / gap counts per evaluated criterion (drives the summary band). */
export function readinessSummary(
  rows: CourseReadiness[],
  criteria: Criterion[],
): Record<Criterion, { ok: number; gap: number }> {
  const out = {} as Record<Criterion, { ok: number; gap: number }>
  for (const c of criteria) {
    let ok = 0
    let gap = 0
    for (const r of rows) {
      const cell = r.cells[c]
      if (!cell) continue
      if (cell.ok) ok++
      else gap++
    }
    out[c] = { ok, gap }
  }
  return out
}
