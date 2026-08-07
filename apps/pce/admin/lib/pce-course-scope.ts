// ============================================================================
// Course scope — resolves the push "Courses & Evaluatees" step scope selectors
// (Term season + Academic Year + Cohort) to a set of offerings.
//
// Term (season) and Academic Year are INDEPENDENT selectors and are never merged
// (a term instance = season + academicYear, e.g. Fall + 2026–2027 → pt5).
// ============================================================================

import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  type ProgramTerm,
  type TermSeason,
  type CourseOffering,
} from './pce-mock-data'

/** Fixed season options for the Term selector (independent of academic year). */
export const TERM_SEASONS: TermSeason[] = ['Spring', 'Summer', 'Fall']

/** Distinct academic years present in the program, newest first. */
export function academicYearOptions(): string[] {
  const years = [...new Set(MOCK_PROGRAM_TERMS.map((t) => t.academicYear))]
  return years.sort((a, b) => b.localeCompare(a))
}

/** Resolve the single ProgramTerm for a (season, academicYear) pair. */
export function resolveTerm(season: TermSeason | '', academicYear: string): ProgramTerm | undefined {
  if (!season || !academicYear) return undefined
  return MOCK_PROGRAM_TERMS.find((t) => t.season === season && t.academicYear === academicYear)
}

/** Non-archived offerings in a term, sorted by cohort then id (stable). */
function offeringsInTerm(term: ProgramTerm): CourseOffering[] {
  return MOCK_COURSE_OFFERINGS.filter((o) => o.termId === term.id && o.status !== 'archived').sort(
    (a, b) => a.cohort.localeCompare(b.cohort) || a.id.localeCompare(b.id),
  )
}

/** Distinct cohorts present in a resolved term's offerings (for the Cohort checkboxes). */
export function cohortOptions(term: ProgramTerm | undefined): string[] {
  if (!term) return []
  return [...new Set(offeringsInTerm(term).map((o) => o.cohort))].sort()
}

/** Offerings for the current scope. Cohort filter is applied only when ≥1 cohort is chosen. */
export function offeringsForScope(
  season: TermSeason | '',
  academicYear: string,
  cohorts: string[],
): CourseOffering[] {
  const term = resolveTerm(season, academicYear)
  if (!term) return []
  const rows = offeringsInTerm(term)
  if (cohorts.length === 0) return rows
  const set = new Set(cohorts)
  return rows.filter((o) => set.has(o.cohort))
}
