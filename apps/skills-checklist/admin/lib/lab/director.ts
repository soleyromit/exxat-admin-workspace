/**
 * Director (Dr. K. Brennan) screens: graduation readiness, verification worklist, verification detail and reports.
 *
 * One calculation for every director screen, so a student shows the same counts everywhere [BUILD-PROMPT 8.9]:
 * - the population (who is in scope, which evidence counts under location and setting filters) is `populationRows` from
 *   lib/lab/dashboard.ts, the shared behind calculation;
 * - "required for graduation" is the program's own flag on each skill (the checklist asterisk, "must be validated before
 *   graduation", kept on `skill.hgtc.required`), not the term's course mappings: a graduating cohort's mapped mandatory set
 *   covers only its current courses, while readiness asks about the whole program [INFER, dataset-spec arc 2];
 * - each skill's state is `skillProgress` on the population's evidence (the same engine call `populationRows` makes), read
 *   through `recordStateOf`, so the four engine states stay the only states [REQ AE-04].
 *
 * Verification is a v2 proposal, not REQ [AUDIT T3]. Rules kept here (strategy/03 D3, ledger): gaps never block, each gap needs a
 * named acknowledgement, the verified record states its own gaps, no "ready for practice" claim. Evidence in flux (an open
 * sign-off request, evidence awaiting approval, returned or reopened) blocks, as in v2 `pendingReasons`, because the record may
 * still change. A record verified before a rule change reads "Changed since verified" [strategy/03 H11].
 */
import type { Skill, Submission, V2State, Verification } from "@/lib/v2/types"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { STORY } from "@/lib/v2/generate"
import { FAR_BEHIND_MISSING, graduationStageOf, requiredToComplete, type GraduationStage } from "@/lib/v2/population"
import { GRADUATION_STAGE_LABEL, UNMET_LABEL } from "@/lib/v2/labels"
import { fmt, plural as fmtPlural, shortDate as fmtShortDate } from "@/lib/v2/format"
import { evalsOfStudent, evaluationById, personById, submissionsOfStudent } from "@/lib/v2/evidence-index"
import { skillProgress } from "@/lib/v2/student"
import { strengthHint } from "@/lib/v2/rules"
import { populationRows, recordStateOf, scopeOptions, type Population, type RecordState, type ScopeOptions } from "@/lib/lab/dashboard"
import { parseScope, scopeQuery, type LabScope } from "@/lib/lab/scope"
import { aNoun, capitalize } from "@/lib/lab/terms"

export const DIRECTOR_ID = "dir-brennan"
export const DIRECTOR_NAME = "Dr. K. Brennan"
export const LAB_DIRECTOR = "/lab/director"
/** URL value for "every cohort": the director's scope otherwise defaults to the graduating cohort. */
export const ANY_COHORT = "any"

const DAY = 86_400_000
/** One number and date format (lib/v2/format.ts): "Oct 2"; the year is added when it is not the demo year ("Nov 27, 2025"). */
export const plural = (n: number, one: string, many: string): string => fmtPlural(n, one, many)
export const shortDate = (iso: string): string => fmtShortDate(iso)
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / DAY)

// ---------------------------------------------------------------------------------------------------------------------
// Scope: cohort is a filter, preselected to the graduating cohort because the director's question names it (strategy/06 5.4).

/** The cohort that graduates next: the earliest graduation year not before the demo year. */
export function graduatingCohort(s: V2State, today: string = DEMO_TODAY): string | null {
  const year = Number(today.slice(0, 4))
  const list = [...(s.cohorts ?? [])].filter((c) => Number(c.graduates) >= year).sort((a, b) => Number(a.graduates) - Number(b.graduates))
  return list[0]?.name ?? null
}

type Params = { get(name: string): string | null }

