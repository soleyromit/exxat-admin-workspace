import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { ALL, SETTING_LABEL, SMALL_NUMBERS, cohortsOf, conflictFix, explainFilters, locationsOf, type ReportFilters } from "@/lib/v2/reports"
import { groupOptions, groupValueLabel } from "@/lib/v2/filters"
import { skillById } from "@/lib/v2/evidence-index"
import { skillProgress } from "@/lib/v2/student"
import type { Setting, Submission, V2State } from "@/lib/v2/types"
import { APPROVAL_OLD_DAYS, approvalTotals, approvalsInScope, CAUSE_LABEL, type ApprovalEntry } from "@/lib/v2/approvals"
import { CELL_MARGIN, MEDIAN_MARGIN, isConfigured, median, openRequests, openRequestsIn, populationRows, siteInScope, resolveTerm, type Population, type StudentRow, type TermInfo } from "@/lib/v2/population"
import { EVALUATOR_KINDS } from "@/lib/v2/facts"
import { RECORD_STATE_META } from "@/lib/v2/labels"
import { countSkills, inSentence, skillNoun, skillNounPlural } from "./terms"
import { removeScope, toReportFilters, withScope, type Basis, type LabScope, type ScopeKey } from "./scope"
import { NEW_EVALUATORS_HREF } from "./admin-ia"

export { openRequestsIn, siteInScope }

// The population calculation lives in lib/v2/population.ts (single source). Re-exported so existing imports keep working.
export { CELL_MARGIN, MEDIAN_MARGIN, PACE_MARGIN, median, offeringsByCohort, openRequests, populationRows, populationTotals, requiredSets, requiredSkillsFor, resolveTerm, studentRow } from "@/lib/v2/population"
export type { OpenSkill, Population, RequiredSkill, SectionTally, StudentRow, TermInfo } from "@/lib/v2/population"

/**
 * Staff dashboard model (strategy/06-dashboard-patterns.md), a pure function of the v2 state and the URL scope.
 *
 * Population (06 S2): students of the chosen cohort and group who take at least one course offering in the scope term (and the
 * scope course, when one is chosen). A student's required skills are the mandatory, configured, published skills of those
 * offerings, narrowed by category and tag. No v2 selector does this per offering (v2 `paceRows` reads the focus course only), so
 * it is computed here from `skillProgress` and the offerings, never by editing lib/v2. Location and setting recount evidence
 * first (RP-08) through the v2 `scoped` selector. Pending never counts: `skillProgress` reads counted evaluations only.
 *
 * Basis (06 section 3.2): every figure is measured against one standard, named in the hero sentence.
 * - Expected now: behind when counted evaluations are more than PACE_MARGIN short of (required x share of the term gone).
 *   Pace is a prototype assumption (PENDING-ROMIT), so the page captions it.
 * - Peer median: behind when the share counted is MEDIAN_MARGIN points or more under the scope median. Needs n >= 5.
 * - All required: behind means not every required skill is achieved yet.
 */

export const LAB_BASE = "/lab/admin"
export const DRILL_PATH = `${LAB_BASE}/dashboard-drill`
/** Age buckets for open requests, in days (06 metric "Waiting"). */
export const AGE_BUCKETS = [
  { id: "a0", label: "0 to 3 days", min: 0, max: 3 },
  { id: "a1", label: "4 to 7 days", min: 4, max: 7 },
  { id: "a2", label: "8 to 14 days", min: 8, max: 14 },
  { id: "a3", label: "15 days or more", min: 15, max: Infinity },
] as const

export const BASIS_LABEL: Record<Basis, string> = { expected: "Expected now", median: "Peer median", all: "All required" }

