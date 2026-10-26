import { DEMO_TODAY } from "./seed-core"
import type { Evaluation, Person, Setting, Term, V2State } from "./types"

/**
 * Primitives every figure is built from: the population filters, the evidence filters (RP-08), the term lookup and the pace
 * constants. Pure, no React, no screen copy. `reports.ts` re-exports all of it, so older imports keep working; new code (the
 * population and approvals modules, the facts registry) imports from here, which keeps the module graph free of cycles.
 */

export interface ReportFilters {
  /** Population filters (RP-01): who is counted. */
  cohort: string
  /** A student group (program group name, track or custom rules; see inGroup). Independent of cohort since 2026-10-26. */
  group: string
  /** The clinical course the evidence was gathered in. */
  course: string
  category: string
  /** A program-defined tag (SL-07). Tags cut across categories, so a skill with two tags is in both. */
  tag: string
  /** Where the evidence was gathered (RP-08). */
  location: string
  setting: "all" | Setting
  clinicalSetting: string
  mandatoryOnly: boolean
}

export const ALL = "all"
export const NO_FILTERS: ReportFilters = { cohort: ALL, group: ALL, course: ALL, category: ALL, tag: ALL, location: ALL, setting: ALL, clinicalSetting: ALL, mandatoryOnly: false }

export const SETTING_LABEL: Record<Setting, string> = { clinical: "Clinical", lab: "Lab", simulation: "Simulation" }

/** Peer comparisons and subgroups are hidden below this many students. */
export const SMALL_NUMBERS = 5

/** A student is behind when they are more than this many evaluations short of the pace. One short is within the noise of scheduling. */
export const PACE_MARGIN = 1

/** Fallback term clock when a state carries no terms. The requirements do not define pace; these dates are the prototype's assumption. */
export const TERM = { start: "2026-08-24", end: "2026-12-11" }

export const cohortOf = (s: V2State, p: Person): string => p.cohort ?? s.course.cohort
export const groupOf = (p: Person): string | null => p.group ?? null

export const students = (s: V2State): Person[] => s.people.filter((p) => p.kind === "student")

// ---------------------------------------------------------------------------------------------------------------------
// Student groups (REQ line 303: group is its own filter; CALL 10-26: custom groups for programs without a lockstep cohort)
//
// A group value is one of: a program group name ("Group A", in whichever cohorts have it), a track ("trk:<track id>"), or a
// custom group made of filter rules ("cg:cat=Hybrid&enr=2025&grad=2027"). The rules live in the value itself, so a pasted link
// resolves the same students on every screen with no stored definition. Group no longer needs a cohort; with one, they intersect.

export const TRACK_GROUP_PREFIX = "trk:"
export const CUSTOM_GROUP_PREFIX = "cg:"

export interface GroupRule {
  /** Enrollment category, for example Day or Hybrid. */
  category?: string
  enrollmentYear?: number
  graduationYear?: number
}

export function customGroupValue(r: GroupRule): string {
  const q = new URLSearchParams()
  if (r.category) q.set("cat", r.category)
  if (r.enrollmentYear) q.set("enr", String(r.enrollmentYear))
  if (r.graduationYear) q.set("grad", String(r.graduationYear))
  return `${CUSTOM_GROUP_PREFIX}${q.toString()}`
}

export function parseCustomGroup(value: string): GroupRule | null {
  if (!value.startsWith(CUSTOM_GROUP_PREFIX)) return null
  const q = new URLSearchParams(value.slice(CUSTOM_GROUP_PREFIX.length))
  const n = (k: string) => (q.get(k) && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : undefined)
  const r: GroupRule = {}
  if (q.get("cat")) r.category = q.get("cat")!
  const e = n("enr")
  const g = n("grad")
  if (e) r.enrollmentYear = e
  if (g) r.graduationYear = g
  return r
}

/** The graduation year of a student: their cohort record's, else the year in the cohort name. */
export function graduationYearOf(s: V2State, p: Person): number | undefined {
  const c = (s.cohorts ?? []).find((x) => x.id === p.cohortId)
  const y = Number(c?.graduates ?? (p.cohort ?? "").match(/(\d{4})\s*$/)?.[1])
  return Number.isFinite(y) && y > 0 ? y : undefined
}

export const matchesRule = (s: V2State, p: Person, r: GroupRule): boolean =>
  (!r.category || p.enrollmentCategory === r.category) && (!r.enrollmentYear || p.enrollmentYear === r.enrollmentYear) && (!r.graduationYear || graduationYearOf(s, p) === r.graduationYear)

/** True when a student is in a group value (see above). An empty or "all" value matches everyone. */
export function inGroup(s: V2State, p: Person, group: string): boolean {
  if (!group || group === ALL) return true
  if (group.startsWith(TRACK_GROUP_PREFIX)) return !!p.trackIds?.includes(group.slice(TRACK_GROUP_PREFIX.length))
  const rule = parseCustomGroup(group)
  if (rule) return matchesRule(s, p, rule)
  return groupOf(p) === group
}