/** Scope from the URL. No cohort in the URL means the graduating cohort; `cohort=any` means every cohort. */
export function parseDirectorScope(p: Params | null | undefined, s: V2State | null): LabScope {
  const raw = p?.get("cohort") ?? null
  const base = parseScope(p)
  if (raw === ANY_COHORT) return { ...base, cohort: "", group: "" }
  if (raw === null || raw === "") return { ...base, cohort: (s && graduatingCohort(s)) || "", group: "" }
  return base
}

/** Query for a director scope: an empty cohort is written as `cohort=any` so the default does not come back. */
export function directorQuery(scope: LabScope, extra: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams(scopeQuery(scope, extra))
  if (!scope.cohort) q.set("cohort", ANY_COHORT)
  return q.toString()
}

export type DirectorSlug = "dashboard" | "verification-detail" | "reports"
export const directorHref = (slug: DirectorSlug, scope: LabScope, extra: Record<string, string | undefined> = {}): string => `${LAB_DIRECTOR}/${slug}?${directorQuery(scope, extra)}`

/** Lists behind the figures (Dashboard C reads them, so the list length equals the figure). */
export type ListKey = "complete" | "short" | "several" | "far" | "open" | "ready" | "gaps" | "waiting" | "only" | "has" | "progress" | "notmet"
export const LIST_LABEL: Record<ListKey, string> = { complete: GRADUATION_STAGE_LABEL.complete, short: GRADUATION_STAGE_LABEL["one-short"], several: GRADUATION_STAGE_LABEL.short, far: GRADUATION_STAGE_LABEL.far, open: "Request open", ready: "Ready to verify", gaps: "Not complete", waiting: "Request waiting", only: "Only gap", has: "Achieved", progress: "In progress", notmet: UNMET_LABEL }
/** Lists that read one skill's state instead of requiring the skill to be missing. */
const SKILL_STATE_LISTS: ListKey[] = ["has", "progress", "notmet"]
export const isListKey = (v: string | null | undefined): v is ListKey => !!v && v in LIST_LABEL

/** A figure's list: the dashboard with ?list= (every dashboard variant renders the shared worklist for it), same scope. */
export const listHref = (scope: LabScope, p: { list?: ListKey; skill?: string; status?: VerifyStatus } = {}): string => directorHref("dashboard", scope, { list: p.list, skill: p.skill, status: p.status })
export const detailHref = (scope: LabScope, studentId: string, extra: Record<string, string | undefined> = {}): string => directorHref("verification-detail", scope, { student: studentId, ...extra })
/** The evidence behind one skill for one student (staff student record). */
export const evidenceHref = (scope: LabScope, studentId: string, skillId: string): string => `/lab/reviewer/student-record?${scopeQuery(scope, { student: studentId, skill: skillId })}`

// ---------------------------------------------------------------------------------------------------------------------
// Story data (verifications, the rule change, the answered request) lives in the generated seed (lib/v2/generate.ts, dataset
// spec section 12), so the reviewer, student, dashboard and director screens all see the same records. This module only reads it.

/** The story dates, from the data layer. Kept under the old name for existing imports. */
export const FIXTURE = STORY

export interface RuleChange {
  skillId: string
  skillName: string
  at: string
  /** The rule as it now reads. */
  rule: string
}

const OPEN: Array<Submission["status"]> = ["on-device", "with-evaluator", "awaiting-review", "stalled", "returned"]
const isOpen = (x: Submission) => OPEN.includes(x.status)

/** Required to graduate: the program checklist's "required before graduation" flag (lib/v2/population.ts requiredToComplete). */
const requiredSkills = (s: V2State): Skill[] => requiredToComplete(s)

const cache = new WeakMap<V2State, { state: V2State; ruleChanges: RuleChange[] }>()

function ruleSentence(k: Skill): string {
  if (!k.config) return "No rule yet."
  const sentence = strengthHint(k.model, k.config).sentence
  return sentence.replace(/^A student needs /, "Needs ")
}