const fmt = (n: number) => n.toLocaleString("en-US")
export const plural = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`
const pctOf = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))
const DAY = 86_400_000

/** The phrase that names the basis in the hero sentence. */
export function basisPhrase(basis: Basis): string {
  return basis === "expected" ? "behind the term clock" : basis === "median" ? "below the scope median" : `short of all required ${skillNounPlural()}`
}
/** Short condition label for a chip ("Behind the term clock"). */
export const conditionLabel = (basis: Basis): string => basisPhrase(basis).replace(/^./, (c) => c.toUpperCase())

// ---------------------------------------------------------------------------------------------------------------------
// Term, offerings and options


export interface Option {
  value: string
  label: string
  /** Courses only: clinical or didactic (the scope bar lists clinical courses unless didactic is included). */
  kind?: "clinical" | "didactic"
}

export interface ScopeOptions {
  terms: Option[]
  /** The current term's name: a chosen term equal to it is the default, not an applied filter (scope bar, D-L8b). */
  currentTerm?: string
  /** Cohort names (value and label are the same). */
  cohorts: string[]
  groups: Option[]
  courses: Option[]
  categories: Option[]
  tags: Option[]
  locations: Option[]
  settings: Option[]
}

const courseList = (s: V2State) => s.courses ?? [s.course, ...(s.otherCourses ?? [])]


export function scopeOptions(s: V2State, scope: LabScope, today: string = DEMO_TODAY): ScopeOptions {
  const term = resolveTerm(s, scope, today)
  const offered = new Set((s.offerings ?? []).filter((o) => o.termId === term.id).map((o) => o.courseId))
  const skills = s.skills.filter((k) => k.configured && k.published)
  return {
    terms: (s.terms ?? []).map((t) => ({ value: t.name, label: t.name })),
    currentTerm: (s.terms ?? []).find((t) => t.current)?.name,
    cohorts: cohortsOf(s),
    // Group is its own filter (REQ line 303, CALL 10-26): program groups of every cohort, tracks and custom groups, no cohort needed.
    groups: groupOptions(s).map((g) => ({ value: g.value, label: g.label })),
    // Every offered course with its type; the scope bar shows clinical ones unless the scope includes didactic (CALL 10-26).
    courses: courseList(s).filter((c) => offered.has(c.id)).map((c) => ({ value: c.id, label: `${c.code} ${c.name}`, kind: c.kind ?? "clinical" })).sort((a, b) => a.label.localeCompare(b.label)),
    categories: [...new Set(skills.map((k) => k.category))].sort().map((c) => ({ value: c, label: c })),
    tags: [...new Set(skills.flatMap((k) => k.tags ?? []))].sort().map((t) => ({ value: t, label: t })),
    locations: locationsOf(s).map((l) => ({ value: l, label: l })),
    settings: (Object.keys(SETTING_LABEL) as Setting[]).map((k) => ({ value: k, label: SETTING_LABEL[k] })),
  }
}

/** The words a chip shows for one applied field. */
export function chipValue(s: V2State, key: ScopeKey, value: string): string {
  if (key === "course") {
    const c = courseList(s).find((x) => x.id === value)
    return c ? `${c.code} ${c.name}` : value
  }
  if (key === "setting") return SETTING_LABEL[value as Setting] ?? value
  if (key === "group") return groupValueLabel(s, value)
  return value
}


// ---------------------------------------------------------------------------------------------------------------------
// Diagnose: blocking skills, sites, sections, split lanes

export interface BlockerRow {
  skillId: string
  name: string
  category: string
  /** Students short in this skill among those the basis flags (or every student in scope under All required). */
  students: number
  /** Students it is required for in scope. */
  of: number
}

/** How many students in scope each required skill applies to. */
function requiredCounts(rows: StudentRow[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of rows) for (const id of r.requiredIds) out.set(id, (out.get(id) ?? 0) + 1)
  return out
}

/**
 * Which required skill blocks the most flagged students (06 "Blocking skill"). Counted among the students the basis flags, so
 * the hero can say "9 of them are short in X" and the drill list (flagged and short in X) has the same length. Under All
 * required every short student is flagged, so it counts every student short in the skill. "Expected now per skill" is not
 * defined anywhere yet (PENDING-ROMIT), so a skill is not weighted by when it is expected.
 */
export function blockingSkills(pop: Population): BlockerRow[] {
  const short = new Map<string, number>()
  const meta = new Map<string, { name: string; category: string }>()
  for (const r of pop.rows) {
    if (!r.behind) continue
    for (const o of r.open) {
      short.set(o.skillId, (short.get(o.skillId) ?? 0) + 1)
      meta.set(o.skillId, { name: o.name, category: o.category })
    }
  }
  const requiredFor = requiredCounts(pop.rows)
  return [...short]
    .map(([skillId, students]) => ({ skillId, students, of: requiredFor.get(skillId) ?? students, ...meta.get(skillId)! }))
    .sort((a, b) => b.students - a.students || a.name.localeCompare(b.name))
}

/** The section (skill category) most flagged students are short in: the cause the hero names ("9 of them are short in IV therapy"). */
export function blockingSection(pop: Population): { section: string; students: number } | null {
  const by = new Map<string, number>()
  for (const r of pop.rows) {
    if (!r.behind) continue
    for (const sec of new Set(r.open.map((o) => o.category))) by.set(sec, (by.get(sec) ?? 0) + 1)
  }
  const top = [...by].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  return top ? { section: top[0], students: top[1] } : null
}

export interface SiteRow {
  siteId: string
  name: string
  buckets: number[]
  total: number
  oldest: number
}

export const ageBucket = (days: number): number => AGE_BUCKETS.findIndex((b) => days >= b.min && days <= b.max)


export const siteName = (s: V2State, siteId: string): string => {
  const site = s.sites?.find((x) => x.id === siteId)
  return site ? `${site.facility}, ${site.unit}` : "Unknown site"
}

/**
 * RP-08 "Filtering by location or setting must count only the evidence gathered there and recalculate progress accordingly."
 * Under a location or setting filter, a request waiting with an evaluator counts only when its site is at that location and in
 * that setting (the program location's setting). A request with no site recorded cannot be placed, so it drops out. Every
 * dashboard figure, drill and the operations view read requests through this one function, so they agree under any scope.
 */
export interface SiteAging {
  top: SiteRow[]
  other: { sites: number; requests: number; old: number }
  /** Open requests with no site recorded; not drawn (partial). */
  noSite: number
  sites: number
  requests: number
  old: number
}

export function siteAging(s: V2State, open: Submission[], topN = 5): SiteAging {
  const by = new Map<string, SiteRow>()
  let noSite = 0
  for (const x of open) {
    if (!x.siteId) { noSite++; continue }
    const row = by.get(x.siteId) ?? { siteId: x.siteId, name: siteName(s, x.siteId), buckets: [0, 0, 0, 0], total: 0, oldest: 0 }
    row.buckets[ageBucket(x.daysWaiting)]++
    row.total++
    row.oldest = Math.max(row.oldest, x.daysWaiting)
    by.set(x.siteId, row)
  }
  const all = [...by.values()].sort((a, b) => b.buckets[3] - a.buckets[3] || b.oldest - a.oldest || b.total - a.total || a.name.localeCompare(b.name))
  const top = all.slice(0, topN)
  const rest = all.slice(topN)
  return {
    top,
    other: { sites: rest.length, requests: rest.reduce((n, r) => n + r.total, 0), old: rest.reduce((n, r) => n + r.buckets[3], 0) },
    noSite,
    sites: all.length,
    requests: open.length,
    old: open.filter((x) => x.daysWaiting >= 15).length,
  }
}

export type Split = "none" | "cohort" | "group"

export interface Lane {
  id: string
  label: string
  rows: StudentRow[]
}

const laneKey = (r: StudentRow, split: Split) => (split === "cohort" ? r.cohort : split === "group" ? `${r.cohort}, ${r.group ?? "No group"}` : "all")

/** Lanes for the split toggle. Subgroups under SMALL_NUMBERS students are hidden and named (06 Split by). */
export function lanes(rows: StudentRow[], split: Split): { lanes: Lane[]; hidden: Array<{ label: string; n: number }> } {
  if (split === "none") return { lanes: [{ id: "all", label: "All students in scope", rows }], hidden: [] }
  const by = new Map<string, StudentRow[]>()
  for (const r of rows) by.set(laneKey(r, split), [...(by.get(laneKey(r, split)) ?? []), r])
  const all = [...by].sort((a, b) => a[0].localeCompare(b[0]))
  return {
    lanes: all.filter(([, v]) => v.length >= SMALL_NUMBERS).map(([k, v]) => ({ id: k, label: k, rows: v })),
    hidden: all.filter(([, v]) => v.length < SMALL_NUMBERS).map(([k, v]) => ({ label: k, n: v.length })),
  }
}

export interface SectionCell {
  colId: string
  pct: number | null
  expected: number | null
  n: number
  /** Points under expected, when 8 or more. */
  short: number
}

export interface SectionRow {
  section: string
  skills: number
  cells: SectionCell[]
  /** Largest shortfall across the row's cells, for ordering. */
  worst: number
}

export interface SectionMatrix {
  columns: Array<{ id: string; label: string; n: number; cohort?: string; group?: string }>
  rows: SectionRow[]
  hidden: Array<{ label: string; n: number }>
}

/** Sections (skill categories) x scope (06 section 5.2). Cells hold the share of required evaluations counted and its basis. */
export function sectionMatrix(pop: Population, split: Split): SectionMatrix {
  const { lanes: ls, hidden } = lanes(pop.rows, split)
  const cols = split === "none" ? [{ id: "all", label: `Scope (${pop.rows.length})`, n: pop.rows.length }] : ls.map((l) => ({ id: l.id, label: `${l.label} (${l.rows.length})`, n: l.rows.length, cohort: l.rows[0]?.cohort, group: split === "group" ? (l.rows[0]?.group ?? undefined) : undefined }))
  const laneRows = new Map(ls.map((l) => [l.id, l.rows]))
  const sections = [...new Set(pop.rows.flatMap((r) => Object.keys(r.bySection)))].sort()
  const tally = (rows: StudentRow[], sec: string) => rows.reduce((t, r) => { const x = r.bySection[sec]; if (x) { t.needed += x.needed; t.collected += x.collected; t.n += 1; t.total = Math.max(t.total, x.total) } return t }, { needed: 0, collected: 0, n: 0, total: 0 })
  const expectedPts = Math.round(pop.term.share * 100)
  const rows: SectionRow[] = sections.map((sec) => {
    const scopeT = tally(pop.rows, sec)
    const scopePct = scopeT.needed ? pctOf(scopeT.collected, scopeT.needed) : null
    const cells = cols.map((c): SectionCell => {
      const t = tally(c.id === "all" ? pop.rows : (laneRows.get(c.id) ?? []), sec)
      const pct = t.needed ? pctOf(t.collected, t.needed) : null
      const expected = pct === null ? null : pop.basis === "expected" ? expectedPts : pop.basis === "median" ? scopePct : 100
      const gap = pct !== null && expected !== null ? expected - pct : 0
      return { colId: c.id, pct, expected, n: t.n, short: gap >= CELL_MARGIN ? gap : 0 }
    })
    return { section: sec, skills: scopeT.total, cells, worst: Math.max(0, ...cells.map((c) => (c.pct !== null && c.expected !== null ? c.expected - c.pct : 0))) }
  })
  rows.sort((a, b) => b.worst - a.worst || a.section.localeCompare(b.section))
  return { columns: cols, rows, hidden }
}

// ---------------------------------------------------------------------------------------------------------------------
// The dashboard model

export interface NeedsYouRow {
  key: string
  text: string
  href: string
  tone: "attention" | "neutral"
  /** Days, for ordering oldest first. */
  age: number
}

export interface DashboardKpi {
  id: string
  label: string
  value: string | number
  description: string
  href: string
  polarity: "higher_is_better" | "lower_is_better" | "informational"
  /**
   * Mini chart beside the figure, only where it can be read from records (never invented). Achieved: weekly history, oldest
   * first, ending on this figure. Waiting and approval: how the figure splits by age, youngest first.
   */
  chart?: { kind: "sparkline" | "bars"; series: Array<{ value: number; label: string }> }
}

const SERIES_WEEKS = 8

/** The cut-off date of each of the last SERIES_WEEKS weeks, oldest first; the last is today. */
export function weekCutoffs(today: string, weeks = SERIES_WEEKS): string[] {
  const t = Date.parse(`${today}T00:00:00Z`)
  return Array.from({ length: weeks }, (_, i) => new Date(t - (weeks - 1 - i) * 7 * DAY).toISOString().slice(0, 10))
}

const weekLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

/**
 * Achieved history read from dated evaluations only: the share of required student-skill records achieved, counting only
 * evaluations dated on or before each cut-off. The last point is computed exactly like the KPI value, so the line ends on the
 * figure it sits beside. Request history is not drawn: the records do not date every past request, so a line would mislead.
 */
export function achievedSeries(state: V2State, scope: LabScope, today: string = DEMO_TODAY): Array<{ value: number; label: string }> {
  const cuts = weekCutoffs(today)
  const achieved = cuts.map((c, i) => {
    const st = i === cuts.length - 1 ? state : { ...state, evaluations: state.evaluations.filter((e) => e.date.slice(0, 10) <= c) }
    const rows = populationRows(st, scope, today).rows
    const req = rows.reduce((t, r) => t + r.required, 0)
    return { value: pctOf(rows.reduce((t, r) => t + r.achieved, 0), req), label: `Week of ${weekLabel(c)}` }
  })
  return achieved
}

/**
 * Students the basis flagged at each of the last 8 weekly cut-offs, oldest first. Each point reruns the one `populationRows`
 * calculation on the evaluations dated on or before that day, with that day as "today" (so the term clock reads the share of
 * the term gone then). The last point is the live population, so the line ends on the figure it sits beside.
 */
export function behindSeries(state: V2State, scope: LabScope, today: string = DEMO_TODAY): Array<{ value: number; label: string }> {
  const cuts = weekCutoffs(today)
  return cuts.map((c, i) => {
    const last = i === cuts.length - 1
    const st = last ? state : { ...state, evaluations: state.evaluations.filter((e) => e.date.slice(0, 10) <= c) }
    const rows = populationRows(st, scope, last ? today : c).rows
    return { value: rows.filter((r) => r.behind).length, label: `Week of ${weekLabel(c)}` }
  })
}

/**
 * Evaluations counted per week for the students in scope, read from evaluation dates only (the evidence flow). Location and
 * setting recount first, through the population's evidence state. Oldest week first; each week ends on its cut-off.
 */
export function countedPerWeek(pop: Population, today: string = DEMO_TODAY, weeks = 12): Array<{ value: number; label: string; end: string }> {
  const cuts = weekCutoffs(today, weeks)
  const dates = pop.evidenceState.evaluations.filter((e) => e.status === "counted" && pop.ids.has(e.studentId)).map((e) => e.date.slice(0, 10))
  return cuts.map((c) => {
    const start = new Date(Date.parse(`${c}T00:00:00Z`) - 7 * DAY).toISOString().slice(0, 10)
    return { value: dates.filter((d) => d > start && d <= c).length, label: `Week to ${weekLabel(c)}`, end: c }
  })
}

/**
 * Counted evaluations of the students in scope, by setting (clinical, lab, simulation), read from the same evidence state as
 * countedPerWeek. Lab and simulation evidence never satisfies a clinical-setting minimum (REQ SC-12), so the split matters.
 */
export function countedBySetting(pop: Population): Array<{ setting: Setting; label: string; value: number }> {
  const counted = pop.evidenceState.evaluations.filter((e) => e.status === "counted" && pop.ids.has(e.studentId))
  return (Object.keys(SETTING_LABEL) as Setting[]).map((k) => ({ setting: k, label: SETTING_LABEL[k], value: counted.filter((e) => e.setting === k).length }))
}

export interface SectionGap {
  section: string
  pct: number
  expected: number
  /** Points under the basis (negative when ahead). */
  gap: number
}

/** Sections (skill categories) of the scope, ordered by how far they sit under the basis (the "Sections furthest behind" tile). */
export function sectionGaps(pop: Population): SectionGap[] {
  const mx = sectionMatrix(pop, "none")
  const out: SectionGap[] = []
  for (const r of mx.rows) {
    const c = r.cells[0]
    if (!c || c.pct === null || c.expected === null) continue
    out.push({ section: r.section, pct: c.pct, expected: c.expected, gap: c.expected - c.pct })
  }
  return out.sort((a, b) => b.gap - a.gap || a.pct - b.pct || a.section.localeCompare(b.section))
}

// ---------------------------------------------------------------------------------------------------------------------
// Exceptions (variant B): five lists of records that need someone. Each tab count is its list length, by construction.

export type ExceptionKind = "behind" | "old" | "approval" | "returned" | "unverified"
export const EXCEPTION_KINDS: ExceptionKind[] = ["behind", "old", "approval", "returned", "unverified"]

export interface ExceptionStudent {
  kind: "student"
  id: string
  row: StudentRow
  /** Section with the most required skills not yet achieved, as "achieved of required" in that section. */
  shortIn: { section: string; achieved: number; total: number } | null
  /** The oldest open request for the student, if any. */
  request: { evaluator: string; site: string; days: number } | null
}

export interface ExceptionRequest {
  kind: "request"
  id: string
  studentId: string
  student: string
  skills: string
  evaluator: string
  evaluatorUnverified: boolean
  site: string
  days: number
  /** Why it is on the list, in words. */
  why: string
}

export interface ExceptionEvaluator {
  kind: "evaluator"
  id: string
  name: string
  site: string
  requests: number
  students: number
  oldest: number
}

export interface Exceptions {
  behind: ExceptionStudent[]
  old: ExceptionRequest[]
  approval: ExceptionRequest[]
  returned: ExceptionRequest[]
  unverified: ExceptionEvaluator[]
}

/**
 * The five exception lists for one scope. Students behind come from the single `populationRows` behind flag (same as the
 * hero and the drill); requests waiting 15 days or more and awaiting approval come from the same selectors the dashboard
 * figures use (`openRequests`, `queueItems`), so each tab count equals the drill list behind it.
 */
export function buildExceptions(state: V2State, model: DashboardModel, today: string = DEMO_TODAY): Exceptions {
  const pop = model.pop
  const person = (id: string | null | undefined) => (id ? state.people.find((x) => x.id === id) : undefined)
  const nameOf = (id: string | null | undefined) => person(id)?.name ?? "Not named yet"
  const unverified = (id: string | null | undefined) => person(id)?.verified === false
  const skills = (ids: string[]) => ids.map((id) => skillById(state, id)?.name ?? id).join(", ")
  const site = (id?: string) => (id ? siteName(state, id) : "No site recorded")
  const open = openRequestsIn(state, pop.ids, model.scope)
  const oldestOpen = new Map<string, Submission>()
  for (const x of open) if (!oldestOpen.has(x.studentId)) oldestOpen.set(x.studentId, x)

  const behind: ExceptionStudent[] = model.behind.map((r) => {
    // The section with the most evaluations still missing (needed minus counted), shown as skills achieved of required there.
    let shortIn: ExceptionStudent["shortIn"] = null
    let worst = 0
    for (const [section, t] of Object.entries(r.bySection).sort((a, b) => a[0].localeCompare(b[0]))) {
      const missing = t.needed - t.collected
      if (t.achieved >= t.total || missing <= worst) continue
      worst = missing
      shortIn = { section, achieved: t.achieved, total: t.total }
    }
    const q = oldestOpen.get(r.id)
    const evaluatorId = q ? (q.candidateIds?.[0] ?? q.assignedToId) : null
    return { kind: "student", id: r.id, row: r, shortIn, request: q ? { evaluator: nameOf(evaluatorId), site: site(q.siteId), days: q.daysWaiting } : null }
  })

  const toRequest = (x: Submission, days: number, why: string): ExceptionRequest => {
    const ev = x.candidateIds?.[0] ?? x.assignedToId
    return { kind: "request", id: x.id, studentId: x.studentId, student: nameOf(x.studentId), skills: skills(x.skillIds), evaluator: nameOf(ev), evaluatorUnverified: unverified(ev), site: site(x.siteId), days, why }
  }
  const old = open.filter((x) => x.daysWaiting >= 15).map((x) => toRequest(x, x.daysWaiting, x.status === "stalled" ? `No answer in ${x.daysWaiting} days, after a reminder` : `No answer in ${x.daysWaiting} days`))

  const approval: ExceptionRequest[] = approvalsIn(state, model.scope, today)
    .map((i) => ({ kind: "request" as const, id: i.key, studentId: i.studentId, student: nameOf(i.studentId), skills: skills(i.skillIds), evaluator: i.evaluatorId ? nameOf(i.evaluatorId) : "Not named yet", evaluatorUnverified: unverified(i.evaluatorId), site: site(i.item.submission?.siteId), days: i.days, why: CAUSE_LABEL[i.cause] }))
    .sort((a, b) => b.days - a.days || a.id.localeCompare(b.id))

  const returned: ExceptionRequest[] = state.submissions
    .filter((x) => x.status === "returned" && pop.ids.has(x.studentId))
    .map((x) => {
      const last = x.returns?.at(-1)
      const days = last ? daysSince(last.at, today) : x.daysWaiting
      const by = last ? nameOf(last.byId) : "A reviewer"
      return toRequest(x, days, last?.reason ? `Sent back by ${by}: ${last.reason}` : `Sent back by ${by}`)
    })
    .sort((a, b) => b.days - a.days || a.id.localeCompare(b.id))

  const held = new Map<string, Submission[]>()
  for (const x of open) {
    const ids = new Set([x.assignedToId, ...(x.candidateIds ?? [])])
    for (const id of ids) if (unverified(id)) held.set(id, [...(held.get(id) ?? []), x])
  }
  const unverifiedRows: ExceptionEvaluator[] = [...held]
    .map(([id, list]) => ({ kind: "evaluator" as const, id, name: nameOf(id), site: site(list.find((x) => x.siteId)?.siteId), requests: list.length, students: new Set(list.map((x) => x.studentId)).size, oldest: Math.max(...list.map((x) => x.daysWaiting)) }))
    .sort((a, b) => b.oldest - a.oldest || a.name.localeCompare(b.name))

  return { behind, old, approval, returned, unverified: unverifiedRows }
}

/** Counts by age band, youngest first, labelled for the chart tooltip ("8 to 14 days: 31"). */
export function ageSplit(days: number[], bands: ReadonlyArray<{ label: string; min: number; max: number }>): Array<{ value: number; label: string }> {
  return bands.map((b) => ({ value: days.filter((d) => d >= b.min && d <= b.max).length, label: b.label }))
}

export const APPROVAL_BANDS = [
  { label: "0 to 3 days", min: 0, max: 3 },
  { label: "4 to 7 days", min: 4, max: 7 },
  { label: "8 to 10 days", min: 8, max: 10 },
  { label: "More than 10 days", min: 11, max: Infinity },
] as const

export interface Explained {
  text: string
  /** One Remove action per offending chip. */
  remove: Array<{ key: ScopeKey; label: string }>
}

export interface DashboardModel {
  asOfDate: string
  /** The scope the model was built for (exception lists and drills reuse it). */
  scope: LabScope
  term: TermInfo
  basis: Basis
  /** Caption shown while pace is a prototype assumption. */
  basisCaption: string
  pop: Population
  inScope: number
  total: number
  kind: "behind" | "clear" | "empty" | "impossible"
  heroValue: number
  heroSentence: string
  heroDetail: string
  heroHref: string
  /** Polite announcement after a scope or basis change. */
  announce: string
  kpis: DashboardKpi[]
  behind: StudentRow[]
  blockers: BlockerRow[]
  sites: SiteAging
  needsYou: NeedsYouRow[]
  options: ScopeOptions
  explained: Explained | null
  /** A sentence when the scope selects nobody, so the page explains instead of showing zeros (RP-09). */
  impossible: string | null
  /** Info line when location or setting recounts evidence (06 S6). */
  recount: string | null
  waitingCount: number
  approvals: { evaluations: number; submissions: number; old: number }
  unconfigured: number
}

/** Columns the dashboard export carries, one row per student in scope (the DS ExportDrawer's "Visible columns only" count). */
export const DASHBOARD_EXPORT_COLUMNS = ["Student", "Cohort", "Group", "Required this term", "Achieved", "In progress", "Missing", "Waiting with an evaluator"] as const
/** Columns the operations export carries, one row per waiting evaluation request. */
export const opsExportColumns = (): string[] => ["Student", skillNoun().charAt(0).toUpperCase() + skillNoun().slice(1), "Evaluator", "Site", "Sent", "Days waiting"]

export interface DrillParams {
  list: "students" | "skills" | "sites" | "requests"
  cond?: "behind" | "waiting" | "stalled" | "old" | "approval" | "approval-old"
  skill?: string
  siteId?: string
  /** Where Back lands on the dashboard (an element id). */
  from?: string
}

export const drillHref = (scope: LabScope, p: DrillParams): string => withScope(DRILL_PATH, scope, { list: p.list, cond: p.cond, skill: p.skill, siteId: p.siteId, from: p.from })
export const dashboardHref = (scope: LabScope, extra: Record<string, string | undefined> = {}): string => withScope(`${LAB_BASE}/dashboard`, scope, extra)
/** Link for one student. */
export const studentHref = (scope: LabScope, studentId: string): string => withScope(`/lab/reviewer/student-record`, scope, { student: studentId })

/** Approval queue entries in the dashboard scope: the one queue definition (lib/v2/approvals.ts), same as the badge and the queue. */
export const approvalsIn = (state: V2State, scope: LabScope, today: string = DEMO_TODAY): ApprovalEntry[] => approvalsInScope(state, scope, today).entries

const daysSince = (iso: string, today: string) => Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)) / DAY)

/** RP-09: the sentence and the filters to remove when the scope cannot produce evidence; null when it can. Shared by every reporting screen. */
export function explainScope(s: V2State, scope: LabScope): Explained | null {
  const f = toReportFilters(scope)
  const text = explainFilters({ ...f, course: ALL }, s)
  if (!text) return null
  const fix = conflictFix({ ...f, course: ALL }, s)
  const map: Partial<Record<keyof ReportFilters, ScopeKey>> = { location: "loc", setting: "setting", course: "course", category: "cat", tag: "tag" }
  const keys = (fix?.keys ?? []).map((k) => map[k]).filter((k): k is ScopeKey => !!k)
  const offending: ScopeKey[] = [...new Set<ScopeKey>([...keys, ...(scope.loc ? (["loc"] as ScopeKey[]) : []), ...(scope.setting ? (["setting"] as ScopeKey[]) : [])])]
  return { text, remove: offending.map((k) => ({ key: k, label: `Remove ${k === "loc" ? "location" : k}` })) }
}

/**
 * RP-08: the one sentence that tells the reader the figures count only evidence from the chosen location or setting. Null when
 * neither is applied. Every reporting screen (dashboards, drills, Reports, Export) prints this same line; a caller hides it when
 * the scope is impossible (RP-09), since the banner says so instead.
 */
export const recountText = (scope: Pick<LabScope, "loc" | "setting">): string | null =>
  scope.loc || scope.setting ? `Counting evidence from ${[scope.loc, scope.setting ? `${inSentence(SETTING_LABEL[scope.setting as Setting] ?? scope.setting)} settings` : ""].filter(Boolean).join(", ")} only.` : null

export function buildDashboard(state: V2State, scope: LabScope, today: string = DEMO_TODAY): DashboardModel {
  const pop = populationRows(state, scope, today)
  const { rows, term, basis } = pop
  const total = state.people.filter((p) => p.kind === "student").length
  const behind = rows.filter((r) => r.behind)
  const blockers = blockingSkills(pop)
  const open = openRequestsIn(state, pop.ids, scope)
  const sites = siteAging(state, open)
  const queue = approvalsIn(state, scope, today)
  const queueTotals = approvalTotals(state, queue)
  const oldApprovals = queue.filter((q) => q.days > APPROVAL_OLD_DAYS)
  const stalled = open.filter((x) => x.status === "stalled")
  // One definition of Configured (decision D-X31), the same as the library and lib/v2/facts.ts.
  const configured = state.skills.filter(isConfigured).length
  const unconfigured = state.skills.length - configured
  const unverifiedHolding = new Set(open.filter((x) => x.daysWaiting > 8).flatMap((x) => [x.assignedToId, ...(x.candidateIds ?? [])]).filter((id) => state.people.some((p) => p.id === id && p.verified === false)))
  const unverified = state.people.filter((p) => EVALUATOR_KINDS.includes(p.kind) && p.verified === false).length
  const explained = explainScope(state, scope)

  const kind: DashboardModel["kind"] = explained ? "impossible" : rows.length === 0 ? "empty" : behind.length === 0 ? "clear" : "behind"
  const phrase = basisPhrase(basis)
  const n = rows.length
  const heroSentence =
    kind === "behind"
      ? `${fmt(behind.length)} of ${plural(n, "student", "students")} ${behind.length === 1 ? "is" : "are"} ${phrase}`
      : kind === "clear"
        ? basis === "expected"
          ? `Nobody is behind the term clock. ${plural(n, "student", "students")}, all on pace.`
          : basis === "median"
            ? pop.medianSuppressed
              ? `Too few students in this scope to compare (${n}).`
              : `Nobody is far below the scope median. ${plural(n, "student", "students")} in scope.`
            : `Every student has achieved every required ${skillNoun()}. ${plural(n, "student", "students")}.`
        : "No students in this scope"
  const top = blockingSection(pop)
  const lowest = behind[0]
  const lowestText = lowest ? (basis === "all" ? `Lowest: ${lowest.name}, ${lowest.achieved} of ${lowest.required} achieved.` : `Lowest: ${lowest.name}, ${lowest.pct}% counted.`) : ""
  const heroDetail =
    kind === "behind"
      ? top ? `${fmt(top.students)} of them ${top.students === 1 ? "is" : "are"} short in ${top.section}.` : lowestText
      : kind === "clear"
        ? basis === "expected" ? `Every student has counted what the term clock expects by week ${term.week}.` : basis === "median" ? `Scope median: ${pop.median}% of required evaluations counted.` : "Nothing required is left in this scope."
        : explained ? explained.text : `Nobody in this scope takes a course in ${term.name}.`
  const heroHref = drillHref(scope, { list: "students", cond: "behind", from: "hero" })

  const records = rows.reduce((t, r) => t + r.required, 0)
  const achievedRecords = rows.reduce((t, r) => t + r.achieved, 0)
  const evaluations = queueTotals.evaluations
  const achievedHistory = rows.length > 0 ? achievedSeries(state, scope, today) : null
  const kpis: DashboardKpi[] = [
    { id: "achieved", label: `Required ${skillNounPlural()} achieved`, value: `${pctOf(achievedRecords, records)}%`, description: `${fmt(achievedRecords)} of ${fmt(records)}`, href: drillHref(scope, { list: "skills", from: "kpis" }), polarity: "higher_is_better", ...(achievedHistory ? { chart: { kind: "sparkline" as const, series: achievedHistory } } : {}) },
    { id: "waiting", label: "Waiting with evaluators", value: open.length, description: `${fmt(sites.old)} over 14 days`, href: drillHref(scope, { list: "requests", cond: "waiting", from: "kpis" }), polarity: "lower_is_better", ...(open.length > 0 ? { chart: { kind: "bars" as const, series: ageSplit(open.map((x) => x.daysWaiting), AGE_BUCKETS.map((b) => ({ label: `${b.label}`, min: b.min, max: b.max }))) } } : {}) },
    { id: "approval", label: "Awaiting approval", value: queue.length, description: `${queue.length === 1 ? "submission" : "submissions"}, ${plural(evaluations, "evaluation", "evaluations")} in all`, href: drillHref(scope, { list: "requests", cond: "approval", from: "kpis" }), polarity: "lower_is_better", ...(queue.length > 0 ? { chart: { kind: "bars" as const, series: ageSplit(queue.map((q) => q.days), APPROVAL_BANDS) } } : {}) },
    { id: "setup", label: `${skillNounPlural().replace(/^./, (c) => c.toUpperCase())} configured`, value: configured, description: `of ${fmt(state.skills.length)} in the library`, href: `${LAB_BASE}/skills-library?filter=needs-configuration`, polarity: "higher_is_better" },
  ]

  const needsYou: NeedsYouRow[] = []
  if (stalled.length > 0) needsYou.push({ key: "stalled", text: `${plural(stalled.length, "request", "requests")} stalled with evaluators, longest ${stalled[0].daysWaiting} days`, href: drillHref(scope, { list: "requests", cond: "stalled", from: "needs-you" }), tone: "attention", age: stalled[0].daysWaiting })
  if (oldApprovals.length > 0) needsYou.push({ key: "old", text: `${plural(oldApprovals.length, "submission", "submissions")} awaiting approval for more than ${APPROVAL_OLD_DAYS} days`, href: drillHref(scope, { list: "requests", cond: "approval-old", from: "needs-you" }), tone: "attention", age: Math.max(...oldApprovals.map((q) => q.days)) })
  if (unverifiedHolding.size > 0) needsYou.push({ key: "unverified-holding", text: `${plural(unverifiedHolding.size, "unverified evaluator holds", "unverified evaluators hold")} requests older than 8 days`, href: NEW_EVALUATORS_HREF, tone: "attention", age: 8 })
  else if (unverified > 0) needsYou.push({ key: "unverified", text: `${plural(unverified, "evaluator name", "evaluator names")} to adopt or merge`, href: NEW_EVALUATORS_HREF, tone: "neutral", age: 0 })
  if (unconfigured > 0) needsYou.push({ key: "unconfigured", text: `${countSkills(unconfigured)} need configuring before students can use them`, href: `${LAB_BASE}/skills-library?filter=needs-configuration`, tone: "neutral", age: 0 })
  needsYou.sort((a, b) => b.age - a.age)

  // An impossible scope says so in the banner; "Counting evidence from ..." beside it would contradict it (RP-09).
  const recount = explained ? null : recountText(scope)
  const announce = kind === "behind" ? `${fmt(behind.length)} of ${fmt(n)} students ${phrase}` : heroSentence

  return {
    asOfDate: today,
    scope,
    term,
    basis,
    basisCaption: buildDashboardCaption(pop),
    pop,
    inScope: n,
    total,
    kind,
    heroValue: behind.length,
    heroSentence,
    heroDetail,
    heroHref,
    announce,
    kpis,
    behind,
    blockers,
    sites,
    needsYou: needsYou.slice(0, 5),
    options: scopeOptions(state, scope, today),
    explained,
    impossible: explained ? explained.text : kind === "empty" ? "No students match this scope. Remove a filter to see people again." : null,
    recount,
    waitingCount: open.length,
    approvals: { evaluations, submissions: queue.length, old: oldApprovals.length },
    unconfigured,
  }
}

/** Remove the offending fields of an explained combination. */
export const removeKeys = (scope: LabScope, keys: ScopeKey[]): LabScope => keys.reduce((s, k) => removeScope(s, k), scope)

// ---------------------------------------------------------------------------------------------------------------------
// Demo states (?state=)

export type DemoState = "loading" | "empty" | "clear" | "error" | "partial" | "stale"
export const DEMO_STATES: DemoState[] = ["loading", "empty", "clear", "error", "partial", "stale"]
export const parseDemoState = (v: string | null | undefined): DemoState | null => (DEMO_STATES.includes(v as DemoState) ? (v as DemoState) : null)

/** Force the calm all-clear view for design review (?state=clear): every student on pace, charts still drawn. */
export function withClearState(m: DashboardModel): DashboardModel {
  const rows = m.pop.rows.map((r) => ({ ...r, behind: false, behindBy: 0, gap: m.basis === "all" ? 100 : Math.max(r.gap, 0) }))
  const n = rows.length
  return {
    ...m,
    kind: "clear",
    pop: { ...m.pop, rows },
    behind: [],
    blockers: [],
    heroValue: 0,
    heroSentence: m.basis === "expected" ? `Nobody is behind the term clock. ${plural(n, "student", "students")}, all on pace.` : m.basis === "median" ? `Nobody is far below the scope median. ${plural(n, "student", "students")} in scope.` : `Every student has achieved every required ${skillNoun()}. ${plural(n, "student", "students")}.`,
    heroDetail: m.basis === "expected" ? `Every student has counted what the term clock expects by week ${m.term.week}.` : "Nothing in this scope needs attention.",
    announce: "Nobody is behind",
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Drill lists (06 R1, R2): the rows behind a figure, same scope, same basis, so the count equals the figure.

export interface DrillStudent extends StudentRow {
  /** For a skill drill: where the student stands on that skill. */
  skillState?: string
}

export interface DrillSkill {
  skillId: string
  name: string
  category: string
  students: number
  achieved: number
  short: number
}

export interface DrillRequest {
  id: string
  studentId: string
  student: string
  skills: string
  evaluator: string
  site: string
  days: number
  status: string
}

export interface DrillModel {
  title: string
  crumb: string
  count: number
  condition: { label: string; remove: Record<string, string | undefined> } | null
  students?: DrillStudent[]
  skills?: DrillSkill[]
  sites?: SiteRow[]
  requests?: DrillRequest[]
  basisCaption: string
  term: TermInfo
}

export function buildDrill(state: V2State, scope: LabScope, p: DrillParams, today: string = DEMO_TODAY): DrillModel {
  const pop = populationRows(state, scope, today)
  const basis = pop.basis
  const base = { basisCaption: buildDashboardCaption(pop), term: pop.term }
  const person = (id: string) => state.people.find((x) => x.id === id)?.name ?? "Unknown person"
  const skillName = (id: string) => skillById(state, id)?.name ?? id

  if (p.list === "students") {
    let list: DrillStudent[] = pop.rows
    const parts: string[] = []
    if (p.cond === "behind") list = list.filter((r) => r.behind)
    if (p.skill) {
      list = list.filter((r) => r.open.some((o) => o.skillId === p.skill)).map((r) => {
        const o = r.open.find((x) => x.skillId === p.skill)!
        return { ...r, skillState: `${o.counted} of ${o.need} counted` }
      })
      parts.push(`short in ${skillName(p.skill)}`)
    }
    const condLabel = [p.cond === "behind" ? conditionLabel(basis) : "", p.skill ? `Short in ${skillName(p.skill)}` : ""].filter(Boolean).join(", ")
    const title = `${plural(list.length, "student", "students")}${p.cond === "behind" ? ` ${basisPhrase(basis)}` : " in scope"}${p.skill ? `, ${parts[0]}` : ""}`
    return { ...base, title, crumb: `${p.cond === "behind" ? "Students behind" : "Students"} (${fmt(list.length)})`, count: list.length, condition: condLabel ? { label: condLabel, remove: { cond: undefined, skill: undefined } } : null, students: list }
  }

  if (p.list === "skills") {
    const by = new Map<string, DrillSkill>()
    for (const r of pop.rows) {
      const openIds = new Set(r.open.map((o) => o.skillId))
      for (const id of r.requiredIds) {
        const k = skillById(state, id)
        const d = by.get(id) ?? { skillId: id, name: k?.name ?? id, category: k?.category ?? "", students: 0, achieved: 0, short: 0 }
        d.students++
        if (openIds.has(id)) d.short++
        else d.achieved++
        by.set(id, d)
      }
    }
    const list = [...by.values()].sort((a, b) => b.short - a.short || a.name.localeCompare(b.name))
    const achieved = list.reduce((t, x) => t + x.achieved, 0)
    const records = list.reduce((t, x) => t + x.students, 0)
    return { ...base, title: `Required ${skillNounPlural()} in scope: ${fmt(achieved)} of ${fmt(records)} achieved`, crumb: `Required ${skillNounPlural()} (${fmt(list.length)})`, count: list.length, condition: null, skills: list }
  }

  const open = openRequestsIn(state, pop.ids, scope)
  if (p.list === "sites") {
    const all = siteAging(state, open, Number.MAX_SAFE_INTEGER)
    return { ...base, title: `${plural(all.sites, "site", "sites")} with requests waiting`, crumb: `Sites (${fmt(all.sites)})`, count: all.sites, condition: { label: "Requests waiting", remove: { list: "students", cond: undefined } }, sites: all.top }
  }

  // Requests.
  const toRow = (x: Submission, status: string, days: number): DrillRequest => ({ id: x.id, studentId: x.studentId, student: person(x.studentId), skills: x.skillIds.map(skillName).join(", "), evaluator: person(x.candidateIds?.[0] ?? x.assignedToId), site: x.siteId ? siteName(state, x.siteId) : "No site recorded", days, status })
  if (p.cond === "approval" || p.cond === "approval-old") {
    let q = approvalsIn(state, scope, today)
    if (p.cond === "approval-old") q = q.filter((i) => i.days > APPROVAL_OLD_DAYS)
    const rows = q.map((i) => ({ id: i.key, studentId: i.studentId, student: person(i.studentId), skills: i.skillIds.map(skillName).join(", "), evaluator: i.evaluatorId ? person(i.evaluatorId) : "Not named yet", site: i.item.submission?.siteId ? siteName(state, i.item.submission.siteId) : "No site recorded", days: i.days, status: i.evaluations.length ? plural(i.evaluations.length, "evaluation", "evaluations") : "Outcome to enter" }))
    const label = p.cond === "approval-old" ? `Awaiting approval more than ${APPROVAL_OLD_DAYS} days` : "Awaiting approval"
    return { ...base, title: `${plural(rows.length, "submission", "submissions")} awaiting approval${p.cond === "approval-old" ? ` for more than ${APPROVAL_OLD_DAYS} days` : ""}`, crumb: `Awaiting approval (${fmt(rows.length)})`, count: rows.length, condition: { label, remove: { cond: "waiting" } }, requests: rows }
  }
  let list = open
  const labels: string[] = []
  if (p.cond === "stalled") { list = list.filter((x) => x.status === "stalled"); labels.push("No answer after a reminder") }
  if (p.cond === "old") { list = list.filter((x) => x.daysWaiting >= 15); labels.push("15 days or more") }
  if (p.siteId) { list = list.filter((x) => x.siteId === p.siteId); labels.push(`Site: ${siteName(state, p.siteId)}`) }
  const rows = list.map((x) => toRow(x, x.status === "stalled" ? "No answer after a reminder" : "With evaluator", x.daysWaiting))
  return {
    ...base,
    title: `${plural(rows.length, "request", "requests")} waiting with evaluators${p.cond === "stalled" ? ", stalled" : p.cond === "old" ? ", 15 days or more" : ""}${p.siteId ? ` at ${siteName(state, p.siteId)}` : ""}`,
    crumb: `Requests waiting (${fmt(rows.length)})`,
    count: rows.length,
    condition: labels.length ? { label: labels.join(", "), remove: { cond: "waiting", siteId: undefined } } : null,
    requests: rows,
  }
}

function buildDashboardCaption(pop: Population): string {
  return pop.basis === "expected" ? `Expected now is the share of the term gone: ${Math.round(pop.term.share * 100)}% in week ${pop.term.week} of ${pop.term.weeks}.` : pop.basis === "median" ? `Behind means ${MEDIAN_MARGIN} or more points under the scope median (${pop.median}%).` : `Behind means at least one required ${skillNoun()} not yet achieved.`
}

// =====================================================================================================================
// Concept C, journey pipeline (dashboard-concepts README section 4 C). Appended, read-only over the functions above.
//
// The unit is a required skill record: one student in scope and one skill required for them (the same `requiredIds` that
// `populationRows` builds). Its state is read from the one engine selector, `skillProgress`, on the population's evidence
// state, so location and setting recount first and pending never counts. Four engine states only [REQ AE-04; LEDGER D-L1]:
// achieved, in progress (some qualifying evidence, rule not met), evidence does not qualify (evidence exists, none
// qualifies; OD-03 open on merging it with "no evidence yet"), no evidence yet. Waiting is an overlay: the record has an
// open request with an evaluator. It never moves a record between states.

export type RecordState = "achieved" | "progress" | "unqualified" | "none"
/** Bar and column order: achieved first, so the expected-now tick reads from the left edge. */
export const RECORD_STATES: RecordState[] = ["achieved", "progress", "unqualified", "none"]
export const RECORD_STATE_LABEL: Record<RecordState, string> = { achieved: RECORD_STATE_META.achieved.label, progress: RECORD_STATE_META.progress.label, unqualified: RECORD_STATE_META.unqualified.label, none: RECORD_STATE_META.none.label }
export const isRecordState = (v: string | null | undefined): v is RecordState => RECORD_STATES.includes(v as RecordState)

/** The engine state of one record, from `skillProgress` (counted evaluations only). */
export function recordStateOf(pr: ReturnType<typeof skillProgress>): RecordState {
  if (!pr) return "none"
  if (pr.achieved) return "achieved"
  if (pr.counted > 0) return "progress"
  if (pr.notMet > 0 || Object.keys(pr.leftOut).length > 0) return "unqualified"
  return "none"
}

export interface PipelineRecord {
  key: string
  studentId: string
  student: string
  cohort: string
  skillId: string
  skill: string
  section: string
  state: RecordState
  counted: number
  need: number
  /** Open request with an evaluator for this record (the overlay), oldest first. */
  waitingWith: string | null
  waitingDays: number | null
}

export interface PipelineSection {
  section: string
  total: number
  counts: Record<RecordState, number>
  /** Records of each state with an open request (hatched part of the segment). */
  waiting: Record<RecordState, number>
  achievedPct: number
  /** Points under the tick when CELL_MARGIN or more, else 0. */
  short: number
}

export interface PipelineStage {
  state: RecordState
  label: string
  count: number
  pct: number
  waiting: number
  /** Count in this state at each of the last 8 weekly cut-offs, oldest first; the last point is the figure. */
  series: Array<{ value: number; label: string }>
  /** Change since the previous cut-off, 7 days ago. */
  delta: number
}

export interface PipelineModel {
  students: number
  total: number
  waiting: number
  stages: PipelineStage[]
  all: PipelineSection
  sections: PipelineSection[]
  tick: { pct: number; label: string } | null
  /** "Oct 19": the cut-off the movement is measured from. */
  since: string
  records: PipelineRecord[]
}

const zeroStates = (): Record<RecordState, number> => ({ achieved: 0, progress: 0, unqualified: 0, none: 0 })

/** State counts for a population, without building records (used for the weekly history). */
function pipelineCounts(pop: Population): Record<RecordState, number> {
  const out = zeroStates()
  for (const r of pop.rows) for (const id of r.requiredIds) out[recordStateOf(skillProgress(pop.evidenceState, r.id, id))]++
  return out
}

/** Every required skill record in scope with its state and waiting overlay. */
export function pipelineRecords(state: V2State, pop: Population): PipelineRecord[] {
  const waits = new Map<string, Submission>()
  for (const x of openRequests(state, pop.ids)) for (const k of x.skillIds) if (!waits.has(`${x.studentId}|${k}`)) waits.set(`${x.studentId}|${k}`, x)
  const names = new Map(state.people.map((p) => [p.id, p.name]))
  const out: PipelineRecord[] = []
  for (const r of pop.rows) {
    for (const id of r.requiredIds) {
      const pr = skillProgress(pop.evidenceState, r.id, id)
      const k = skillById(state, id)
      const w = waits.get(`${r.id}|${id}`)
      out.push({ key: `${r.id}|${id}`, studentId: r.id, student: r.name, cohort: r.cohort, skillId: id, skill: k?.name ?? id, section: k?.category ?? "", state: recordStateOf(pr), counted: Math.min(pr?.counted ?? 0, pr?.need ?? 0), need: pr?.need ?? 0, waitingWith: w ? (names.get(w.assignedToId) ?? "Unknown evaluator") : null, waitingDays: w ? w.daysWaiting : null })
    }
  }
  return out
}

function tallySection(section: string, recs: PipelineRecord[]): PipelineSection {
  const counts = zeroStates()
  const waiting = zeroStates()
  for (const x of recs) {
    counts[x.state]++
    if (x.waitingWith) waiting[x.state]++
  }
  return { section, total: recs.length, counts, waiting, achievedPct: pctOf(counts.achieved, recs.length), short: 0 }
}

export function pipelineModel(state: V2State, scope: LabScope, today: string = DEMO_TODAY): PipelineModel {
  const pop = populationRows(state, scope, today)
  const records = pipelineRecords(state, pop)
  const all = tallySection("All sections", records)
  const bySection = new Map<string, PipelineRecord[]>()
  for (const x of records) bySection.set(x.section, [...(bySection.get(x.section) ?? []), x])
  const sections = [...bySection].map(([sec, recs]) => tallySection(sec, recs)).sort((a, b) => a.section.localeCompare(b.section))
  const tick =
    records.length === 0 ? null : pop.basis === "expected" ? { pct: Math.round(pop.term.share * 100), label: "Expected now" } : pop.basis === "median" ? { pct: median(sections.map((x) => x.achievedPct)), label: "Section median" } : null
  for (const x of [all, ...sections]) {
    const gap = tick ? tick.pct - x.achievedPct : 0
    x.short = gap >= CELL_MARGIN ? gap : 0
  }
  const cuts = weekCutoffs(today)
  const history = cuts.map((c, i) => (i === cuts.length - 1 ? all.counts : pipelineCounts(populationRows({ ...state, evaluations: state.evaluations.filter((e) => e.date.slice(0, 10) <= c) }, scope, today))))
  const stages: PipelineStage[] = RECORD_STATES.map((st) => {
    const series = history.map((h, i) => ({ value: h[st], label: `Week of ${weekLabel(cuts[i])}` }))
    return { state: st, label: RECORD_STATE_LABEL[st], count: all.counts[st], pct: pctOf(all.counts[st], all.total), waiting: all.waiting[st], series, delta: series.length > 1 ? series[series.length - 1].value - series[series.length - 2].value : 0 }
  })
  return { students: pop.rows.length, total: all.total, waiting: records.filter((x) => x.waitingWith).length, stages, all, sections, tick, since: weekLabel(cuts[cuts.length - 2] ?? today), records }
}

export interface PipelineDrillParams {
  state?: RecordState | null
  section?: string | null
}

/** The records behind a stage or segment: same scope, so the length equals the figure that links here. */
export function pipelineDrill(m: PipelineModel, p: PipelineDrillParams): { title: string; rows: PipelineRecord[] } {
  const rows = m.records.filter((x) => (!p.state || x.state === p.state) && (!p.section || x.section === p.section)).sort((a, b) => (b.waitingDays ?? -1) - (a.waitingDays ?? -1) || a.student.localeCompare(b.student) || a.skill.localeCompare(b.skill))
  const what = p.state ? RECORD_STATE_LABEL[p.state] : `Required ${skillNounPlural()}`
  // Titled by what it lists, the count said once in the title (anatomy A2, A5, A7; Romit 2026-10-30 on this drill).
  return { title: `${what}${p.section ? `, ${p.section}` : ""} (${fmt(rows.length)})`, rows }
}

/** Link to the in-page records list of variant C, carrying the scope. Uses page params the dashboard URL keeps (list, cond, q). */
export const pipelineHref = (scope: LabScope, p: PipelineDrillParams = {}): string => dashboardHref(scope, { list: "records", cond: p.state ?? undefined, q: p.section ?? undefined })

// =====================================================================================================================
// Concept E, sites and evaluators operations (dashboard-concepts README section 4 E). Appended, read-only.
//
// Open requests are `openRequestsIn(state, pop.ids, scope)` (location and setting recount, RP-08), the same rows the existing drill list reads, so a site's Open count
// equals `buildDrill(... list "requests", cond "waiting", siteId)`. The 8-week trend per site counts evaluations signed at
// that site per week for students in scope, from evaluation dates (every evaluation carries a date; past requests do not,
// so no request history is drawn).

export interface OpsSite {
  siteId: string
  name: string
  setting: string
  open: number
  buckets: number[]
  oldest: number
  /** Requests at 15 days or more. */
  old: number
  students: number
  /** Evaluations signed at this site per week, oldest week first. */
  signed: Array<{ value: number; label: string }>
}

export interface OpsHolder {
  id: string
  name: string
  verified: boolean
  site: string
  open: number
  oldest: number
}

export interface OpsRequest {
  id: string
  studentId: string
  student: string
  skills: string
  evaluator: string
  site: string
  days: number
}

export interface OpsModel {
  students: number
  waiting: number
  medianDays: number
  old: number
  oldSites: number
  sites: OpsSite[]
  top: OpsSite[]
  other: { sites: number; open: number; old: number; oldest: number; students: number; buckets: number[] }
  noSite: number
  holders: OpsHolder[]
  unverified: OpsHolder[]
  /** Unverified evaluators holding a request older than 8 days. */
  unverifiedOld: number
  open: Submission[]
}

export function opsModel(state: V2State, scope: LabScope, today: string = DEMO_TODAY, topN = 8): OpsModel {
  const pop = populationRows(state, scope, today)
  const open = openRequestsIn(state, pop.ids, scope)
  const people = new Map(state.people.map((p) => [p.id, p]))
  const cuts = weekCutoffs(today)
  const starts = cuts.map((c) => new Date(Date.parse(`${c}T00:00:00Z`) - 7 * DAY).toISOString().slice(0, 10))
  const signedBy = new Map<string, number[]>()
  for (const e of state.evaluations) {
    if (!e.siteId || !pop.ids.has(e.studentId) || !siteInScope(state, e.siteId, scope)) continue
    const d = e.date.slice(0, 10)
    const w = cuts.findIndex((c, i) => d > starts[i] && d <= c)
    if (w < 0) continue
    const arr = signedBy.get(e.siteId) ?? new Array<number>(cuts.length).fill(0)
    arr[w]++
    signedBy.set(e.siteId, arr)
  }
  const bySite = new Map<string, { site: OpsSite; students: Set<string> }>()
  let noSite = 0
  for (const x of open) {
    if (!x.siteId) { noSite++; continue }
    const site = state.sites?.find((s) => s.id === x.siteId)
    const cur = bySite.get(x.siteId) ?? { site: { siteId: x.siteId, name: siteName(state, x.siteId), setting: site?.setting ?? "", open: 0, buckets: [0, 0, 0, 0], oldest: 0, old: 0, students: 0, signed: (signedBy.get(x.siteId) ?? new Array<number>(cuts.length).fill(0)).map((v, i) => ({ value: v, label: `Week to ${weekLabel(cuts[i])}` })) }, students: new Set<string>() }
    cur.site.open++
    cur.site.buckets[ageBucket(x.daysWaiting)]++
    cur.site.oldest = Math.max(cur.site.oldest, x.daysWaiting)
    if (x.daysWaiting >= 15) cur.site.old++
    cur.students.add(x.studentId)
    bySite.set(x.siteId, cur)
  }
  const sites = [...bySite.values()].map(({ site, students }) => ({ ...site, students: students.size })).sort((a, b) => b.oldest - a.oldest || b.old - a.old || b.open - a.open || a.name.localeCompare(b.name))
  const rest = sites.slice(topN)
  const restStudents = new Set(open.filter((x) => x.siteId && rest.some((r) => r.siteId === x.siteId)).map((x) => x.studentId))
  const byHolder = new Map<string, OpsHolder>()
  for (const x of open) {
    const p = people.get(x.assignedToId)
    const h = byHolder.get(x.assignedToId) ?? { id: x.assignedToId, name: p?.name ?? "Unknown evaluator", verified: p?.verified !== false, site: p?.homeSiteId ? siteName(state, p.homeSiteId) : x.siteId ? siteName(state, x.siteId) : "No site recorded", open: 0, oldest: 0 }
    h.open++
    h.oldest = Math.max(h.oldest, x.daysWaiting)
    byHolder.set(x.assignedToId, h)
  }
  const holders = [...byHolder.values()].sort((a, b) => b.oldest - a.oldest || b.open - a.open || a.name.localeCompare(b.name))
  const unverified = holders.filter((h) => !h.verified)
  return {
    students: pop.rows.length,
    waiting: open.length,
    medianDays: median(open.map((x) => x.daysWaiting)),
    old: open.filter((x) => x.daysWaiting >= 15).length,
    oldSites: sites.filter((s) => s.old > 0).length,
    sites,
    top: sites.slice(0, topN),
    other: { sites: rest.length, open: rest.reduce((n, r) => n + r.open, 0), old: rest.reduce((n, r) => n + r.old, 0), oldest: Math.max(0, ...rest.map((r) => r.oldest)), students: restStudents.size, buckets: [0, 1, 2, 3].map((i) => rest.reduce((n, r) => n + r.buckets[i], 0)) },
    noSite,
    holders,
    unverified,
    unverifiedOld: unverified.filter((h) => h.oldest > 8).length,
    open,
  }
}

export interface OpsDrillParams {
  list: "holders" | "holder"
  /** holders: "unverified" narrows to unverified evaluators. */
  cond?: string | null
  /** holder: the evaluator id. */
  evaluator?: string | null
}

/** The rows behind an evaluator figure or name, same scope, so the length equals the figure that links here. */
export function opsDrill(state: V2State, m: OpsModel, p: OpsDrillParams): { title: string; crumb: string; holders?: OpsHolder[]; requests?: OpsRequest[]; count: number } {
  if (p.list === "holders") {
    const list = p.cond === "unverified" ? m.unverified : m.holders
    const what = p.cond === "unverified" ? "Unverified evaluators holding requests" : "Evaluators holding requests"
    return { title: `${plural(list.length, p.cond === "unverified" ? "unverified evaluator holds" : "evaluator holds", p.cond === "unverified" ? "unverified evaluators hold" : "evaluators hold")} requests, oldest first`, crumb: `${what} (${fmt(list.length)})`, holders: list, count: list.length }
  }
  const h = m.holders.find((x) => x.id === p.evaluator)
  const names = new Map(state.people.map((x) => [x.id, x.name]))
  const rows: OpsRequest[] = m.open.filter((x) => x.assignedToId === p.evaluator).map((x) => ({ id: x.id, studentId: x.studentId, student: names.get(x.studentId) ?? "Unknown student", skills: x.skillIds.map((k) => skillById(state, k)?.name ?? k).join(", "), evaluator: h?.name ?? "Unknown evaluator", site: x.siteId ? siteName(state, x.siteId) : "No site recorded", days: x.daysWaiting }))
  return { title: `${plural(rows.length, "request", "requests")} waiting with ${h?.name ?? "this evaluator"}`, crumb: `${h?.name ?? "Evaluator"} (${fmt(rows.length)})`, requests: rows, count: rows.length }
}

/** Link to the in-page evaluator lists of variant E, carrying the scope (page params list, cond, q are kept on scope change). */
export const opsHref = (scope: LabScope, p: OpsDrillParams): string => dashboardHref(scope, { list: p.list, cond: p.cond ?? undefined, q: p.evaluator ?? undefined })
