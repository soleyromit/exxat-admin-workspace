/**
 * Evaluator directory (build prompt admevals, admconsistency). Pure functions over V2State; the store is never written.
 *
 * REQ: evaluators are recordable by name and email without a Prism account [REQ SL-08]; a name a student typed that the program has
 * not recorded is visible and can be adopted, so one person does not pile up under several spellings [SL-09]. Decided [LEDGER]: an
 * unverified name means its evidence is awaiting approval; adopting or merging is the reviewer or admin decision. The decision itself
 * goes through the reviewer decisions overlay (lib/lab/reviewer.ts `Decision` kind "adopt"), so Approvals and the student record agree.
 *
 * Consistency (admconsistency, a Recommendation in the build prompt, never a P1 default): an evaluator's share of evaluations that
 * did not qualify or were returned, against the program average. Flagged only with enough evidence: n >= 30 evaluations and at least
 * 5 such evaluations, and the rate at least twice the program average [INFER on the factor]. Below that the rate is not compared.
 * Evidence a reviewer assigned to someone else is not a return by its evaluator and is left out of the events (decided 2026-10-26).
 */
import type { Person, V2State } from "@/lib/v2/types"
import { LAB_ADMIN } from "./library"
import { sentElsewhereTo } from "@/lib/v2/student"

export type EvaluatorRoleKey = "preceptor" | "faculty" | "lab-instructor"
export const ROLE_LABEL: Record<EvaluatorRoleKey, string> = { preceptor: "Preceptor", faculty: "Clinical faculty", "lab-instructor": "Lab instructor" }

/** Small-number suppression (brief): compare only with n >= 30 evaluations and >= 5 that did not qualify or were returned. */
export const MIN_EVALUATIONS = 30
export const MIN_EVENTS = 5
export const FLAG_FACTOR = 2

export type Consistency = "above" | "in-range" | "too-few"

export interface EvaluatorRow extends Record<string, unknown> {
  id: string
  name: string
  email: string
  role: EvaluatorRoleKey
  roleLabel: string
  siteId: string
  site: string
  setting: string
  verified: boolean
  evaluations: number
  /** Evaluations awaiting approval because the name is not adopted. */
  held: number
  /** Did not meet criteria or returned by a reviewer. */
  events: number
  /** 0 to 100, one decimal. */
  rate: number
  consistency: Consistency
  openRequests: number
  oldestDays: number
  haystack: string
}

export interface DirectorySummary {
  evaluators: number
  awaiting: number
  /** Share of evaluations signed by an adopted evaluator, 0 to 100. */
  verifiedShare: number
  /** Program average of the event rate, 0 to 100, one decimal. */
  programRate: number
  flagged: number
}

const EVALUATOR_KINDS = new Set<Person["kind"]>(["preceptor", "faculty", "lab-instructor"])
const OPEN = new Set(["with-evaluator", "stalled"])

const round1 = (n: number) => Math.round(n * 10) / 10

function siteLabel(s: V2State, siteId: string | undefined): { site: string; setting: string } {
  const site = siteId ? (s.sites ?? []).find((x) => x.id === siteId) : undefined
  return site ? { site: `${site.facility}, ${site.unit}`, setting: site.setting } : { site: "Program", setting: "Lab or campus" }
}

const cache = new WeakMap<V2State, { rows: EvaluatorRow[]; summary: DirectorySummary }>()

export function directory(s: V2State): { rows: EvaluatorRow[]; summary: DirectorySummary } {
  const hit = cache.get(s)
  if (hit) return hit
  const people = s.people.filter((p) => EVALUATOR_KINDS.has(p.kind))
  const tally = new Map<string, { n: number; held: number; events: number }>()
  for (const e of s.evaluations) {
    const t = tally.get(e.evaluatorId) ?? { n: 0, held: 0, events: 0 }
    t.n++
    if (e.status === "awaiting-approval") t.held++
    // A reviewer's "Assign to someone else" marks the held evidence returned, but it is a reassignment, not a return of this
    // evaluator's judgement, so it never feeds the outlier rate. The evaluator's own answer (Unmet, Not yet) still does.
    const assignedAway = sentElsewhereTo(s, e) !== null
    if (e.outcome !== "met" || (!assignedAway && (e.status === "returned" || e.review?.decision === "returned"))) t.events++
    tally.set(e.evaluatorId, t)
  }
  const open = new Map<string, { n: number; oldest: number }>()
  for (const x of s.submissions) {
    if (!OPEN.has(x.status)) continue
    const o = open.get(x.assignedToId) ?? { n: 0, oldest: 0 }
    o.n++
    o.oldest = Math.max(o.oldest, x.daysWaiting)
    open.set(x.assignedToId, o)
  }
  let allN = 0
  let allEvents = 0
  let verifiedN = 0
  for (const p of people) {
    const t = tally.get(p.id)
    if (!t) continue
    allN += t.n
    allEvents += t.events
    if (p.verified !== false) verifiedN += t.n
  }
  const programRate = allN ? round1((allEvents / allN) * 100) : 0
  const rows: EvaluatorRow[] = people.map((p) => {
    const t = tally.get(p.id) ?? { n: 0, held: 0, events: 0 }
    const role = p.kind as EvaluatorRoleKey
    const { site, setting } = siteLabel(s, p.homeSiteId)
    const rate = t.n ? round1((t.events / t.n) * 100) : 0
    const enough = t.n >= MIN_EVALUATIONS && t.events >= MIN_EVENTS
    const consistency: Consistency = !enough ? "too-few" : rate >= programRate * FLAG_FACTOR ? "above" : "in-range"
    const o = open.get(p.id) ?? { n: 0, oldest: 0 }
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      role,
      roleLabel: ROLE_LABEL[role],
      siteId: p.homeSiteId ?? "",
      site,
      setting,
      verified: p.verified !== false,
      evaluations: t.n,
      held: t.held,
      events: t.events,
      rate,
      consistency,
      openRequests: o.n,
      oldestDays: o.oldest,
      haystack: `${p.name} ${p.email} ${site}`.toLowerCase(),
    }
  })
  // Names awaiting a decision first, then by name.
  rows.sort((a, b) => Number(a.verified) - Number(b.verified) || a.name.localeCompare(b.name))
  const summary: DirectorySummary = {
    evaluators: rows.length,
    awaiting: rows.filter((r) => !r.verified).length,
    verifiedShare: allN ? Math.round((verifiedN / allN) * 1000) / 10 : 100,
    programRate,
    flagged: rows.filter((r) => r.consistency === "above").length,
  }
  const out = { rows, summary }
  cache.set(s, out)
  return out
}