/** The state every director screen reads (the store as is) and the rule changes recorded in it. Memoised per store state. */
export function directorFixture(s: V2State): { state: V2State; ruleChanges: RuleChange[] } {
  const hit = cache.get(s)
  if (hit) return hit
  const ruleChanges: RuleChange[] = (s.ruleChanges ?? []).flatMap((r) => {
    const k = s.skills.find((x) => x.id === r.skillId)
    return k ? [{ skillId: k.id, skillName: k.name, at: r.at, rule: ruleSentence(k) }] : []
  })
  const res = { state: s, ruleChanges }
  cache.set(s, res)
  return res
}

// ---------------------------------------------------------------------------------------------------------------------
// Readiness model

/**
 * Graduation bands (decision D-X11, `population.graduationStageOf`): complete, one short (exactly 1 missing), short (2 to 3) and
 * far behind (FAR_BEHIND_MISSING = 4 or more). `graduation` on the model counts all four; labels come from lib/v2/labels.ts.
 *
 * `Stage` is the older three-column bucket (complete, one short, and 2 or more under the "far" key). The director screens now
 * show the four bands (pipeline, dashboard B figures, attainment readiness line) from `graduation` / `graduationOpen`, and the
 * lists behind them use `GRADUATION_LIST` (the `far` list is 4 or more missing, `several` is 2 to 3). In the generated data
 * the 2-to-3 band is empty (31 / 4 / 0 / 3), so every figure is the same either way. New code reads `graduationStage`.
 */
export type Stage = "complete" | "short" | "far"
export const STAGES: Stage[] = ["complete", "short", "far"]
export const STAGE_LABEL: Record<Stage, string> = { complete: GRADUATION_STAGE_LABEL.complete, short: GRADUATION_STAGE_LABEL["one-short"], far: GRADUATION_STAGE_LABEL.far }
export { FAR_BEHIND_MISSING, GRADUATION_STAGE_LABEL, graduationStageOf, type GraduationStage }
export const GRADUATION_STAGES: GraduationStage[] = ["complete", "one-short", "short", "far"]
/** The list behind each graduation band (`short` stays the one-short list key for existing links; `several` is 2 to 3 missing). */
export const GRADUATION_LIST: Record<GraduationStage, ListKey> = { complete: "complete", "one-short": "short", short: "several", far: "far" }
/** The display bucket of a graduation band. */
export const stageOfGraduation = (g: GraduationStage): Stage => (g === "complete" ? "complete" : g === "one-short" ? "short" : "far")
export const stageOf = (gaps: number): Stage => stageOfGraduation(graduationStageOf(gaps))

export type VerifyStatus = "ready" | "changed" | "blocked" | "verified"
export const STATUSES: VerifyStatus[] = ["ready", "changed", "blocked", "verified"]
export const STATUS_LABEL: Record<VerifyStatus, string> = { ready: "Ready", changed: "Changed since verified", blocked: "Blocked", verified: "Verified" }
export const isStatus = (v: string | null | undefined): v is VerifyStatus => STATUSES.includes(v as VerifyStatus)

export interface OpenRequest {
  submissionId: string
  skillIds: string[]
  skillNames: string[]
  evaluator: string
  days: number
}

export interface SkillLine {
  skillId: string
  name: string
  section: string
  state: RecordState
  counted: number
  need: number
  /** What is left, in plain words (empty when achieved). */
  left: string
  /** Counted evaluations behind the state. */
  evaluations: number
  unmet: number
  lastDate: string | null
  /** Open request covering this skill. */
  request: OpenRequest | null
}

export interface ReadinessRow {
  id: string
  name: string
  cohort: string
  group: string | null
  required: number
  achieved: number
  gaps: SkillLine[]
  /** The graduation band (D-X11): one short = 1 missing, short = 2 to 3, far behind = 4 or more. */
  graduationStage: GraduationStage
  /** The display bucket (see `Stage`). */
  stage: Stage
  open: OpenRequest[]
  /** Why the record cannot be verified now (evidence in flux). Empty when it can. */
  flux: string[]
  status: VerifyStatus
  version: number | null
  verifiedAt: string | null
  /** What changed since the latest verification. */
  changes: string[]
  /** One line for the worklist: what stops it, or what is left to do. */
  next: string
}

