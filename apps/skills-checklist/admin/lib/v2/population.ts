import { heldState } from "./approvals"
import { evalsOfStudentSkill, skillById } from "./evidence-index"
import { ALL, NO_FILTERS, PACE_MARGIN, SMALL_NUMBERS, cohortOf, currentTerm, findTerm, scoped, studentsIn, type ReportFilters } from "./filters"
import { DEMO_TODAY } from "./seed-core"
import { skillProgress } from "./student"
import type { Evaluation, Person, Setting, Skill, Submission, V2State } from "./types"

/**
 * The population calculation: the single source for "required", "achieved" and "behind" on every screen.
 *
 * Population (strategy/06 S2): students of the chosen cohort and group who take at least one course offering in the scope term
 * (and the scope course, when one is chosen). A student's required skills are the MANDATORY, configured, published skills of
 * their own cohort's offerings in that term, narrowed by category and tag. Location and setting recount evidence first (RP-08).
 * Pending never counts: progress reads counted evaluations only, on `heldState`, so evidence held for approval (including
 * evidence from an evaluator name not adopted yet) is excluded everywhere.
 *
 * Basis (06 section 3.2): every "behind" is measured against one standard.
 * - expected (default, "Expected now"): behind when counted evaluations are more than PACE_MARGIN short of
 *   (required evaluations x share of the term gone). Pace is a prototype assumption (PENDING-ROMIT).
 * - median: behind when the share counted is MEDIAN_MARGIN points or more under the scope median. Needs n >= SMALL_NUMBERS.
 * - all: behind means not every required skill is achieved yet.
 *
 * Pure, no React, no screen copy. Moved here from lib/lab/dashboard.ts, which re-exports everything.
 */

export type Basis = "expected" | "median" | "all"
export const DEFAULT_BASIS: Basis = "expected"

/** The scope fields the population honours. Structurally the lab scope (lib/lab/scope.ts LabScope), so either can be passed. */
export interface PopulationScope {
  cohort: string
  group: string
  /** Term id, name or slug; empty means the current term. */
  term: string
  course: string
  cat?: string
  tag?: string
  loc?: string
  setting?: string
  basis?: Basis
  /**
   * Course type (CALL 10-26, clinical courses first; a default pending the client): absent means clinical courses only,
   * "didactic" includes didactic courses too. A course chosen by id is honoured whatever its type.
   */
  incl?: "didactic"
}

/** True when the scope reads clinical courses only (the default). */
export const clinicalOnly = (scope: Pick<PopulationScope, "incl">): boolean => scope.incl !== "didactic"

export const DEFAULT_SCOPE: PopulationScope = { cohort: "", group: "", term: "", course: "" }

/** Points under the peer median, or under expected in a section cell, that count as a shortfall worth an amber mark. */
export const MEDIAN_MARGIN = 8
export const CELL_MARGIN = 8
export { PACE_MARGIN }

const DAY = 86_400_000
const pctOf = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))

export const basisOfScope = (scope: PopulationScope): Basis => scope.basis ?? DEFAULT_BASIS