/** Words for a group value: the program group name, the track name, or the rules ("Hybrid, enrolled 2025"). */
export function groupValueLabel(s: V2State, group: string, extra: readonly CustomGroup[] = []): string {
  if (group.startsWith(TRACK_GROUP_PREFIX)) return (s.tracks ?? []).find((t) => t.id === group.slice(TRACK_GROUP_PREFIX.length))?.name ?? group
  const r = parseCustomGroup(group)
  if (!r) return group
  const named = [...SAMPLE_CUSTOM_GROUPS, ...extra].find((c) => c.id === group)
  if (named) return named.name
  const parts = [r.category, r.enrollmentYear ? `enrolled ${r.enrollmentYear}` : "", r.graduationYear ? `graduating ${r.graduationYear}` : ""].filter(Boolean) as string[]
  const text = parts.join(", ")
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Every student"
}

/** A custom student group: a name and the rules that pick its students. Its id is customGroupValue(rule). */
export interface CustomGroup {
  id: string
  name: string
  rule: GroupRule
}

export const customGroup = (name: string, rule: GroupRule): CustomGroup => ({ id: customGroupValue(rule), name, rule })

/** Sample data: one custom group a program without a lockstep cohort might keep (students who enrolled in 2025, across cohorts). */
export const SAMPLE_CUSTOM_GROUPS: readonly CustomGroup[] = [customGroup("Enrolled in 2025", { enrollmentYear: 2025 })]

export interface GroupOption {
  value: string
  label: string
  kind: "group" | "track" | "custom"
}

/**
 * Every group a scope can filter on, with no cohort needed (REQ line 303): the program groups of every cohort (union, by name),
 * the tracks, then the custom groups (the sample ones plus any `extra` made in this session). Only groups with a student.
 */
export function groupOptions(s: V2State, extra: readonly CustomGroup[] = []): GroupOption[] {
  const ps = students(s)
  const names = [...new Set(ps.map(groupOf).filter((g): g is string => !!g))].sort()
  const out: GroupOption[] = names.map((g) => ({ value: g, label: g, kind: "group" }))
  for (const t of s.tracks ?? []) if (ps.some((p) => p.trackIds?.includes(t.id))) out.push({ value: `${TRACK_GROUP_PREFIX}${t.id}`, label: t.name, kind: "track" })
  const seen = new Set<string>()
  for (const c of [...SAMPLE_CUSTOM_GROUPS, ...extra]) {
    if (seen.has(c.id)) continue
    seen.add(c.id)
    out.push({ value: c.id, label: c.name, kind: "custom" })
  }
  return out
}

/** The students the population filters (cohort, group) leave in. Group is independent of cohort; with both, they intersect. */
export const studentsIn = (s: V2State, f: ReportFilters): Person[] =>
  students(s).filter((p) => (f.cohort === ALL || cohortOf(s, p) === f.cohort) && (f.group === ALL || inGroup(s, p, f.group)))

/** The evaluations the evidence filters (course, location, setting, clinical setting) leave in. */
export const matchesEvidence = (s: V2State, e: Evaluation, f: ReportFilters) =>
  (f.course === ALL || (e.courseId ?? s.course.id) === f.course) &&
  (f.location === ALL || e.location === f.location) &&
  (f.setting === ALL || e.setting === f.setting) &&
  (f.clinicalSetting === ALL || (e.setting === "clinical" && e.clinicalSetting === f.clinicalSetting))

export const evidenceFiltered = (f: ReportFilters) => f.course !== ALL || f.location !== ALL || f.setting !== ALL || f.clinicalSetting !== ALL

/** RP-08: re-scope the evidence first (course, location, setting), so every figure computed from the result is recalculated. */
export function scoped(s: V2State, f: ReportFilters): V2State {
  return evidenceFiltered(f) ? { ...s, evaluations: s.evaluations.filter((e) => matchesEvidence(s, e, f)) } : s
}

// ---------------------------------------------------------------------------------------------------------------------
// Terms

/** URL-friendly form of a term name: "Fall 2026" -> "fall-2026". */
export const termSlug = (name: string): string => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

/**
 * The one term lookup every screen uses. A key may be the term id ("trm-fa26"), its name ("Fall 2026") or its slug ("fall-2026").
 * An empty or unknown key means the current term. Returns null only when the state carries no terms.
 */
export function findTerm(s: Pick<V2State, "terms">, key?: string | null): Term | null {
  const terms = s.terms ?? []
  const k = (key ?? "").trim()
  if (k) {
    const hit = terms.find((t) => t.id === k || t.name === k || termSlug(t.name) === termSlug(k))
    if (hit) return hit
  }
  return terms.find((t) => t.current) ?? null
}

/** The current term, or the fallback clock as a term when the state has none. */
export function currentTerm(s: Pick<V2State, "terms">): Term {
  return findTerm(s) ?? { id: "term", name: "This term", start: TERM.start, end: TERM.end, current: true }
}

const DAY = 86_400_000

/** Whole days from `from` to `to` (ISO dates or datetimes), negative when `to` is earlier. */
export const daysFrom = (from: string, to: string = DEMO_TODAY): number => Math.round((Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / DAY)