export interface BlockerGroup {
  key: string
  skills: Array<{ id: string; name: string; section: string }>
  students: string[]
  /** Students in the group with an open request for one of its skills. */
  waiting: number
  /** Students for whom this group holds every gap. */
  onlyGap: number
}

export interface Readiness {
  scope: LabScope
  population: Population
  required: Skill[]
  rows: ReadinessRow[]
  stage: Record<Stage, number>
  /** Students per graduation band (D-X11), all four bands. */
  graduation: Record<GraduationStage, number>
  /** Students with an open request, per stage (the overlay). */
  stageOpen: Record<Stage, number>
  /** Students with an open request, per graduation band (the overlay on the four-band views). */
  graduationOpen: Record<GraduationStage, number>
  status: Record<VerifyStatus, number>
  /** Records that can be verified now (ready plus changed since verified). */
  readyToVerify: number
  requestsOpen: number
  blockers: BlockerGroup[]
  ruleChanges: RuleChange[]
  options: ScopeOptions
}

function openRequests(s: V2State, studentId: string, names: Map<string, string>, today: string): OpenRequest[] {
  return submissionsOfStudent(s, studentId)
    .filter(isOpen)
    .map((x) => ({
      submissionId: x.id,
      skillIds: x.skillIds,
      skillNames: x.skillIds.map((id) => names.get(id) ?? capitalize(aNoun())),
      evaluator: personById(s, x.assignedToId)?.name ?? "An evaluator",
      days: x.daysWaiting ?? daysBetween(x.createdAt, today),
    }))
    .sort((a, b) => b.days - a.days)
}

/** Every required skill for one student, gaps first. */
export function skillLines(ev: V2State, required: Skill[], studentId: string, open: OpenRequest[]): SkillLine[] {
  return required.map((k) => {
    const p = skillProgress(ev, studentId, k.id)
    const mine = evalsOfStudent(ev, studentId).filter((e) => e.skillId === k.id && e.status === "counted")
    const last = mine.reduce<string | null>((d, e) => (!d || e.date > d ? e.date : d), null)
    return {
      skillId: k.id,
      name: k.name,
      section: k.category,
      state: recordStateOf(p),
      counted: p?.counted ?? 0,
      need: p?.need ?? 0,
      left: p && !p.achieved ? p.left.join("; ") : "",
      evaluations: mine.length,
      unmet: mine.filter((e) => e.outcome !== "met").length,
      lastDate: last,
      request: open.find((o) => o.skillIds.includes(k.id)) ?? null,
    }
  })
}

function fluxReasons(s: V2State, studentId: string, open: OpenRequest[]): string[] {
  const out: string[] = []
  const mine = evalsOfStudent(s, studentId)
  const awaiting = mine.filter((e) => e.status === "awaiting-approval").length
  if (awaiting) out.push(`${plural(awaiting, "evaluation waits", "evaluations wait")} for approval`)
  const reopened = mine.filter((e) => e.status === "reopened").length
  if (reopened) out.push(`${plural(reopened, "evaluation is", "evaluations are")} reopened`)
  const returned = mine.filter((e) => e.status === "returned" && !e.submissionId).length
  if (returned) out.push(`${plural(returned, "evaluation was", "evaluations were")} returned and not yet fixed`)
  for (const o of open) out.push(`Request open: ${o.skillNames.join(", ")}, with ${o.evaluator}, ${plural(o.days, "day", "days")}`)
  return out
}

