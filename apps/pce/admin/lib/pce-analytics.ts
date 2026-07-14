/**
 * Canonical multi-survey analytics dataset.
 *
 * ONE derivation, every view reads from it. Per the centralized-list-dataset rule: the
 * legacy prototype's panels each computed from their own slice with their own weighting,
 * which is why its Overview said "4 terms" while By Term said "7", and its survey totals
 * disagreed 22 vs 24. Every aggregate below is derived here and nowhere else.
 *
 * Nomenclature (Monil, 2026-07-13, SurveyMonkey borrowing):
 *   single-survey = one survey / course / term — the `view results` page ("the final node")
 *   multi-survey  = this file. Longitudinal, across term / faculty / course.
 *
 * Weighting (D3, Aarti undecided since 2026-06-22): both means are computed. Surfaces show
 * the weighted mean as the headline and the simple mean on hover — option C, "show both",
 * so the number is never silently one or the other. Arvind, 2026-05-13: "small differences
 * (3.2 vs 3.25) determine top 20% vs 40% faculty rankings" — the method has to be legible.
 *
 * Averages are never combined into one number (D7 / D27, Monil + Aarti independently):
 * students rate two distinct entities — course content and faculty teaching — so
 * `courseAvg` and `facultyAvg` stay separate all the way through.
 */

