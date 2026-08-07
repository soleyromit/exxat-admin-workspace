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
  type PceTemplate,
  deliveryModeOf,
  MOCK_FACULTY,
  MOCK_MASTER_COURSES,
} from './pce-mock-data'

const PRISM_BASE = 'https://app.exxat.com/prism/dpt'

/**
 * The evaluatee dimensions an admin can choose to evaluate. Sourced from the
 * Prism role universe (~40–50 in production, narrowed per program in Settings);
 * this is the subset the mock data can actually resolve a person for.
 *
 * NOT every role applies to every course type — a Placement Faculty on a
 * classroom course is *not applicable*, which is different from *missing*. That
 * distinction lives in CRITERION_BY_TYPE, which is Partial per delivery mode.
 */
export type Criterion =
  | 'students'
  | 'instructor'
  | 'coordinator'
  | 'teachingAssistant'
  | 'labAssistant'
  | 'guestLecturer'
  | 'courseDirector'
  | 'siteCoordinator'
  | 'preceptor'
  | 'academicAdvisor'

export const ALL_CRITERIA: Criterion[] = [
  'students', 'instructor', 'coordinator', 'teachingAssistant', 'labAssistant',
  'guestLecturer', 'courseDirector', 'siteCoordinator', 'preceptor', 'academicAdvisor',
]

/** The fixed top-level categories a role sits under (settled: no custom groups). */
export type CriterionGroup = 'Course' | 'Faculty'

export const CRITERION_GROUP_ORDER: readonly CriterionGroup[] = ['Course', 'Faculty']

export const CRITERION_GROUP: Record<Criterion, CriterionGroup> = {
  students: 'Course',
  instructor: 'Faculty',
  coordinator: 'Faculty',
  teachingAssistant: 'Faculty',
  labAssistant: 'Faculty',
  guestLecturer: 'Faculty',
  courseDirector: 'Faculty',
  siteCoordinator: 'Faculty',
  preceptor: 'Faculty',
  academicAdvisor: 'Faculty',
}

/**
 * Criteria that resolve to a *person* in Prism. These share one "Faculty" column
 * and one "Add faculty" CTA rather than a column + button per role: the role set
 * is drawn from the Prism universe (~40–50 roles, narrowed per program in
 * Settings), so a column-per-role table does not survive a program that evaluates
 * more than a handful. The specific role stays legible inside the cell.
 */
export const FACULTY_CRITERIA: Criterion[] = ALL_CRITERIA.filter(c => CRITERION_GROUP[c] === 'Faculty')