function changesSince(s: V2State, v: Verification, ruleChanges: RuleChange[], lines: SkillLine[]): string[] {
  const out: string[] = []
  for (const rc of ruleChanges) if (rc.at > v.at.slice(0, 10) && v.skills.some((k) => k.skillId === rc.skillId)) out.push(`Rule changed ${shortDate(rc.at)}: ${rc.skillName}. ${rc.rule}`)
  for (const e of v.evidence) {
    const now = evaluationById(s, e.evaluationId)
    if (!now) out.push("An evaluation the record rested on was removed.")
    else if (now.currentVersion !== e.version) out.push(`A new version of an evaluation was added after version ${e.version}.`)
  }
  const nowAchieved = new Map(lines.map((l) => [l.skillId, l.state === "achieved"]))
  const flipped = v.skills.filter((k) => nowAchieved.has(k.skillId) && nowAchieved.get(k.skillId) !== k.achieved).length
  if (flipped) out.push(`${plural(flipped, "required skill changed", "required skills changed")} state since then.`)
  return out
}

/**
 * "Required to graduate" narrowed by the scope's category, tag and course (a course keeps the graduation skills mapped to it).
 * Director readiness and the Attainment graduate basis both read this, so their totals agree (tests/v2/consistency.test.ts).
 */
export function graduationSkillsIn(s: V2State, scope: Pick<LabScope, "cat" | "tag" | "course">): Skill[] {
  const course = scope.course
  const mappedToCourse = course ? new Set(s.mappings.filter((m) => m.courseId === course && m.level !== "not-expected").map((m) => m.skillId)) : null
  return requiredSkills(s).filter((k) => (!scope.cat || k.category === scope.cat) && (!scope.tag || (k.tags ?? []).includes(scope.tag)) && (!mappedToCourse || mappedToCourse.has(k.id)))
}