/** The report filters a scope implies (term has no report filter; offerings apply it). */
export function scopeFilters(scope: PopulationScope): ReportFilters {
  return {
    ...NO_FILTERS,
    cohort: scope.cohort || ALL,
    group: scope.group || ALL,
    course: scope.course || ALL,
    category: scope.cat || ALL,
    tag: scope.tag || ALL,
    location: scope.loc || ALL,
    setting: (scope.setting as Setting | undefined) || ALL,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Term

export interface TermInfo {
  id: string
  name: string
  start: string
  end: string
  current: boolean
  /** Share of the term gone on the demo day, 0 to 1. */
  share: number
  week: number
  weeks: number
}

export function termShareOf(start: string, end: string, today: string = DEMO_TODAY): number {
  const a = Date.parse(`${start}T00:00:00Z`)
  const b = Date.parse(`${end}T00:00:00Z`)
  const t = Date.parse(`${today}T00:00:00Z`)
  return b <= a ? 1 : Math.min(1, Math.max(0, (t - a) / (b - a)))
}

/** The scope's term with its clock. One lookup (`findTerm`): id, name or slug; empty or unknown means the current term. */
export function resolveTerm(s: V2State, scope: Pick<PopulationScope, "term">, today: string = DEMO_TODAY): TermInfo {
  const t = (scope.term ? findTerm(s, scope.term) : null) ?? currentTerm(s)
  const share = termShareOf(t.start, t.end, today)
  const weeks = Math.max(1, Math.round((Date.parse(`${t.end}T00:00:00Z`) - Date.parse(`${t.start}T00:00:00Z`)) / DAY / 7))
  const gone = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${t.start}T00:00:00Z`)) / DAY)
  return { id: t.id, name: t.name, start: t.start, end: t.end, current: !!t.current, share, week: Math.min(weeks, Math.max(0, Math.ceil(gone / 7))), weeks }
}

/**
 * Offerings of the term (and course), keyed by cohort id: course ids each cohort takes. `clinical` keeps clinical courses only
 * (the default scope); a course chosen by id is kept whatever its type.
 */
export function offeringsByCohort(s: V2State, termId: string, courseId: string = "", clinical = false): Map<string, string[]> {
  const out = new Map<string, string[]>()
  const didactic = clinical && !courseId ? new Set((s.courses ?? []).filter((c) => c.kind === "didactic").map((c) => c.id)) : null
  for (const o of s.offerings ?? []) {
    if (o.termId !== termId || (courseId && o.courseId !== courseId) || didactic?.has(o.courseId)) continue
    out.set(o.cohortId, [...(out.get(o.cohortId) ?? []), o.courseId])
  }
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Required sets

export interface RequiredSkill {
  skill: Skill
  level: "mandatory" | "recommended" | "optional"
}

/** Strongest level first, so a skill mapped at two levels in one cohort's courses reads the stronger one. */
const LEVEL_RANK: Record<RequiredSkill["level"], number> = { mandatory: 0, recommended: 1, optional: 2 }

/**
 * A skill that can count in any report figure: configured, published (put into use) and not deactivated (SL-11, decision D-X14).
 * The single filter every required set and every figure goes through.
 */
/**
 * The one definition of "Configured" (REQ SC-01, IM-09, IM-10; decision D-X31): the skill has a saved, complete configuration that
 * students can be asked against and that can be mapped. The data layer still carries two flags from v2 (`configured`, `published`);
 * a skill with `configured` but not `published` holds a rule that was never saved for use, which the lab shows as Not configured
 * with "Draft saved". Library status, mapping, facts and reports all read this, so no figure counts the two flags apart.
 */
export const isConfigured = (k: Pick<Skill, "configured" | "published">): boolean => k.configured && k.published

export const isReportable = (k: Pick<Skill, "configured" | "published" | "active">): boolean => isConfigured(k) && k.active !== false

/**
 * The two required sets (decision D-X12). They answer different questions and are never mixed in one figure.
 * - REQUIRED THIS TERM ("Required this term"): the mandatory skills of the student's own cohort's offerings in the term. Drives
 *   pace, "behind", "required achieved" on the dashboard, attainment, student progress and the v2 reports. `requiredSkillsFor`.
 * - REQUIRED TO GRADUATE ("Required to graduate"): the program list's required-before-graduation flag. Drives graduation
 *   readiness, one short, far behind (4 or more missing, decision D-X11) and verification. `requiredToComplete`.
 */
export const REQUIRED_SET_LABEL = { thisTerm: "Required this term", toGraduate: "Required to graduate" } as const

/** Required to graduate: reportable skills the program list flags as required before graduation, by name. */
export function requiredToComplete(s: V2State): Skill[] {
  return s.skills.filter((k) => isReportable(k) && !!k.hgtc?.required).sort((a, b) => a.name.localeCompare(b.name))
}

/** Missing-to-graduate thresholds (decision D-X11): exactly 1 is "one short", 2 to 3 "short", FAR_BEHIND_MISSING or more "far behind". */
export const FAR_BEHIND_MISSING = 4
export type GraduationStage = "complete" | "one-short" | "short" | "far"
export const graduationStageOf = (missing: number): GraduationStage => (missing === 0 ? "complete" : missing === 1 ? "one-short" : missing >= FAR_BEHIND_MISSING ? "far" : "short")

/**
 * Required (mandatory; with includeOptional also recommended and optional) skills per cohort id, for the offerings of a term and
 * course. Clinical courses only unless the scope includes didactic: today no didactic course carries a mandatory skill, so the
 * mandatory sets (every "Required this term" figure) are the same either way (tests/v2/consistency-bases.test.ts pins it).
 */
export function requiredSets(s: V2State, scope: Pick<PopulationScope, "course" | "cat" | "tag" | "incl">, termId: string, includeOptional = false): Map<string, RequiredSkill[]> {
  const byCohort = offeringsByCohort(s, termId, scope.course, clinicalOnly(scope))
  const out = new Map<string, RequiredSkill[]>()
  for (const [cohortId, courseIds] of byCohort) {
    const seen = new Map<string, RequiredSkill>()
    for (const m of s.mappings) {
      if (!courseIds.includes(m.courseId)) continue
      if (m.level === "not-expected" || (m.level !== "mandatory" && !includeOptional)) continue
      const skill = skillById(s, m.skillId)
      if (!skill || !isReportable(skill)) continue
      if (scope.cat && skill.category !== scope.cat) continue
      if (scope.tag && !(skill.tags ?? []).includes(scope.tag)) continue
      const prev = seen.get(skill.id)
      if (!prev || LEVEL_RANK[m.level] < LEVEL_RANK[prev.level]) seen.set(skill.id, { skill, level: m.level })
    }
    out.set(cohortId, [...seen.values()].sort((a, b) => a.skill.name.localeCompare(b.skill.name)))
  }
  return out
}

/** Required this term: one student's mandatory skills (own cohort's offerings in the term). Empty when the cohort takes nothing. */
export function requiredSkillsFor(s: V2State, studentId: string, termKey: string = ""): Skill[] {
  const p = s.people.find((x) => x.id === studentId)
  if (!p?.cohortId) return []
  const term = resolveTerm(s, { term: termKey })
  return (requiredSets(s, { course: "" }, term.id).get(p.cohortId) ?? []).map((r) => r.skill)
}

/** Alias that names the set (decision D-X12). */
export const requiredThisTerm = (s: V2State, studentId: string, termKey: string = ""): Skill[] => requiredSkillsFor(s, studentId, termKey)

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const v = [...values].sort((a, b) => a - b)
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2)
}

// ---------------------------------------------------------------------------------------------------------------------
// Rows

export interface OpenSkill {
  skillId: string
  name: string
  category: string
  counted: number
  need: number
}

export interface SectionTally {
  needed: number
  collected: number
  achieved: number
  total: number
}

export interface StudentRow {
  id: string
  name: string
  cohort: string
  group: string | null
  /** Required skills in scope, and how many are achieved. */
  required: number
  achieved: number
  /** Successful evaluations counted toward the required rules (never above what a rule needs), of what they ask for. */
  collected: number
  needed: number
  /** Evaluations the term clock expects by now. */
  expected: number
  /** Share of required evaluations counted, 0 to 100. */
  pct: number
  /** Points against the basis: pct minus expected share, minus the scope median, or pct itself under All required. */
  gap: number
  behind: boolean
  /** Evaluations short of the term clock, or 0 (the same under every basis). */
  behindBy: number
  open: OpenSkill[]
  /** Every required skill in scope for this student. */
  requiredIds: string[]
  bySection: Record<string, SectionTally>
}

export interface Population {
  term: TermInfo
  basis: Basis
  rows: StudentRow[]
  /** Students the cohort and group filters leave in, before the term and course (for the empty-scope explanation). */
  candidates: number
  median: number
  /** Peer median suppressed because the scope holds fewer than SMALL_NUMBERS students. */
  medianSuppressed: boolean
  /** Ids of every student in scope. */
  ids: Set<string>
  /** The effective (held) state with the evidence filters applied: what every count in the rows was read from. */
  evidenceState: V2State
}

const popCache = new WeakMap<V2State, Map<string, Population>>()
const scopeKey = (scope: PopulationScope, includeOptional: boolean) => JSON.stringify([scope.cohort, scope.group, scope.term, scope.course, scope.cat ?? "", scope.tag ?? "", scope.loc ?? "", scope.setting ?? "", scope.basis ?? "", clinicalOnly(scope), includeOptional])

/** The population for one scope. Cached per state and scope on the demo day; treat the result as read-only. */
export function populationRows(state: V2State, scope: PopulationScope = DEFAULT_SCOPE, today: string = DEMO_TODAY, opts: { includeOptional?: boolean } = {}): Population {
  const key = scopeKey(scope, !!opts.includeOptional)
  if (today === DEMO_TODAY) {
    const hit = popCache.get(state)?.get(key)
    if (hit) return hit
  }
  const s = heldState(state)
  const term = resolveTerm(s, scope, today)
  const basis = basisOfScope(scope)
  const filters: ReportFilters = { ...NO_FILTERS, location: scope.loc || ALL, setting: (scope.setting as Setting | undefined) || ALL }
  const ev = scoped(s, filters)
  const sets = requiredSets(s, scope, term.id, !!opts.includeOptional)
  const candidates = studentsIn(s, scopeFilters(scope))
  const rows: StudentRow[] = []
  for (const p of candidates) {
    const req = sets.get(p.cohortId ?? "")
    if (!req || req.length === 0) continue
    rows.push(rowFor(ev, s, p, req, term.share))
  }
  const med = median(rows.map((r) => r.pct))
  const medianSuppressed = basis === "median" && rows.length < SMALL_NUMBERS
  const expectedPts = Math.round(term.share * 100)
  for (const r of rows) {
    if (basis === "expected") {
      r.gap = r.pct - expectedPts
      r.behind = r.behindBy > 0
    } else if (basis === "median") {
      r.gap = r.pct - med
      r.behind = !medianSuppressed && r.gap <= -MEDIAN_MARGIN
    } else {
      r.gap = r.pct
      r.behind = r.achieved < r.required
    }
  }
  rows.sort((a, b) => a.gap - b.gap || a.name.localeCompare(b.name))
  const out: Population = { term, basis, rows, candidates: candidates.length, median: med, medianSuppressed, ids: new Set(rows.map((r) => r.id)), evidenceState: ev }
  if (today === DEMO_TODAY) {
    const m = popCache.get(state) ?? new Map<string, Population>()
    m.set(key, out)
    popCache.set(state, m)
  }
  return out
}

function rowFor(ev: V2State, s: V2State, p: Person, req: RequiredSkill[], share: number): StudentRow {
  let collected = 0
  let needed = 0
  let achieved = 0
  const open: OpenSkill[] = []
  const bySection: Record<string, SectionTally> = {}
  for (const { skill } of req) {
    const pr = skillProgress(ev, p.id, skill.id)
    const need = pr?.need ?? 0
    const counted = Math.min(pr?.counted ?? 0, need)
    collected += counted
    needed += need
    const t = (bySection[skill.category] ??= { needed: 0, collected: 0, achieved: 0, total: 0 })
    t.needed += need
    t.collected += counted
    t.total += 1
    if (pr?.achieved) {
      achieved += 1
      t.achieved += 1
    } else open.push({ skillId: skill.id, name: skill.name, category: skill.category, counted: pr?.counted ?? 0, need })
  }
  const expected = Math.floor(needed * share)
  const short = expected - collected
  return {
    id: p.id,
    name: p.name,
    cohort: cohortOf(s, p),
    group: p.group ?? null,
    required: req.length,
    achieved,
    collected,
    needed,
    expected,
    pct: pctOf(collected, needed),
    gap: 0,
    behind: false,
    behindBy: short > PACE_MARGIN ? short : 0,
    open,
    requiredIds: req.map((x) => x.skill.id),
    bySection,
  }
}

/** One student's row in the default scope of their own cohort (current term, Expected now), or null when nothing is required. */
export function studentRow(s: V2State, studentId: string, termKey: string = "", today: string = DEMO_TODAY): StudentRow | null {
  return populationRows(s, { ...DEFAULT_SCOPE, term: termKey }, today).rows.find((r) => r.id === studentId) ?? null
}

// ---------------------------------------------------------------------------------------------------------------------
// Mandatory progress per student (verification snapshot, director list, report documents)

export interface MandatoryProgressRow {
  skill: Skill
  achieved: boolean
  counted: number
  need: number
  /** The student's counted evaluations for this skill, newest first. */
  evaluations: Evaluation[]
}

/** A student's mandatory skills (own cohort's offerings, current term unless named) with progress, on the effective state. */
export function mandatoryProgressFor(state: V2State, studentId: string, termKey: string = ""): MandatoryProgressRow[] {
  const s = heldState(state)
  const out: MandatoryProgressRow[] = []
  for (const skill of requiredSkillsFor(s, studentId, termKey)) {
    const p = skillProgress(s, studentId, skill.id)
    if (!p) continue
    const evaluations = evalsOfStudentSkill(s, studentId, skill.id).filter((e) => e.status === "counted").sort((a, b) => (a.date < b.date ? 1 : -1))
    out.push({ skill, achieved: p.achieved, counted: p.counted, need: p.need, evaluations })
  }
  return out.sort((a, b) => a.skill.name.localeCompare(b.skill.name))
}

// ---------------------------------------------------------------------------------------------------------------------
// Open requests

/** Requests sent to an evaluator and not yet signed (with an evaluator, or stalled), for students in `ids`. Oldest first. */
export function openRequests(s: V2State, ids: Set<string>): Submission[] {
  return s.submissions.filter((x) => (x.status === "with-evaluator" || x.status === "stalled") && ids.has(x.studentId)).sort((a, b) => b.daysWaiting - a.daysWaiting || a.id.localeCompare(b.id))
}

/** True when a site sits in the scope's location and setting (no location or setting chosen: always true). */
export function siteInScope(s: V2State, siteId: string | undefined, scope: Pick<PopulationScope, "loc" | "setting">): boolean {
  if (!scope.loc && !scope.setting) return true
  const site = siteId ? s.sites?.find((x) => x.id === siteId) : undefined
  if (!site) return false
  if (scope.loc && site.location !== scope.loc) return false
  if (scope.setting) {
    const setting = s.program.locations?.find((l) => l.name === site.location)?.setting
    if (setting !== scope.setting) return false
  }
  return true
}

/** Open requests of a population, narrowed to the scope's location and setting by the request's site. */
export const openRequestsIn = (s: V2State, ids: Set<string>, scope: Pick<PopulationScope, "loc" | "setting">): Submission[] => {
  const open = openRequests(s, ids)
  return scope.loc || scope.setting ? open.filter((x) => siteInScope(s, x.siteId, scope)) : open
}

/** Totals of a population: required student-skill records, achieved, the share, and students behind. */
export function populationTotals(pop: Population): { students: number; records: number; achieved: number; achievedPct: number; behind: number } {
  const records = pop.rows.reduce((t, r) => t + r.required, 0)
  const achieved = pop.rows.reduce((t, r) => t + r.achieved, 0)
  return { students: pop.rows.length, records, achieved, achievedPct: pctOf(achieved, records), behind: pop.rows.filter((r) => r.behind).length }
}