/** Labels for the "What to evaluate" picker (generic; per-course label lives in CRITERION_BY_TYPE). */
export const CRITERION_TOGGLE_LABEL: Record<Criterion, string> = {
  students: 'Course',
  instructor: 'Instructor',
  coordinator: 'Course Coordinator',
  teachingAssistant: 'Teaching Assistant',
  labAssistant: 'Lab Assistant',
  guestLecturer: 'Guest Lecturer',
  courseDirector: 'Course Director',
  siteCoordinator: 'Site Coordinator',
  preceptor: 'Preceptor',
  academicAdvisor: 'Academic Advisor',
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
const roster: CriterionResolver = {
  label: 'Students',
  resolve: (o) => (o.enrolledCount > 0 ? `${o.enrolledCount} students` : null),
  prismTarget: 'roster',
}

/** Shared across every delivery mode — a director/advisor is not type-specific. */
const courseDirector: CriterionResolver = {
  label: 'Course Director',
  resolve: (o) => facultyName(o.collaboratorIds[2]),
  prismTarget: 'course-director',
}
const academicAdvisor: CriterionResolver = {
  label: 'Academic Advisor',
  resolve: (o) => facultyName(o.collaboratorIds[3]),
  prismTarget: 'academic-advisor',
}
const teachingAssistant: CriterionResolver = {
  label: 'Teaching Assistant',
  resolve: (o) => facultyName(o.labTaIds?.[0]),
  prismTarget: 'teaching-assistant',
}
const guestLecturer: CriterionResolver = {
  label: 'Guest Lecturer',
  resolve: (o) => facultyName(o.collaboratorIds[1]),
  prismTarget: 'guest-lecturer',
}

export const CRITERION_BY_TYPE: Record<DeliveryMode, Partial<Record<Criterion, CriterionResolver>>> = {
  classroom: {
    students: roster,
    instructor: { label: 'Instructor', resolve: (o) => facultyName(o.collaboratorIds[0]), prismTarget: 'instructor' },
    coordinator: { label: 'Coordinator', resolve: (o) => facultyName(o.primaryFacultyId), prismTarget: 'coordinator' },
    teachingAssistant, guestLecturer, courseDirector, academicAdvisor,
    // no labAssistant / siteCoordinator / preceptor — not applicable to a lecture
  },
  lab: {
    students: roster,
    instructor: { label: 'Lab Instructor', resolve: (o) => facultyName(o.collaboratorIds[0] ?? o.labTaIds?.[0]), prismTarget: 'lab-instructor' },
    coordinator: { label: 'Coordinator', resolve: (o) => facultyName(o.primaryFacultyId), prismTarget: 'coordinator' },
    labAssistant: { label: 'Lab Assistant', resolve: (o) => facultyName(o.labTaIds?.[1]), prismTarget: 'lab-assistant' },
    teachingAssistant, guestLecturer, courseDirector, academicAdvisor,
  },
  practice: {
    students: roster,
    instructor: { label: 'Placement Faculty', resolve: (o) => facultyName(o.placementFacultyIds?.[0]), prismTarget: 'placement-faculty' },
    coordinator: { label: 'Clinical Coordinator', resolve: (o) => facultyName(o.primaryFacultyId), prismTarget: 'clinical-coordinator' },
    siteCoordinator: { label: 'Site Coordinator', resolve: (o) => facultyName(o.placementFacultyIds?.[1]), prismTarget: 'site-coordinator' },
    preceptor: { label: 'Preceptor', resolve: (o) => facultyName(o.placementFacultyIds?.[2]), prismTarget: 'preceptor' },
    courseDirector, academicAdvisor,
    // no labAssistant / teachingAssistant / guestLecturer on a placement
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
  // Falls back to the offering's faculty area when the role does not apply to
  // this course type — the link still lands somewhere useful.
  const target = CRITERION_BY_TYPE[deliveryModeOf(o)][c]?.prismTarget ?? 'faculty'
  return `${PRISM_BASE}/offerings/${o.id}?add=${target}`
}

/**
 * One deep-link to the offering's faculty area, covering every missing faculty
 * role at once. A course missing both an instructor and a coordinator is one
 * trip to Prism, not two new tabs.
 */
export function prismAddFacultyHref(o: CourseOffering): string {
  return `${PRISM_BASE}/offerings/${o.id}?add=faculty`
}

export function courseLabelOf(o: CourseOffering): string {
  const mc = MOCK_MASTER_COURSES.find((m) => m.id === o.masterCourseId)
  return mc ? `${mc.code} – ${mc.name}` : o.masterCourseId
}

/** `undefined` = the role does not apply to this course type (≠ a gap). */
function cellFor(o: CourseOffering, mode: DeliveryMode, c: Criterion): CellReadiness | undefined {
  const spec = CRITERION_BY_TYPE[mode][c]
  if (!spec) return undefined
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
      // Evaluating "Lab Assistant" must not flag every lecture as incomplete.
      if (!cell) continue
      cells[c] = cell
      if (!cell.ok) hasGap = true
    }
    return { offering: o, deliveryMode: mode, courseLabel: courseLabelOf(o), cells, hasGap }
  })
}

// ── Template → evaluatees ────────────────────────────────────────────────────
// The merged Courses step (select courses → assign template → validate) derives
// WHAT each course must have from the template assigned to it: a template that
// evaluates the Instructor makes "no instructor in Prism" a gap on that row,
// while a course-content-only template asks nothing of the faculty roster.

/** Template role-set role ids (EVAL_FACULTY_ROLES) → readiness criteria. */
const ROLE_ID_TO_CRITERION: Record<string, Criterion> = {
  'instructor': 'instructor',
  'course-coordinator': 'coordinator',
  'teaching-assistant': 'teachingAssistant',
  'lab-assistant': 'labAssistant',
  'guest-lecturer': 'guestLecturer',
}

/** Dynamic-section subject keys → criteria (sections not riding a role set). */
const SUBJECT_KEY_TO_CRITERION: Record<string, Criterion> = {
  course_content: 'students',
  course_instructor: 'instructor',
  lab_instructor: 'instructor',
  course_coordinator: 'coordinator',
  teaching_assistant: 'teachingAssistant',
  course_director: 'courseDirector',
  preceptor: 'preceptor',
  clinical_supervisor: 'siteCoordinator',
}

/**
 * The evaluatee dimensions a template's sections cover — dynamic sections first
 * (role sets declare faculty roles; subject keys map directly), falling back to
 * the legacy fixed buckets for templates that predate templateSections.
 * Ordered by ALL_CRITERIA so summaries read stably.
 */
export function templateCriteria(t: PceTemplate): Criterion[] {
  const found = new Set<Criterion>()
  const dyn = t.templateSections ?? []
  if (dyn.length > 0) {
    for (const s of dyn) {
      if (s.roleSetId) {
        const set = t.facultyRoleSets?.find(r => r.id === s.roleSetId)
        for (const role of set?.roles ?? []) {
          const c = ROLE_ID_TO_CRITERION[role]
          if (c) found.add(c)
        }
      } else {
        const c = SUBJECT_KEY_TO_CRITERION[s.subjectKey]
        if (c) found.add(c)
      }
    }
  } else {
    for (const s of t.sections) {
      if (s === 'course_content') found.add('students')
      else if (s === 'faculty_performance') found.add('instructor')
      else if (s === 'course_director') found.add('courseDirector')
    }
  }
  return ALL_CRITERIA.filter(c => found.has(c))
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