export function buildReadiness(store: V2State, scope: LabScope, today: string = DEMO_TODAY): Readiness {
  const { state: s, ruleChanges } = directorFixture(store)
  const population = populationRows(s, scope, today)
  const ev = population.evidenceState
  const required = graduationSkillsIn(s, scope)
  const names = new Map(s.skills.map((k) => [k.id, k.name]))
  const verifs = s.verifications ?? []

  const rows: ReadinessRow[] = population.rows.map((r) => {
    const open = openRequests(s, r.id, names, today)
    const lines = skillLines(ev, required, r.id, open)
    const gaps = lines.filter((l) => l.state !== "achieved")
    const flux = fluxReasons(s, r.id, open)
    const latest = verifs.filter((v) => v.studentId === r.id).at(-1) ?? null
    const changes = latest ? changesSince(s, latest, ruleChanges, lines) : []
    const status: VerifyStatus = flux.length ? "blocked" : latest ? (changes.length ? "changed" : "verified") : "ready"
    const gapWord = gaps.length === 1 ? `${gaps[0].name} not achieved` : `${fmt(gaps.length)} required skills not achieved`
    const next =
      status === "blocked"
        ? `${flux[0]}${flux.length > 1 ? `, and ${fmt(flux.length - 1)} more` : ""}`
        : status === "changed"
          ? changes[0]
          : status === "verified"
            ? `Verified, version ${latest?.version}, ${shortDate(latest!.at)}`
            : gaps.length
              ? `${gapWord}; acknowledge to verify`
              : "Nothing open"
    return {
      id: r.id,
      name: r.name,
      cohort: r.cohort,
      group: r.group,
      required: required.length,
      achieved: required.length - gaps.length,
      gaps,
      graduationStage: graduationStageOf(gaps.length),
      stage: stageOf(gaps.length),
      open,
      flux,
      status,
      version: latest?.version ?? null,
      verifiedAt: latest?.at ?? null,
      changes,
      next,
    }
  })
  rows.sort((a, b) => b.gaps.length - a.gaps.length || a.name.localeCompare(b.name))

  const stage: Record<Stage, number> = { complete: 0, short: 0, far: 0 }
  const graduation: Record<GraduationStage, number> = { complete: 0, "one-short": 0, short: 0, far: 0 }
  const stageOpen: Record<Stage, number> = { complete: 0, short: 0, far: 0 }
  const graduationOpen: Record<GraduationStage, number> = { complete: 0, "one-short": 0, short: 0, far: 0 }
  const status: Record<VerifyStatus, number> = { ready: 0, changed: 0, blocked: 0, verified: 0 }
  for (const r of rows) {
    stage[r.stage] += 1
    graduation[r.graduationStage] += 1
    if (r.open.length) stageOpen[r.stage] += 1
    if (r.open.length) graduationOpen[r.graduationStage] += 1
    status[r.status] += 1
  }

  // Blockers: required skills not achieved, grouped by the exact set of students they block (ties stated as one group).
  const bySkill = new Map<string, { skill: SkillLine; students: string[] }>()
  for (const r of rows) for (const g of r.gaps) {
    const e = bySkill.get(g.skillId) ?? { skill: g, students: [] }
    e.students.push(r.id)
    bySkill.set(g.skillId, e)
  }
  const groups = new Map<string, BlockerGroup>()
  for (const { skill, students } of bySkill.values()) {
    const key = [...students].sort().join("|")
    const g = groups.get(key) ?? { key, skills: [], students: [...students].sort(), waiting: 0, onlyGap: 0 }
    g.skills.push({ id: skill.skillId, name: skill.name, section: skill.section })
    groups.set(key, g)
  }
  const rowById = new Map(rows.map((r) => [r.id, r]))
  const blockers = [...groups.values()].map((g) => {
    const ids = new Set(g.skills.map((k) => k.id))
    const members = g.students.map((id) => rowById.get(id)!)
    return {
      ...g,
      skills: g.skills.sort((a, b) => a.name.localeCompare(b.name)),
      waiting: members.filter((m) => m.open.some((o) => o.skillIds.some((id) => ids.has(id)))).length,
      onlyGap: members.filter((m) => m.gaps.every((x) => ids.has(x.skillId))).length,
    }
  })
  blockers.sort((a, b) => b.students.length - a.students.length || a.skills.length - b.skills.length || a.skills[0].name.localeCompare(b.skills[0].name))

  return {
    scope,
    population,
    required,
    rows,
    stage,
    graduation,
    stageOpen,
    graduationOpen,
    status,
    readyToVerify: status.ready + status.changed,
    requestsOpen: rows.reduce((t, r) => t + r.open.length, 0),
    blockers,
    ruleChanges,
    options: scopeOptions(s, scope, today),
  }
}

/** Rows behind a figure. The list keys and the figures share these predicates, so the counts are equal by construction. */
export function filterRows(rows: ReadinessRow[], p: { list?: ListKey | null; skill?: string | null; status?: VerifyStatus | null }): ReadinessRow[] {
  // `skill` may name several skills (a blocker group, comma separated): the row must miss every one of them.
  const skills = p.skill ? p.skill.split(",").filter(Boolean) : []
  return rows.filter((r) => {
    if (p.list && SKILL_STATE_LISTS.includes(p.list)) {
      const g = r.gaps.find((x) => x.skillId === skills[0])
      if (p.status && r.status !== p.status) return false
      return p.list === "has" ? !g : p.list === "progress" ? g?.state === "progress" : !!g && g.state !== "progress"
    }
    if (skills.length && !skills.every((id) => r.gaps.some((g) => g.skillId === id))) return false
    if (p.status && r.status !== p.status) return false
    switch (p.list) {
      case "waiting":
        return r.open.some((o) => o.skillIds.some((id) => skills.includes(id)))
      case "only":
        return r.gaps.every((g) => skills.includes(g.skillId))
      case "complete":
        return r.stage === "complete"
      case "short":
        return r.stage === "short"
      case "several":
        return r.graduationStage === "short"
      case "far":
        return r.graduationStage === "far"
      case "gaps":
        return r.stage !== "complete"
      case "open":
        return r.open.length > 0
      case "ready":
        return r.status === "ready" || r.status === "changed"
      default:
        return true
    }
  })
}