import { MOCK_SURVEYS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'
import type { FacultyOfferingRecord } from '@/lib/pce-mock-data'

/* ────────────────────────────────────────────────────────────────────────────
   Term algebra — terms are strings in the model; ranking and 1Y/3Y windows
   need them ordered and dated.
   ──────────────────────────────────────────────────────────────────────────── */

const TERM_SEASON_OFFSET: Record<string, number> = {
  Spring: 0,
  Summer: 0.33,
  Fall: 0.5,
}

/** "Spring 2026" → 2026.0 · "Fall 2025" → 2025.5 · "Summer 2026" → 2026.33. */
export function termToYear(term: string): number {
  const [season, yearStr] = term.trim().split(/\s+/)
  const year = Number(yearStr)
  if (!Number.isFinite(year)) return Number.NEGATIVE_INFINITY
  return year + (TERM_SEASON_OFFSET[season] ?? 0)
}

/** "Spring 2026" → "Sp 26" — axis-tick form. Full term stays in tooltips + the sr table. */
export function shortTerm(term: string): string {
  const [season, yearStr] = term.trim().split(/\s+/)
  const abbr = season === 'Spring' ? 'Sp' : season === 'Fall' ? 'Fa' : 'Su'
  return `${abbr} ${yearStr?.slice(2) ?? ''}`
}

export function compareTerms(a: string, b: string): number {
  return termToYear(a) - termToYear(b)
}

/* ────────────────────────────────────────────────────────────────────────────
   Means — both, always (D3 option C)
   ──────────────────────────────────────────────────────────────────────────── */

export interface DualMean {
  /** Σ(value × weight) / Σweight — the headline. */
  weighted: number
  /** Unweighted mean of values — shown on hover so the method is legible. */
  simple: number
  /** Number of observations behind the mean. */
  n: number
}

export function dualMean(values: number[], weights: number[]): DualMean {
  const n = values.length
  if (n === 0) return { weighted: 0, simple: 0, n: 0 }
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  const weighted =
    totalWeight > 0
      ? values.reduce((s, v, i) => s + v * (weights[i] ?? 0), 0) / totalWeight
      : values.reduce((s, v) => s + v, 0) / n
  const simple = values.reduce((s, v) => s + v, 0) / n
  return { weighted: round2(weighted), simple: round2(simple), n }
}

const round2 = (v: number) => Math.round(v * 100) / 100

/* ────────────────────────────────────────────────────────────────────────────
   Grain 1 — faculty × course × term (the finest grain the model carries)
   ──────────────────────────────────────────────────────────────────────────── */

export interface OfferingPoint extends FacultyOfferingRecord {
  year: number
  facultyName: string
  initials: string
  /** Responses derived from rate × enrolled — the model stores the rate, not the count. */
  responded: number
}

function initialsOf(name: string): string {
  const parts = name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase()
}

export function offeringPoints(): OfferingPoint[] {
  const facultyById = new Map(MOCK_FACULTY.map((f) => [f.id, f]))
  return MOCK_FACULTY_OFFERINGS.map((o) => {
    const f = facultyById.get(o.facultyId)
    const name = f?.name ?? o.facultyId
    return {
      ...o,
      year: termToYear(o.term),
      facultyName: name,
      initials: f?.initials ?? initialsOf(name),
      responded: Math.round((o.enrolled * o.responseRate) / 100),
    }
  }).sort((a, b) => a.year - b.year)
}

/** The most recent term that actually carries data — the anchor for 1Y / 3Y windows. */
export function latestYear(points: { year: number }[]): number {
  return points.reduce((max, p) => Math.max(max, p.year), Number.NEGATIVE_INFINITY)
}

/* ────────────────────────────────────────────────────────────────────────────
   Grain 2 — course × term (the two rated entities, kept separate)
   ──────────────────────────────────────────────────────────────────────────── */

export interface CourseTermPoint {
  courseCode: string
  courseName: string
  term: string
  year: number
  /** Course-content score, 1–5. */
  courseAvg: number
  /** Faculty-performance score, 1–5. Null when the offering has no faculty score. */
  facultyAvg: number | null
}

/**
 * Course × term pairs come from `priorOfferings` on CE surveys — the only place the model
 * carries course-content and faculty-performance scores side by side, which is what the
 * gap analysis (story 8) needs.
 */
export function courseTermPoints(): CourseTermPoint[] {
  const out: CourseTermPoint[] = []
  MOCK_SURVEYS.filter((s) => s.surveyType !== 'programmatic').forEach((s) => {
    s.priorOfferings?.forEach((po) => {
      out.push({
        courseCode: s.courseCode,
        courseName: s.courseName,
        term: po.term,
        year: termToYear(po.term),
        courseAvg: po.courseAvg,
        facultyAvg: po.facultyAvg ?? null,
      })
    })
  })
  return out.sort((a, b) => a.year - b.year)
}

/* ────────────────────────────────────────────────────────────────────────────
   Program-level series — stories 5, 6, 7
   ──────────────────────────────────────────────────────────────────────────── */

export interface TermSeriesPoint {
  term: string
  short: string
  year: number
  /** Mean course-content score across the term's offerings. */
  courseAvg: number | null
  /** Mean faculty-performance score across the term's offerings. */
  facultyAvg: number | null
  /** Enrollment-weighted response rate, 0–100. */
  responseRate: number | null
  enrolled: number
  responded: number
  courses: number
}

export function termSeries(): TermSeriesPoint[] {
  const ctp = courseTermPoints()
  const offerings = offeringPoints()

  const terms = new Set<string>([...ctp.map((p) => p.term), ...offerings.map((o) => o.term)])

  return [...terms]
    .sort(compareTerms)
    .map((term) => {
      const scorePoints = ctp.filter((p) => p.term === term)
      const offs = offerings.filter((o) => o.term === term)

      const courseAvgs = scorePoints.map((p) => p.courseAvg)
      const facultyAvgs = scorePoints.map((p) => p.facultyAvg).filter((v): v is number => v != null)

      const enrolled = offs.reduce((s, o) => s + o.enrolled, 0)
      const responded = offs.reduce((s, o) => s + o.responded, 0)

      return {
        term,
        short: shortTerm(term),
        year: termToYear(term),
        courseAvg: courseAvgs.length ? round2(mean(courseAvgs)) : null,
        facultyAvg: facultyAvgs.length ? round2(mean(facultyAvgs)) : null,
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : null,
        enrolled,
        responded,
        courses: new Set(scorePoints.map((p) => p.courseCode)).size,
      }
    })
}

const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

/* ────────────────────────────────────────────────────────────────────────────
   Faculty aggregates — stories 2, 9, 10, 11, 15, 16, 19
   ──────────────────────────────────────────────────────────────────────────── */

export interface FacultyStat {
  facultyId: string
  name: string
  initials: string
  /** Weighted headline + simple mean, both (D3 option C). */
  score: DualMean
  /** Enrollment-weighted response rate, 0–100. */
  responseRate: number
  offerings: number
  courses: number
  terms: number
  /** Mean over the trailing 1 year. Null when the window holds no offerings. */
  avg1y: number | null
  /** Mean over the trailing 3 years. Null when the window holds no offerings. */
  avg3y: number | null
  /** avg1y − avg3y. Positive = improving. Null when either window is empty. */
  drift: number | null
  /** Every individual offering rating — the distribution behind the dot (story 10). */
  ratings: number[]
}

function windowMean(points: OfferingPoint[], from: number, to: number): number | null {
  const inWindow = points.filter((p) => p.year > from && p.year <= to)
  if (!inWindow.length) return null
  return round2(
    dualMean(inWindow.map((p) => p.avgRating), inWindow.map((p) => p.enrolled)).weighted,
  )
}

export function facultyStats(): FacultyStat[] {
  const points = offeringPoints()
  const now = latestYear(points)
  const byFaculty = new Map<string, OfferingPoint[]>()
  points.forEach((p) => {
    const list = byFaculty.get(p.facultyId) ?? []
    list.push(p)
    byFaculty.set(p.facultyId, list)
  })

  return [...byFaculty.entries()]
    .map(([facultyId, offs]) => {
      const enrolled = offs.reduce((s, o) => s + o.enrolled, 0)
      const responded = offs.reduce((s, o) => s + o.responded, 0)
      const avg1y = windowMean(offs, now - 1, now)
      const avg3y = windowMean(offs, now - 3, now)
      return {
        facultyId,
        name: offs[0]!.facultyName,
        initials: offs[0]!.initials,
        score: dualMean(offs.map((o) => o.avgRating), offs.map((o) => o.enrolled)),
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
        offerings: offs.length,
        courses: new Set(offs.map((o) => o.courseCode)).size,
        terms: new Set(offs.map((o) => o.term)).size,
        avg1y,
        avg3y,
        drift: avg1y != null && avg3y != null ? round2(avg1y - avg3y) : null,
        ratings: offs.map((o) => o.avgRating),
      }
    })
    .sort((a, b) => b.score.weighted - a.score.weighted)
}

/** One faculty member's offerings, newest last — the portfolio spine (stories 14, 16, 19). */
export function facultyOfferings(facultyId: string): OfferingPoint[] {
  return offeringPoints().filter((o) => o.facultyId === facultyId)
}

export interface FacultyCourseStat {
  courseCode: string
  courseName: string
  score: DualMean
  responseRate: number
  terms: number
  /** Per-term trend for this course, oldest first — the row sparkline (story 19). */
  trend: { term: string; short: string; year: number; rating: number; responseRate: number }[]
}

/**
 * Courses a faculty member teaches, ranked best → worst, each carrying its own trend.
 * Stories 16 and 19 are one component: both want the course as the unit of analysis
 * *within* a person, which is the cut the legacy prototype never made (it only ever
 * sliced a person by term).
 */
export function facultyCourseStats(facultyId: string): FacultyCourseStat[] {
  const offs = facultyOfferings(facultyId)
  const byCourse = new Map<string, OfferingPoint[]>()
  offs.forEach((o) => {
    const list = byCourse.get(o.courseCode) ?? []
    list.push(o)
    byCourse.set(o.courseCode, list)
  })

  return [...byCourse.entries()]
    .map(([courseCode, rows]) => {
      const enrolled = rows.reduce((s, r) => s + r.enrolled, 0)
      const responded = rows.reduce((s, r) => s + r.responded, 0)
      return {
        courseCode,
        courseName: rows[0]!.courseName,
        score: dualMean(rows.map((r) => r.avgRating), rows.map((r) => r.enrolled)),
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
        terms: rows.length,
        trend: rows
          .slice()
          .sort((a, b) => a.year - b.year)
          .map((r) => ({
            term: r.term,
            short: shortTerm(r.term),
            year: r.year,
            rating: r.avgRating,
            responseRate: r.responseRate,
          })),
      }
    })
    .sort((a, b) => b.score.weighted - a.score.weighted)
}

/** A faculty member's response-rate history by term (story 11). */
export function facultyResponseTrend(facultyId: string): { term: string; short: string; year: number; responseRate: number }[] {
  const offs = facultyOfferings(facultyId)
  const byTerm = new Map<string, OfferingPoint[]>()
  offs.forEach((o) => {
    const list = byTerm.get(o.term) ?? []
    list.push(o)
    byTerm.set(o.term, list)
  })
  return [...byTerm.entries()]
    .map(([term, rows]) => {
      const enrolled = rows.reduce((s, r) => s + r.enrolled, 0)
      const responded = rows.reduce((s, r) => s + r.responded, 0)
      return {
        term,
        short: shortTerm(term),
        year: termToYear(term),
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
      }
    })
    .sort((a, b) => a.year - b.year)
}

/** Every faculty member's score by term — story 9 (compared against each other over time). */
export function facultyTermSeries(): { facultyId: string; name: string; term: string; short: string; year: number; rating: number }[] {
  const points = offeringPoints()
  const byKey = new Map<string, OfferingPoint[]>()
  points.forEach((p) => {
    const key = `${p.facultyId}::${p.term}`
    const list = byKey.get(key) ?? []
    list.push(p)
    byKey.set(key, list)
  })
  return [...byKey.values()]
    .map((rows) => {
      const r = rows[0]!
      return {
        facultyId: r.facultyId,
        name: r.facultyName,
        term: r.term,
        short: shortTerm(r.term),
        year: r.year,
        rating: dualMean(rows.map((x) => x.avgRating), rows.map((x) => x.enrolled)).weighted,
      }
    })
    .sort((a, b) => a.year - b.year)
}

/* ────────────────────────────────────────────────────────────────────────────
   Course aggregates — stories 3, 4, 12
   ──────────────────────────────────────────────────────────────────────────── */

export interface CourseStat {
  courseCode: string
  courseName: string
  score: DualMean
  responseRate: number
  terms: number
  avg1y: number | null
  avg3y: number | null
  drift: number | null
  ratings: number[]
}

export function courseStats(): CourseStat[] {
  const points = offeringPoints()
  const now = latestYear(points)
  const byCourse = new Map<string, OfferingPoint[]>()
  points.forEach((p) => {
    const list = byCourse.get(p.courseCode) ?? []
    list.push(p)
    byCourse.set(p.courseCode, list)
  })

  return [...byCourse.entries()]
    .map(([courseCode, rows]) => {
      const enrolled = rows.reduce((s, r) => s + r.enrolled, 0)
      const responded = rows.reduce((s, r) => s + r.responded, 0)
      const avg1y = windowMean(rows, now - 1, now)
      const avg3y = windowMean(rows, now - 3, now)
      return {
        courseCode,
        courseName: rows[0]!.courseName,
        score: dualMean(rows.map((r) => r.avgRating), rows.map((r) => r.enrolled)),
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
        terms: new Set(rows.map((r) => r.term)).size,
        avg1y,
        avg3y,
        drift: avg1y != null && avg3y != null ? round2(avg1y - avg3y) : null,
        ratings: rows.map((r) => r.avgRating),
      }
    })
    .sort((a, b) => b.score.weighted - a.score.weighted)
}

/** Course × term matrix for the heatmap (story 4). Sparse — absent cells stay absent. */
export interface HeatCell {
  courseCode: string
  term: string
  short: string
  year: number
  courseAvg: number
  facultyAvg: number | null
}

export function courseTermMatrix(): { cells: HeatCell[]; courses: string[]; terms: string[] } {
  const ctp = courseTermPoints()
  const cells = ctp.map((p) => ({
    courseCode: p.courseCode,
    term: p.term,
    short: shortTerm(p.term),
    year: p.year,
    courseAvg: p.courseAvg,
    facultyAvg: p.facultyAvg,
  }))
  // Rows ordered worst → best mean, so the problem courses sit together at one edge
  // rather than scattered alphabetically.
  const meanByCourse = new Map<string, number>()
  cells.forEach((c) => {
    const prev = meanByCourse.get(c.courseCode)
    meanByCourse.set(c.courseCode, prev == null ? c.courseAvg : (prev + c.courseAvg) / 2)
  })
  const courses = [...meanByCourse.entries()].sort((a, b) => a[1] - b[1]).map(([code]) => code)
  const terms = [...new Set(cells.map((c) => c.term))].sort(compareTerms)
  return { cells, courses, terms }
}

/* ────────────────────────────────────────────────────────────────────────────
   Gap analysis — story 8. Course score vs faculty score, the one question that
   separates "the course is broken" from "the instructor is struggling".
   ──────────────────────────────────────────────────────────────────────────── */

export interface GapPoint {
  courseCode: string
  courseName: string
  term: string
  short: string
  courseAvg: number
  facultyAvg: number
  /** Bubble weight — enrolled students behind the pair. */
  enrolled: number
}

export function gapPoints(): GapPoint[] {
  const enrolledByCourseTerm = new Map<string, number>()
  offeringPoints().forEach((o) => {
    const key = `${o.courseCode}::${o.term}`
    enrolledByCourseTerm.set(key, (enrolledByCourseTerm.get(key) ?? 0) + o.enrolled)
  })

  return courseTermPoints()
    .filter((p): p is CourseTermPoint & { facultyAvg: number } => p.facultyAvg != null)
    .map((p) => ({
      courseCode: p.courseCode,
      courseName: p.courseName,
      term: p.term,
      short: shortTerm(p.term),
      courseAvg: p.courseAvg,
      facultyAvg: p.facultyAvg,
      enrolled: enrolledByCourseTerm.get(`${p.courseCode}::${p.term}`) ?? 20,
    }))
}

/* ────────────────────────────────────────────────────────────────────────────
   Program summary — story 1
   ──────────────────────────────────────────────────────────────────────────── */

export interface ProgramSummary {
  facultyScore: DualMean
  courseScore: DualMean
  responseRate: number
  enrolled: number
  responded: number
  facultyCount: number
  courseCount: number
  termCount: number
  /** Frequency counts, not percentages — Aarti D17 ("8 of 20 questions" beats "40%"). */
  facultyBelowThreshold: number
  coursesBelowThreshold: number
  /** Sparkline series for the KPI tiles (VIZ-010 forbids a bare number). */
  facultySpark: { x: number; y: number }[]
  courseSpark: { x: number; y: number }[]
  responseSpark: { x: number; y: number }[]
}

/**
 * The score below which a course/faculty is "needs attention".
 *
 * D4 is open with Aarti — no note fixes a number, and Settings today configures the
 * *response* threshold and Likert scale only. `cleveland-dot.md:86` sets the pattern
 * default as the median, overridable per metric; 4.0 appears in the spec as an
 * illustration, not a decision. We use the pattern default (median) so the flag is
 * relative to this program rather than to an invented constant.
 */
export function medianOf(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? round2((sorted[mid - 1]! + sorted[mid]!) / 2) : sorted[mid]!
}

export function programSummary(): ProgramSummary {
  const series = termSeries()
  const fac = facultyStats()
  const courses = courseStats()
  const ctp = courseTermPoints()
  const offs = offeringPoints()

  const enrolled = offs.reduce((s, o) => s + o.enrolled, 0)
  const responded = offs.reduce((s, o) => s + o.responded, 0)

  const facultyScore = dualMean(offs.map((o) => o.avgRating), offs.map((o) => o.enrolled))
  const courseScore = dualMean(ctp.map((p) => p.courseAvg), ctp.map(() => 1))

  const facultyMedian = medianOf(fac.map((f) => f.score.weighted))
  const courseMedian = medianOf(courses.map((c) => c.score.weighted))

  const scored = series.filter((s) => s.courseAvg != null || s.facultyAvg != null || s.responseRate != null)

  return {
    facultyScore,
    courseScore,
    responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
    enrolled,
    responded,
    facultyCount: fac.length,
    courseCount: courses.length,
    termCount: series.filter((s) => s.courses > 0 || s.enrolled > 0).length,
    facultyBelowThreshold: fac.filter((f) => f.score.weighted < facultyMedian).length,
    coursesBelowThreshold: courses.filter((c) => c.score.weighted < courseMedian).length,
    facultySpark: scored
      .filter((s) => s.facultyAvg != null)
      .map((s) => ({ x: s.year, y: s.facultyAvg as number })),
    courseSpark: scored
      .filter((s) => s.courseAvg != null)
      .map((s) => ({ x: s.year, y: s.courseAvg as number })),
    responseSpark: scored
      .filter((s) => s.responseRate != null)
      .map((s) => ({ x: s.year, y: s.responseRate as number })),
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Benchmarks — story 15's percentile substitute.
   §7.3 bans percentile by name ("you're at the 60th percentile … reverse-encodes
   peer rank"). Aarti validated the alternative — "compared to the department
   average to the university average" — and cited Watermark/Anthology as proof
   faculty accept it. Position without rank.
   ──────────────────────────────────────────────────────────────────────────── */

export interface Benchmarks {
  /** Every faculty member's weighted score — the distribution to place a dot on. */
  distribution: number[]
  /** Mean across this program's faculty. */
  department: number
  /** Mean across every offering in the tenant — stands in for "university". */
  university: number
}

export function benchmarks(): Benchmarks {
  const fac = facultyStats()
  const offs = offeringPoints()
  return {
    distribution: fac.map((f) => f.score.weighted),
    department: round2(mean(fac.map((f) => f.score.weighted))),
    university: dualMean(offs.map((o) => o.avgRating), offs.map((o) => o.enrolled)).weighted,
  }
}