export type StatusFilter = "" | "verified" | "awaiting" | "above"

export interface DirectoryFilter {
  q: string
  role: "" | EvaluatorRoleKey
  site: string
  status: StatusFilter
}

export const EMPTY_DIRECTORY_FILTER: DirectoryFilter = { q: "", role: "", site: "", status: "" }

/** Runs on the full set, never on the visible rows. */
export function filterDirectory(rows: readonly EvaluatorRow[], f: DirectoryFilter): EvaluatorRow[] {
  const q = f.q.trim().toLowerCase()
  return rows.filter(
    (r) =>
      (!q || r.haystack.includes(q)) &&
      (!f.role || r.role === f.role) &&
      (!f.site || r.siteId === f.site) &&
      (!f.status || (f.status === "verified" ? r.verified : f.status === "awaiting" ? !r.verified : r.consistency === "above")),
  )
}

/** Inbound links from the dashboard say `?filter=unverified`. */
export function statusFromParam(v: string | null): StatusFilter {
  return v === "unverified" || v === "awaiting" ? "awaiting" : v === "verified" ? "verified" : v === "above" ? "above" : ""
}

// ---------------------------------------------------------------------------------------------------------------------
// Adopt or merge

export interface MergeCandidate {
  id: string
  name: string
  email: string
  site: string
  /** Why it is suggested, in words. */
  why: string
  score: number
}

const surname = (name: string) => (name.split(",")[0] ?? name).trim().split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, "") ?? ""
const initial = (name: string) => name.trim().charAt(0).toLowerCase()

/** Adopted evaluators this name may be: same surname, same site, same credential. At most `limit`, best first. */
export function mergeCandidates(s: V2State, evaluatorId: string, limit = 5): MergeCandidate[] {
  const me = s.people.find((p) => p.id === evaluatorId)
  if (!me) return []
  const sn = surname(me.name)
  const out: MergeCandidate[] = []
  for (const p of s.people) {
    if (p.id === me.id || !EVALUATOR_KINDS.has(p.kind) || p.verified === false) continue
    const reasons: string[] = []
    let score = 0
    if (sn && surname(p.name) === sn) {
      score += 3
      reasons.push("same surname")
      if (initial(p.name) === initial(me.name)) {
        score += 1
        reasons.push("same initial")
      }
    }
    if (me.homeSiteId && p.homeSiteId === me.homeSiteId) {
      score += 2
      reasons.push("same site")
    }
    if (score === 0) continue
    if ((me.credentials ?? []).some((c) => (p.credentials ?? []).includes(c))) score += 0.5
    out.push({ id: p.id, name: p.name, email: p.email, site: siteLabel(s, p.homeSiteId).site, why: reasons.join(", ").replace(/^./, (c) => c.toUpperCase()), score })
  }
  return out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit)
}

// ---------------------------------------------------------------------------------------------------------------------
// By site

export interface SiteRow extends Record<string, unknown> {
  id: string
  facility: string
  unit: string
  setting: string
  evaluators: number
  awaiting: number
  evaluations: number
  openRequests: number
  oldestDays: number
  flagged: number
  haystack: string
}

export function siteRows(s: V2State, rows: readonly EvaluatorRow[] = directory(s).rows): SiteRow[] {
  const bySite = new Map<string, EvaluatorRow[]>()
  for (const r of rows) {
    if (!r.siteId) continue
    const list = bySite.get(r.siteId) ?? []
    list.push(r)
    bySite.set(r.siteId, list)
  }
  return (s.sites ?? [])
    .filter((x) => bySite.has(x.id))
    .map((x) => {
      const list = bySite.get(x.id) ?? []
      return {
        id: x.id,
        facility: x.facility,
        unit: x.unit,
        setting: x.setting,
        evaluators: list.length,
        awaiting: list.filter((r) => !r.verified).length,
        evaluations: list.reduce((n, r) => n + r.evaluations, 0),
        openRequests: list.reduce((n, r) => n + r.openRequests, 0),
        oldestDays: list.reduce((n, r) => Math.max(n, r.oldestDays), 0),
        flagged: list.filter((r) => r.consistency === "above").length,
        haystack: `${x.facility} ${x.unit} ${x.setting}`.toLowerCase(),
      }
    })
    .sort((a, b) => b.awaiting - a.awaiting || b.openRequests - a.openRequests || a.facility.localeCompare(b.facility))
}

export function settingOptions(rows: readonly SiteRow[]): string[] {
  return [...new Set(rows.map((r) => r.setting))].sort()
}

export const DIRECTORY_PATH = `${LAB_ADMIN}/evaluator-directory`

export function directoryLink(p: { variant?: string; filter?: string; site?: string; role?: string; q?: string; evaluator?: string } = {}): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) if (v) q.set(k, v)
  const s = q.toString()
  return s ? `${DIRECTORY_PATH}?${s}` : DIRECTORY_PATH
}

export const pct = (n: number): string => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`