/** Bulk "Open for verification" is offered only for like rows: all Ready with no gaps, or all Changed since verified. */
export function bulkAlike(rows: ReadinessRow[]): { alike: boolean; reason: string } {
  if (rows.length === 0) return { alike: false, reason: "" }
  const ready = rows.every((r) => r.status === "ready" && r.gaps.length === 0)
  const changed = rows.every((r) => r.status === "changed")
  if (ready || changed) return { alike: true, reason: "" }
  if (rows.some((r) => r.status === "blocked")) return { alike: false, reason: "Blocked records cannot be opened together" }
  if (rows.some((r) => r.gaps.length > 0)) return { alike: false, reason: "Records with gaps open one at a time" }
  return { alike: false, reason: "Choose records with the same status" }
}

/** ?state=clear: the calm view, everyone complete with nothing open (design review only). */
export function withClear(m: Readiness): Readiness {
  const rows = m.rows.map((r) => ({ ...r, gaps: [], graduationStage: "complete" as GraduationStage, stage: "complete" as Stage, open: [], flux: [], achieved: r.required, status: r.status === "blocked" ? ("ready" as VerifyStatus) : r.status, next: r.status === "changed" ? r.next : "Nothing open" }))
  const status: Record<VerifyStatus, number> = { ready: 0, changed: 0, blocked: 0, verified: 0 }
  for (const r of rows) status[r.status] += 1
  return { ...m, rows, stage: { complete: rows.length, short: 0, far: 0 }, graduation: { complete: rows.length, "one-short": 0, short: 0, far: 0 }, stageOpen: { complete: 0, short: 0, far: 0 }, graduationOpen: { complete: 0, "one-short": 0, short: 0, far: 0 }, status, readyToVerify: status.ready + status.changed, requestsOpen: 0, blockers: [] }
}

// ---------------------------------------------------------------------------------------------------------------------
// Verification detail

export interface DetailModel {
  row: ReadinessRow
  lines: SkillLine[]
  sections: Array<{ section: string; lines: SkillLine[]; achieved: number }>
  /** What the verified record will state about itself. */
  statement: string
}

export function detailModel(store: V2State, m: Readiness, studentId: string | null): DetailModel | null {
  const row = (studentId ? m.rows.find((r) => r.id === studentId) : null) ?? m.rows.find((r) => r.status !== "blocked" && r.gaps.length > 0) ?? m.rows[0]
  if (!row) return null
  const lines = skillLines(m.population.evidenceState, m.required, row.id, row.open)
  const bySection = new Map<string, SkillLine[]>()
  for (const l of lines) bySection.set(l.section, [...(bySection.get(l.section) ?? []), l])
  const sections = [...bySection.entries()]
    .map(([section, ls]) => ({ section, lines: ls, achieved: ls.filter((l) => l.state === "achieved").length }))
    .sort((a, b) => a.achieved - a.lines.length - (b.achieved - b.lines.length) || a.section.localeCompare(b.section))
  const statement = `${fmt(row.achieved)} of ${fmt(row.required)} required skills achieved.${row.gaps.length ? ` Not achieved: ${row.gaps.map((g) => g.name).join(", ")}.` : ""}`
  void store
  return { row, lines, sections, statement }
}

// ---------------------------------------------------------------------------------------------------------------------
// Reports (RP-01..RP-10)

export type ReportView = "student" | "skill" | "section"
export const REPORT_VIEWS: ReportView[] = ["student", "skill", "section"]
export const isReportView = (v: string | null | undefined): v is ReportView => REPORT_VIEWS.includes(v as ReportView)

export interface StudentReportRow extends Record<string, unknown> {
  id: string
  name: string
  achieved: number
  progress: number
  notMet: number
  required: number
  pct: number
}
export interface SkillReportRow extends Record<string, unknown> {
  id: string
  name: string
  section: string
  achieved: number
  progress: number
  notMet: number
  students: number
}
export interface SectionReportRow extends Record<string, unknown> {
  id: string
  section: string
  skills: number
  achieved: number
  progress: number
  notMet: number
  records: number
  pct: number
}

export interface CsvRow {
  student: string
  skill: string
  date: string
  outcome: string
  evaluator: string
  setting: string
  location: string
  feedback: string
}

export interface ReportModel {
  students: StudentReportRow[]
  skills: SkillReportRow[]
  sections: SectionReportRow[]
  /** Evaluation-level rows the CSV carries for this scope. */
  csvRows: number
  csvSample: CsvRow[]
}

const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100))
const OUTCOME_WORD: Record<string, string> = { met: "Met", "not-met": "Unmet", "not-yet": "Not yet" }

export function reportModel(m: Readiness): ReportModel {
  const ev = m.population.evidenceState
  const lineBy = new Map<string, SkillLine[]>()
  for (const r of m.rows) lineBy.set(r.id, skillLines(ev, m.required, r.id, r.open))
  const students: StudentReportRow[] = m.rows.map((r) => {
    const ls = lineBy.get(r.id)!
    const achieved = ls.filter((l) => l.state === "achieved").length
    const progress = ls.filter((l) => l.state === "progress").length
    return { id: r.id, name: r.name, achieved, progress, notMet: ls.length - achieved - progress, required: ls.length, pct: pct(achieved, ls.length) }
  })
  const skills: SkillReportRow[] = m.required.map((k) => {
    let achieved = 0
    let progress = 0
    for (const r of m.rows) {
      const st = lineBy.get(r.id)!.find((l) => l.skillId === k.id)!.state
      if (st === "achieved") achieved += 1
      else if (st === "progress") progress += 1
    }
    return { id: k.id, name: k.name, section: k.category, achieved, progress, notMet: m.rows.length - achieved - progress, students: m.rows.length }
  })
  const secMap = new Map<string, SectionReportRow>()
  for (const k of skills) {
    const r = secMap.get(k.section) ?? { id: k.section, section: k.section, skills: 0, achieved: 0, progress: 0, notMet: 0, records: 0, pct: 0 }
    r.skills += 1
    r.achieved += k.achieved
    r.progress += k.progress
    r.notMet += k.notMet
    r.records += k.students
    secMap.set(k.section, r)
  }
  const sections = [...secMap.values()].map((r) => ({ ...r, pct: pct(r.achieved, r.records) })).sort((a, b) => a.pct - b.pct || a.section.localeCompare(b.section))
  const ids = new Set(m.rows.map((r) => r.id))
  const reqIds = new Set(m.required.map((k) => k.id))
  const evs = ev.evaluations.filter((e) => ids.has(e.studentId) && reqIds.has(e.skillId))
  const nameOf = new Map(m.rows.map((r) => [r.id, r.name]))
  const skillName = new Map(m.required.map((k) => [k.id, k.name]))
  const csvSample = [...evs]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3)
    .map((e) => ({
      student: nameOf.get(e.studentId) ?? "",
      skill: skillName.get(e.skillId) ?? "",
      date: shortDate(e.date),
      outcome: OUTCOME_WORD[e.outcome] ?? e.outcome,
      evaluator: personById(ev, e.evaluatorId)?.name ?? "",
      setting: e.clinicalSetting ? `${e.setting}, ${e.clinicalSetting}` : e.setting,
      location: e.location ?? "",
      feedback: e.versions.at(-1)?.detail?.feedback ?? "",
    }))
  return { students, skills, sections, csvRows: evs.length, csvSample }
}

/** Columns the CSV carries, one row per evaluation [REQ RP-10]. Self-ratings and private notes stay out (v2 D36). */
export const CSV_COLUMNS = ["Student", "Skill", "Date", "Outcome", "Evaluator", "Setting", "Location", "Feedback"] as const
