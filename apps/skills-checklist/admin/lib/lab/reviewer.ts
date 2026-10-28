/**
 * Reviewer lab model (Approvals queue, Review item, Student record). Pure functions over V2State, read through the v2 selectors
 * (queueItems, compareEvaluation, approveItems, returnItem, skillProgress, studentHistory) and lib/v2/evidence-index.ts. Reviewer
 * decisions are written to the shared store through `commitDecision`, so every screen (not only the reviewer's) reads them.
 *
 * Lab rule from the decisions ledger: evidence signed by an evaluator name the program has not adopted (Person.verified === false) is
 * "Awaiting approval decision", and adopting the name is the reviewer's decision. The v2 seed stores that evidence as counted; the lab
 * reads it as held (`labState`) so the queue, the review item and the student record agree [LEDGER; REQ SL-09, ST-09; BUILD-PROMPT J7].
 *
 * Why held [AUDIT T3 P1-3; BUILD-PROMPT section 7 aprqueue]: paper form with no outcome yet, new evaluator name, self and evaluator
 * disagree, or the skill's rule holds evidence for approval [REQ SC-15]. v2 sets "awaiting-approval" only through the SC-15 hold
 * (lib/v2/preceptor.ts:240), so a held evaluation with no other cause is read as "Approval required for {skill}" [INFER: the seed skill configs
 * do not carry the flag].
 */
import type { Evaluation, Person, Skill, Submission, V2State } from "@/lib/v2/types"
import { appendAudit } from "@/lib/v2/store"
import { approveItems, compareEvaluation, queueItems, returnItem, ROLE_LABEL, type Agreement, type Comparison, type QueueItem } from "@/lib/v2/queue"
import { AGING_DAYS as Q_AGING_DAYS, CAUSE_LABEL, CAUSE_ORDER, NUDGE_DAYS as Q_NUDGE_DAYS, approvalEntries, approvalsInScope, heldState, type ApprovalEntry, type HeldCause } from "@/lib/v2/approvals"
import { findTerm } from "@/lib/v2/filters"
import { evaluatorChoices, sentElsewhereTo, skillProgress, studentHistory, type SkillProgress } from "@/lib/v2/student"
import { evalsOfStudent, personById, skillById } from "@/lib/v2/evidence-index"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { populationRows } from "@/lib/v2/population"
import { SENT_FOR_NEW_EVALUATION_WORD, outcomeWord, sentForNewEvaluationLabel } from "@/lib/v2/labels"
import { withScope, type LabScope } from "./scope"
import { aNoun, capitalize, skillNoun, skillNounPlural } from "./terms"

/** L. Haddad, the reviewer persona. */
export const REVIEWER_ID = "rev-haddad"
export const REVIEWER_NAME = "L. Haddad"
/** Waiting 8+ days is aging (N-11); approvals over 3 days nudge the reviewer (N-09). */
export const AGING_DAYS = Q_AGING_DAYS
export const NUDGE_DAYS = Q_NUDGE_DAYS
export const LAB_REVIEWER = "/lab/reviewer"
const DECIDED_AT = `${DEMO_TODAY}T10:00:00.000Z`

/** Causes are defined once in lib/v2/approvals.ts; the lab adds only the icon. */
export type HoldReason = HeldCause
export const REASON_ORDER: HoldReason[] = CAUSE_ORDER

export const REASON_META: Record<HoldReason, { label: string; icon: string }> = {
  "new-evaluator": { label: CAUSE_LABEL["new-evaluator"], icon: "fa-user-plus" },
  rule: { label: CAUSE_LABEL.rule, icon: "fa-scale-balanced" },
  disagree: { label: CAUSE_LABEL.disagree, icon: "fa-not-equal" },
  paper: { label: CAUSE_LABEL.paper, icon: "fa-file-image" },
}

// ---------------------------------------------------------------------------------------------------------------------
// Decisions overlay

export type Decision =
  | { kind: "approve"; key: string; note?: string }
  | { kind: "return"; key: string; note: string; path: ReturnPath; toId?: string }
  | { kind: "adopt"; evaluatorId: string; mode: "adopt" | "merge"; intoId?: string; note?: string }
  | { kind: "correction"; evaluationId: string; note: string }
  | { kind: "assign"; key: string; toId: string }

/** Correction continues the same record (RV-02); a new attempt is a separate record (RV-03). Either may go to another evaluator (RV-04). */
export type ReturnPath = "correct-same" | "correct-other" | "new-attempt"
export const RETURN_PATH_LABEL: Record<ReturnPath, string> = {
  "correct-same": "Correction, same evaluator",
  "correct-other": "Correction, a different evaluator",
  "new-attempt": "New attempt",
}

// ---------------------------------------------------------------------------------------------------------------------
// The lab's reading of the store

/** Evidence from an evaluator name not adopted yet is held for the reviewer's decision. The one definition is `heldState`. */
export function labState(s: V2State): V2State {
  return heldState(s)
}

/** Applies the reviewer's decisions to the lab (held) state. Pure. The store form is `commitDecision`. */
export function applyDecisions(s: V2State, decisions: readonly Decision[]): V2State {
  let state = labState(s)
  for (const d of decisions) {
    if (d.kind === "adopt") {
      const ids = new Set(state.evaluations.filter((e) => e.evaluatorId === d.evaluatorId && e.status === "awaiting-approval").map((e) => e.id))
      state = {
        ...state,
        people: state.people.map((p) => (p.id === d.evaluatorId ? { ...p, verified: true } : p)),
        evaluations: state.evaluations.map((e) => (ids.has(e.id) ? { ...e, status: "counted" as const, ...(d.mode === "merge" && d.intoId ? { evaluatorId: d.intoId } : {}), review: { decision: "approved" as const, byId: REVIEWER_ID, at: DECIDED_AT, note: d.note?.trim() || (d.mode === "merge" ? "Evaluator name merged" : "Evaluator name adopted") } } : e)),
      }
      continue
    }
    if (d.kind === "correction") continue
    if (d.kind === "assign") {
      state = assignEntry(state, d.key, d.toId)
      continue
    }
    const keys = keysOf(state, d.key)
    if (d.kind === "approve") {
      const r = approveItems(state, keys, REVIEWER_ID, DECIDED_AT, d.note ?? "")
      if (r.ok) state = r.state
    } else {
      for (const k of keys) {
        const r = returnItem(state, k, { reason: d.note }, REVIEWER_ID, DECIDED_AT)
        if (r.ok) state = r.state
      }
    }
  }
  return state
}

/**
 * One reviewer decision as a transition of the shared store (lib/v2/store.ts persists it as a delta), so an approval, a return or
 * an adopted or merged evaluator name changes the Approvals badge, the dashboard, student progress, director readiness and
 * attainment together, in this session and after reload.
 *
 * The store keeps evidence from an unadopted evaluator name as counted and every reader applies `heldState`. Writing the held copy
 * back would turn those rows into stored "awaiting approval" rows (and change the status-row versus unverified-row split), so only
 * rows the decision changed are written; every other row stays the store's own. A correction request changes nothing in the store.
 */
export function commitDecision(raw: V2State, d: Decision): V2State {
  if (d.kind === "correction") return raw
  const held = labState(raw)
  const next = applyDecisions(raw, [d])
  if (next === held) return raw
  const heldById = new Map(held.evaluations.map((e) => [e.id, e]))
  const rawById = new Map(raw.evaluations.map((e) => [e.id, e]))
  const evaluations = next.evaluations.map((e) => (heldById.get(e.id) === e ? (rawById.get(e.id) ?? e) : e))
  return { ...next, evaluations }
}

/** Applies a list of decisions to the shared store, in order (the store form of `applyDecisions`). */
export function commitDecisions(raw: V2State, decisions: readonly Decision[]): V2State {
  return decisions.reduce(commitDecision, raw)
}

/** A row key is a queue key, or an unverified group key that stands for several single-evaluation queue keys. */
function keysOf(s: V2State, rowKey: string): string[] {
  if (!rowKey.startsWith("unv:")) return [rowKey]
  const [, evaluatorId, studentId] = rowKey.split(":")
  return queueItems(s).filter((i) => i.evaluatorId === evaluatorId && i.studentId === studentId && !i.submission).map((i) => i.key)
}

const ASSIGNABLE: ReadonlyArray<Person["kind"]> = ["preceptor", "lab-instructor", "faculty"]

/** People the row's evidence can be assigned to (see ItemDetail.assignTo). */
export function assignTargets(s: V2State, row: Pick<ReviewRowData, "skillIds" | "evaluatorId">, limit = 8): Person[] {
  const site = row.evaluatorId ? personById(s, row.evaluatorId)?.homeSiteId : undefined
  return evaluatorChoices(s, row.skillIds)
    .filter((c) => c.eligible && ASSIGNABLE.includes(c.person.kind) && c.person.verified !== false && c.person.id !== row.evaluatorId)
    .map((c) => c.person)
    .sort((a, b) => Number(b.homeSiteId === site && !!site) - Number(a.homeSiteId === site && !!site))
    .slice(0, limit)
}

/** The audit and student-facing note on evidence a reviewer sent to someone else. */
export const assignNote = sentForNewEvaluationLabel

/**
 * Assign to someone else (Oct 26 call, item 13; the RV-04 reassign pattern): the row's evidence goes to another evaluator as a new
 * request link, so it leaves Approvals and waits with that evaluator. Pure, on the held (lab) state.
 * - A row with a request (a submission, or a photo with no outcome yet): the same request goes back out to the new evaluator
 *   (status with-evaluator, the reassignment recorded, its completion cleared).
 * - Evidence from an unadopted name with no request: a new link request carries the same skills to the new evaluator.
 * The held evaluations stay on the record, never edited (RV-03), held out of counting (status "returned", the not-counting overlay
 * every count already honours) with the review decision stored as "reassigned" (decision D-X25: a handoff, not a return), so
 * exports and reports read "Sent for a new evaluation", never "Returned"; they do not show as a separate return to the student,
 * and the request is the one open thing. Nothing happens when the row
 * is gone or the person is not an adopted evaluator other than the current one.
 */
export function assignEntry(s: V2State, rowKey: string, toId: string): V2State {
  const keys = new Set(keysOf(s, rowKey))
  const items = queueItems(s).filter((i) => keys.has(i.key))
  // Qualified for every skill (the RV-04 rule of the Return dialog's "different evaluator"), and an evaluator, not a reviewer.
  const skillIds = [...new Set(items.flatMap((i) => i.skillIds))]
  const to = items.length ? assignTargets(s, { skillIds, evaluatorId: items[0].evaluatorId }, Infinity).find((p) => p.id === toId) : undefined
  if (!items.length || !to || items.some((i) => i.evaluatorId === toId)) return s
  const first = items[0]
  const fromId = first.evaluatorId ?? ""
  const note = assignNote(to.name)
  const reassignment = { at: DECIDED_AT, byId: REVIEWER_ID, fromId, toId, reason: note }
  const existing = items.find((i) => i.submission)?.submission ?? null
  let requestId: string
  let submissions: Submission[]
  if (existing) {
    requestId = existing.id
    submissions = s.submissions.map((y) => {
      if (y.id !== existing.id) return y
      const { completedById: _by, completedAt: _at, ...rest } = y
      return { ...rest, status: "with-evaluator" as const, assignedToId: toId, candidateIds: [toId], daysWaiting: 0, ...(to.homeSiteId ? { siteId: to.homeSiteId } : {}), reassignments: [...(y.reassignments ?? []), reassignment] }
    })
  } else {
    const stem = `asg-${rowKey.replace(/[^a-z0-9-]/gi, "-")}`
    const taken = new Set(s.submissions.map((y) => y.id))
    let n = 1
    requestId = stem
    while (taken.has(requestId)) requestId = `${stem}-${++n}`
    const request: Submission = {
      id: requestId,
      studentId: first.studentId,
      skillIds,
      method: "link",
      status: "with-evaluator",
      assignedToId: toId,
      candidateIds: [toId],
      createdAt: DECIDED_AT,
      daysWaiting: 0,
      ...(to.homeSiteId ? { siteId: to.homeSiteId } : {}),
      reassignments: [reassignment],
    }
    submissions = [...s.submissions, request]
  }
  const ids = new Set(items.flatMap((i) => i.evaluations.map((e) => e.id)))
  const evaluations = ids.size === 0 ? s.evaluations : s.evaluations.map((e) => (ids.has(e.id) ? { ...e, status: "returned" as const, submissionId: requestId, review: { decision: "reassigned" as const, byId: REVIEWER_ID, at: DECIDED_AT, note } } : e))
  const student = s.people.find((p) => p.id === first.studentId)?.name ?? "A student"
  return appendAudit({ ...s, submissions, evaluations }, REVIEWER_ID, "Assigned to someone else", `${student}: ${note}`, DECIDED_AT)
}

// ---------------------------------------------------------------------------------------------------------------------
// Queue rows

export interface ReviewRowData {
  key: string
  kind: "submission" | "unverified"
  studentId: string
  student: string
  cohort: string
  group: string
  skillIds: string[]
  skills: string[]
  evaluatorId: string | null
  evaluator: string
  evaluatorRole: string
  evaluatorUnverified: boolean
  courseId: string
  course: string
  setting: string
  location: string
  method: string
  /** For a group check-off only: the skill it records, for the note (lib/lab/course-checkoff.ts checkoffNote; not imported here,
   *  that module reaches lib/lab/configure and would form an import cycle). */
  checkoffSkill?: Skill
  since: string
  days: number
  aging: boolean
  reason: HoldReason
  reasons: HoldReason[]
  /** Why it is here, one plain line for the list (reasonText). */
  why: string
  /** Every cause explained for the review, primary first (reasonExplain). */
  because: Array<{ reason: HoldReason; text: string }>
  agreement: Agreement | "none"
  outcome: string
  revision: number
  /** Why it cannot be approved now, or null. */
  block: string | null
  /** Rows with the same key may be approved together; null means decide one by one. */
  likeKey: string | null
  evaluationIds: string[]
}

/**
 * Where the evidence was gathered, as one row subline (REQ AR-01: course, setting and location): "NURS 350 · Clinical, Inpatient ·
 * Mercy General". Every approvals variant prints this same line, so no variant drops a required fact.
 */
export const whereLine = (r: Pick<ReviewRowData, "course" | "setting" | "location">): string => [r.course, r.setting, r.location].filter(Boolean).join(" · ")

/** The evaluator and their role on one line (REQ AR-01), or the name alone when the role is not recorded. */
export const evaluatorLine = (r: Pick<ReviewRowData, "evaluator" | "evaluatorRole">): string => (r.evaluatorRole ? `${r.evaluator}, ${r.evaluatorRole}` : r.evaluator)

/** The skills of a row in full, for a title or accessible name when the cell shows "first and n more". */
export const skillsLine = (r: Pick<ReviewRowData, "skills">): string => r.skills.join(", ")

/**
 * The "Evaluator not assigned" submission that has waited longest (Oct 26 call, item 13): Admin Approvals B puts its Assign menu
 * on the count line, so the cause is an action, not only a number. Null when none waits for that reason.
 */
export const oldestUnassigned = <R extends Pick<ReviewRowData, "reason" | "days">>(rows: R[]): R | null => rows.filter((r) => r.reason === "new-evaluator").sort((a, b) => b.days - a.days)[0] ?? null

/** DataTable rows must be records. */
export type ReviewRow = ReviewRowData & Record<string, unknown>

/** How a held group check-off reads wherever a row says how its evidence arrived. */
export const CHECKOFF_METHOD = "Group check-off"

/** True when the row's evidence came from a group check-off on the course offering: no submission, no self-evaluation. */
export const isCheckoff = (r: Pick<ReviewRowData, "method">): boolean => r.method === CHECKOFF_METHOD

const METHOD_WORD: Record<string, string> = { qr: "QR code", link: "Link", handover: "Handed over", photo: "Photo of paper form" }

function courseOf(s: V2State, id: string): { id: string; code: string } {
  const c = (s.courses ?? []).find((x) => x.id === id) ?? (s.course.id === id ? s.course : undefined)
  return { id, code: c ? c.code : id }
}

function settingText(e: Evaluation | undefined): string {
  if (!e) return "Not recorded"
  if (e.setting === "clinical") return e.clinicalSetting ? `Clinical, ${e.clinicalSetting}` : "Clinical"
  return e.setting === "lab" ? "Lab" : "Simulation"
}

function outcomeOf(evals: Evaluation[], state: QueueItem["state"]): string {
  if (state === "needs-outcome") return "To enter"
  const set = new Set(evals.map((e) => e.outcome))
  if (set.size > 1) return "Mixed"
  const o = evals[0]?.outcome
  return o === "met" ? "Met" : o === "not-met" ? "Unmet" : "Not yet"
}

function agreementOf(cmp: Comparison[]): Agreement | "none" {
  if (cmp.some((c) => c.overall === "differed")) return "differed"
  if (cmp.some((c) => c.overall === "agreed")) return "agreed"
  return "none"
}

/** A comparison as shown: answers keep the program's labels, a stored legacy "Not met" reads "Unmet" (agreement is unchanged). */
export function shownComparison(c: Comparison): Comparison {
  return { ...c, rows: c.rows.map((r) => ({ ...r, student: outcomeWord(r.student), evaluator: outcomeWord(r.evaluator) })) }
}

function disagreeText(cmp: Comparison[]): string {
  const row = cmp.map(shownComparison).flatMap((c) => c.rows).find((r) => r.agreement === "differed")
  return row ? `On "${row.label}" the student said ${row.student}, the evaluator said ${row.evaluator}.` : "The student's and the evaluator's answers differ."
}

function baseRow(s: V2State, item: QueueItem, evaluations: Evaluation[], days: number): Omit<ReviewRowData, "key" | "kind" | "reason" | "reasons" | "why" | "because" | "likeKey"> {
  const student = personById(s, item.studentId)
  const evaluator = item.evaluatorId ? personById(s, item.evaluatorId) : undefined
  const first = evaluations[0]
  const cmp = evaluations.map((e) => compareEvaluation(s, e))
  return {
    studentId: item.studentId,
    student: student?.name ?? "A student",
    cohort: student?.cohort ?? "",
    group: student?.group ?? "",
    skillIds: item.skillIds,
    skills: item.skillIds.map((id) => skillById(s, id)?.name ?? capitalize(aNoun())),
    evaluatorId: item.evaluatorId,
    evaluator: evaluator?.name ?? (item.source === "paper-form" ? "Not named yet" : "An evaluator"),
    evaluatorRole: evaluator ? ROLE_LABEL[evaluator.kind] : "",
    evaluatorUnverified: evaluator?.verified === false,
    ...(() => {
      const c = courseOf(s, first?.courseId ?? s.course.id)
      return { courseId: c.id, course: c.code }
    })(),
    setting: settingText(first),
    location: first?.location ?? "Not recorded",
    method: item.submission ? (METHOD_WORD[item.submission.method] ?? item.submission.method) : item.source === "paper-form" ? "Paper form" : item.source === "checkoff" ? CHECKOFF_METHOD : "Evaluator form",
    ...(item.source === "checkoff" && !item.submission ? { checkoffSkill: skillById(s, item.skillIds[0] ?? "") } : {}),
    since: item.since,
    days,
    aging: days >= AGING_DAYS,
    agreement: agreementOf(cmp),
    outcome: outcomeOf(evaluations, item.state),
    revision: item.revision,
    block: item.state === "needs-outcome" ? "Enter the outcome from the paper form first." : null,
    evaluationIds: evaluations.map((e) => e.id),
  }
}

/** The skill names of a row, short: "Foley catheter insertion" or "Foley catheter insertion and 2 more". */
const skillsShort = (skills: string[]): string => (skills.length > 1 ? `${skills[0]} and ${skills.length - 1} more` : (skills[0] ?? `this ${skillNoun()}`))

/**
 * Why a row is in Approvals, in plain words (Romit 2026-10-27: "what rule requires approval? In the list, I can't interpret it").
 * The list prints this one line beside a small glyph; it names the skill or the person, never an internal term.
 */
export function reasonText(reason: HoldReason, row: Pick<ReviewRowData, "evaluator" | "skills">): string {
  if (reason === "paper") return "Paper form: outcome not entered yet"
  if (reason === "new-evaluator") return `${row.evaluator} is not on your evaluator list`
  if (reason === "disagree") return "Student and evaluator disagree"
  return `Approval required for ${skillsShort(row.skills)}`
}

/**
 * The same cause, explained once in the review: what holds it and what the reviewer can do. For "Approval required" it names the
 * setting that holds it (SC-15: the skill's configuration asks for approval before evidence counts).
 */
export function reasonExplain(reason: HoldReason, row: Pick<ReviewRowData, "evaluator" | "skills">, cmp: Comparison[]): string {
  if (reason === "paper") return "Enter the outcome from the paper form before you approve."
  if (reason === "new-evaluator") return `The student named ${row.evaluator}, who is not on your evaluator list yet.`
  if (reason === "disagree") return disagreeText(cmp)
  const names = row.skills.length ? row.skills.join(", ") : `This ${skillNoun()}`
  return `${names}: set to need approval before evidence counts.`
}

const rowsCache = new WeakMap<V2State, ReviewRow[]>()

/** One table row for one queue entry. Causes, age and grouping come from the entry (lib/v2/approvals.ts), never recomputed here. */
function rowOf(s: V2State, e: ApprovalEntry): ReviewRow {
  const merged: QueueItem = { ...e.item, skillIds: e.skillIds, evaluations: e.evaluations }
  const b = baseRow(s, merged, e.evaluations, e.days)
  const cmp = e.evaluations.map((x) => compareEvaluation(s, x))
  const row: ReviewRow = { ...b, key: e.key, kind: e.kind, reason: e.cause, reasons: e.causes, why: reasonText(e.cause, b), because: e.causes.map((c) => ({ reason: c, text: reasonExplain(c, b, cmp) })), likeKey: null }
  if (e.kind === "submission") row.likeKey = !row.block && e.cause === "rule" && row.outcome === "Met" ? "rule-met" : null
  return row
}

/** Every submission waiting for the reviewer, oldest first: one row per `approvalEntries` entry (evidence from one unadopted evaluator for one student is one row). */
export function reviewRows(state: V2State): ReviewRow[] {
  const hit = rowsCache.get(state)
  if (hit) return hit
  const s = heldState(state)
  const sorted = approvalEntries(s).map((e) => rowOf(s, e))
  rowsCache.set(state, sorted)
  return sorted
}

/**
 * The default list order on Approvals (UX critique 2026-10-26): oldest first, without letting one cause fill the first screen.
 * In the reference data every "Evaluator not assigned" row (17 to 264 days) is older than every rule, disagreement or paper row
 * (14 days or less), so a strict oldest-first list shows only that cause above the fold. Here each cause keeps oldest first and
 * the causes take turns, led by the cause holding the overall oldest row; so rows[0] is still the oldest submission and every
 * cause present shows within the first rows. Cause stays a filter or group (board C, the "Why held" column); "Waiting" stays
 * sortable for a strict age order. Same rows, same count: the order only.
 */
export function queueOrder(rows: readonly ReviewRow[]): ReviewRow[] {
  const byAge = (a: ReviewRow, b: ReviewRow) => (a.since < b.since ? -1 : a.since > b.since ? 1 : a.key.localeCompare(b.key))
  const groups = new Map<HoldReason, ReviewRow[]>()
  for (const r of [...rows].sort(byAge)) groups.set(r.reason, [...(groups.get(r.reason) ?? []), r])
  const lanes = [...groups.values()].sort((a, b) => byAge(a[0], b[0]))
  const out: ReviewRow[] = []
  for (let i = 0; out.length < rows.length; i++) for (const lane of lanes) if (lane[i]) out.push(lane[i])
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Scope (strategy/06 S8: term, cohort, group, course)

export interface TermWindow {
  name: string
  start: string
  end: string
}

/** The scope's term (one lookup, lib/v2/filters findTerm: id, name or slug; empty means current). */
export function termWindow(s: V2State, scope: LabScope): TermWindow | null {
  const t = findTerm(s, scope.term)
  return t ? { name: t.name, start: t.start, end: t.end } : null
}

export interface ScopedQueue {
  rows: ReviewRow[]
  /** Rows the term hides that still wait (older terms). */
  earlier: number
  earlierTerm: string | null
  total: number
}

/** The rows in scope: exactly the entries `approvalsInScope` keeps, so the badge, the dashboard figure and this list agree. */
export function scopeRows(s: V2State, rows: ReviewRow[], scope: LabScope): ScopedQueue {
  const q = approvalsInScope(s, scope)
  const keep = new Set(q.entries.map((e) => e.key))
  return { rows: rows.filter((r) => keep.has(r.key)), earlier: q.earlier, earlierTerm: q.earlierTerm, total: rows.length }
}

// ---------------------------------------------------------------------------------------------------------------------
// Summary strip (thin dashboard header)

export interface QueueSummary {
  submissions: number
  evaluations: number
  oldestDays: number
  medianDays: number
  aging: number
  overNudge: number
  byReason: Record<HoldReason, number>
}

export function summarize(rows: ReviewRow[]): QueueSummary {
  const days = rows.map((r) => r.days).sort((a, b) => a - b)
  const mid = days.length === 0 ? 0 : days.length % 2 ? days[(days.length - 1) / 2] : Math.round((days[days.length / 2 - 1] + days[days.length / 2]) / 2)
  const byReason = { "new-evaluator": 0, rule: 0, disagree: 0, paper: 0 } as Record<HoldReason, number>
  for (const r of rows) byReason[r.reason]++
  return {
    submissions: rows.length,
    evaluations: rows.reduce((n, r) => n + Math.max(1, r.evaluationIds.length), 0),
    oldestDays: days.length ? days[days.length - 1] : 0,
    medianDays: mid,
    aging: rows.filter((r) => r.aging).length,
    overNudge: rows.filter((r) => r.days > NUDGE_DAYS).length,
    byReason,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Board (variant C): one column per reason; anything 8+ days old goes to Aging so the oldest work is one column

export type BoardColumnId = "new-evaluator" | "rule" | "disagree" | "aging"
export const BOARD_COLUMNS: Array<{ id: BoardColumnId; label: string; icon: string }> = [
  { id: "new-evaluator", label: REASON_META["new-evaluator"].label, icon: REASON_META["new-evaluator"].icon },
  { id: "rule", label: REASON_META.rule.label, icon: REASON_META.rule.icon },
  { id: "disagree", label: REASON_META.disagree.label, icon: REASON_META.disagree.icon },
  { id: "aging", label: `Aging ${AGING_DAYS}+ days`, icon: "fa-clock" },
]

/** Paper forms have no column of their own: they sit with the rule they wait under, flagged by their own badge. */
export function boardColumn(r: ReviewRow): BoardColumnId {
  if (r.aging) return "aging"
  if (r.reason === "paper") return "rule"
  return r.reason
}

export function boardColumns(rows: ReviewRow[]): Record<BoardColumnId, ReviewRow[]> {
  const out: Record<BoardColumnId, ReviewRow[]> = { "new-evaluator": [], rule: [], disagree: [], aging: [] }
  for (const r of rows) out[boardColumn(r)].push(r)
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Bulk approve (like rows only; blocked rows named before confirm)

export interface BulkCheck {
  /** Every selected row has the same reason and outcome, so one decision fits all. */
  alike: boolean
  approvable: ReviewRow[]
  blocked: Array<{ row: ReviewRow; reason: string }>
}

export function bulkCheck(rows: ReviewRow[], selected: ReadonlySet<string | number>, gone: ReadonlySet<string> = new Set()): BulkCheck {
  const chosen = rows.filter((r) => selected.has(r.key))
  const keys = new Set(chosen.map((r) => r.likeKey ?? `solo:${r.key}`))
  const blocked: BulkCheck["blocked"] = []
  const approvable: ReviewRow[] = []
  for (const r of chosen) {
    if (gone.has(r.key)) blocked.push({ row: r, reason: `${REVIEWER_COLLEAGUE} approved it a moment ago, so it has left the queue.` })
    else if (r.block) blocked.push({ row: r, reason: r.block })
    else if (!r.likeKey) blocked.push({ row: r, reason: `${r.why}: decide it on its own.` })
    else approvable.push(r)
  }
  return { alike: chosen.length > 0 && keys.size === 1 && !keys.values().next().value?.startsWith("solo:"), approvable, blocked }
}

/** The colleague named in the bulk partial failure demo (`?state=partial`). */
export const REVIEWER_COLLEAGUE = "B. Khalil"

// ---------------------------------------------------------------------------------------------------------------------
// Review item

export interface RuleCheck {
  skillId: string
  skill: string
  before: SkillProgress | null
  after: SkillProgress | null
  /** Approving makes the skill achieved. */
  flips: boolean
  /** Achieved before approval, so this evaluation is extra evidence. */
  already: boolean
  /** The rule in numbers, after approval: "4 of 4". */
  numbers: string
  /** What is still missing after approval, in plain words. */
  missing: string[]
}

/** What approving would do to each skill in the row, from the engine (never the evaluator) [REQ AE-02, AR-06]. */
export function ruleCheck(state: V2State, row: ReviewRow): RuleCheck[] {
  // A paper form has no outcome yet, so approval would change nothing: say nothing rather than "moves to 0 of 3".
  if (row.block) return []
  const after = approveRow(state, row)
  return row.skillIds.map((id) => {
    const b = skillProgress(state, row.studentId, id)
    const a = skillProgress(after, row.studentId, id)
    return {
      skillId: id,
      skill: skillById(state, id)?.name ?? capitalize(aNoun()),
      before: b,
      after: a,
      flips: !!a?.achieved && !b?.achieved,
      already: !!b?.achieved,
      numbers: a ? `${Math.min(a.counted, a.need)} of ${a.need}` : "No rule",
      missing: a?.left ?? [],
    }
  })
}

function approveRow(state: V2State, row: ReviewRow): V2State {
  const keys = keysOf(state, row.key)
  if (row.block) return state
  const r = approveItems(state, keys, REVIEWER_ID, DECIDED_AT)
  return r.ok ? r.state : state
}

export interface ItemDetail {
  row: ReviewRow
  comparisons: Comparison[]
  evaluations: Evaluation[]
  evaluatorPerson: Person | null
  /** Others in the queue from the same evaluator (a backlog worth knowing about). */
  evaluatorInQueue: number
  /** Evaluators the correction may go to instead (RV-04). */
  otherEvaluators: Array<{ id: string; name: string; title: string }>
  /** Who "Assign to someone else" may send the evidence to: qualified, adopted preceptors, lab instructors and clinical faculty
   *  (not reviewers or directors), not the current evaluator; the evaluator's own site first. */
  assignTo: Array<{ id: string; name: string; title: string }>
  /** Existing evaluators a new name might be (merge targets): same site first. */
  mergeCandidates: Array<{ id: string; name: string; title: string }>
  feedback: string
  revisions: Array<{ at: string; by: string; reason: string; revision: number }>
  sentAt: string | null
  completedAt: string | null
}

export function itemDetail(state: V2State, rows: ReviewRow[], key: string): ItemDetail | null {
  const row = rows.find((r) => r.key === key)
  if (!row) return null
  const evaluations = row.evaluationIds.map((id) => state.evaluations.find((e) => e.id === id)).filter((e): e is Evaluation => !!e)
  const evaluatorPerson = row.evaluatorId ? (personById(state, row.evaluatorId) ?? null) : null
  const sub = row.kind === "submission" ? (state.submissions.find((x) => x.id === row.key) ?? null) : null
  const others = evaluatorChoices(state, row.skillIds).filter((c) => c.eligible && c.person.id !== row.evaluatorId && c.person.verified !== false).slice(0, 8)
  const site = evaluatorPerson?.homeSiteId
  const merge = state.people.filter((p) => p.kind === "preceptor" && p.verified !== false && p.id !== row.evaluatorId).sort((a, b) => Number(b.homeSiteId === site) - Number(a.homeSiteId === site)).slice(0, 6)
  return {
    row,
    comparisons: evaluations.map((e) => shownComparison(compareEvaluation(state, e))),
    evaluations,
    evaluatorPerson,
    evaluatorInQueue: row.evaluatorId ? rows.filter((r) => r.evaluatorId === row.evaluatorId).length : 0,
    otherEvaluators: others.map((c) => ({ id: c.person.id, name: c.person.name, title: c.person.title })),
    mergeCandidates: merge.map((p) => ({ id: p.id, name: p.name, title: p.title })),
    assignTo: assignTargets(state, row).map((p) => ({ id: p.id, name: p.name, title: p.title })),
    feedback: evaluations.map((e) => e.versions[e.versions.length - 1]?.detail?.feedback ?? "").find(Boolean) ?? "",
    revisions: (sub?.returns ?? []).map((r) => ({ at: r.at, by: personById(state, r.byId)?.name ?? "A reviewer", reason: r.reason, revision: r.revision })),
    sentAt: sub?.createdAt ?? null,
    completedAt: sub?.completedAt ?? evaluations[0]?.versions[0]?.at ?? null,
  }
}

/** Evidence story for the timeline variant: request, evaluator, answers, versions, waiting. Oldest first. */
export interface StoryStep {
  id: string
  at: string
  title: string
  detail: string
  icon: string
}

export function story(state: V2State, d: ItemDetail): StoryStep[] {
  const steps: StoryStep[] = []
  const r = d.row
  if (d.sentAt) steps.push({ id: "sent", at: d.sentAt, title: `${r.student} asked for a sign-off`, detail: `${r.method}, ${r.skills.length > 1 ? `${r.skills.length} ${skillNounPlural()}` : r.skills[0]}`, icon: "fa-paper-plane" })
  for (const rv of d.revisions) steps.push({ id: `ret-${rv.revision}`, at: rv.at, title: `Sent back to the student by ${rv.by}`, detail: rv.reason, icon: "fa-arrow-rotate-left" })
  for (const e of d.evaluations) {
    for (const v of e.versions) {
      steps.push({
        id: `${e.id}-v${v.version}`,
        at: v.at,
        title: v.version === 1 ? `${r.evaluator} ${isCheckoff(r) ? "recorded in a group check-off:" : "signed"} ${skillById(state, e.skillId)?.name ?? `the ${skillNoun()}`}` : `Version ${v.version} recorded`,
        detail: `${v.outcome === "met" ? "Met" : v.outcome === "not-met" ? "Unmet" : "Not yet"}${v.reason ? `. ${v.reason}` : ""}`,
        icon: v.version === 1 ? "fa-signature" : "fa-code-branch",
      })
    }
  }
  if (r.block) steps.push({ id: "photo", at: r.since, title: "Photo of the signed form arrived", detail: "Outcome not entered yet", icon: "fa-file-image" })
  steps.push({ id: "held", at: r.since, title: "Waiting for you", detail: REASON_META[r.reason].label, icon: "fa-hourglass-half" })
  return steps.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
}

// ---------------------------------------------------------------------------------------------------------------------
// Student record

export type RecordStatus = "Counted" | "Unmet" | "Not yet" | "Awaiting approval" | "Returned" | "Correction requested" | typeof SENT_FOR_NEW_EVALUATION_WORD

export interface RecordEvaluation extends Record<string, unknown> {
  id: string
  skillId: string
  skill: string
  date: string
  evaluator: string
  evaluatorUnverified: boolean
  setting: string
  status: RecordStatus
  /** In the queue under this key, when waiting. */
  queueKey: string | null
  version: number
}

export interface RecordSkill extends Record<string, unknown> {
  skillId: string
  skill: string
  category: string
  state: "Achieved" | "In progress" | "Evidence does not qualify" | "No evidence yet"
  numbers: string
  awaiting: number
}

export interface StudentRecordModel {
  studentId: string
  name: string
  cohort: string
  group: string
  evaluations: RecordEvaluation[]
  skills: RecordSkill[]
  counts: { counted: number; awaiting: number; returned: number; achieved: number; inProgress: number }
}

export function studentRecord(state: V2State, rows: ReviewRow[], studentId: string, corrections: ReadonlySet<string> = new Set()): StudentRecordModel | null {
  const p = personById(state, studentId)
  if (!p || p.kind !== "student") return null
  const queueKeyOf = new Map<string, string>()
  for (const r of rows) if (r.studentId === studentId) for (const id of r.evaluationIds) queueKeyOf.set(id, r.key)
  const evaluations: RecordEvaluation[] = evalsOfStudent(state, studentId)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) => {
      const ev = personById(state, e.evaluatorId)
      const status: RecordStatus = corrections.has(e.id)
        ? "Correction requested"
        : e.status === "awaiting-approval"
          ? "Awaiting approval"
          : sentElsewhereTo(state, e)
            ? SENT_FOR_NEW_EVALUATION_WORD
            : e.status === "returned" || e.status === "reopened"
            ? "Returned"
            : e.outcome === "met"
              ? "Counted"
              : e.outcome === "not-met"
                ? "Unmet"
                : "Not yet"
      return { id: e.id, skillId: e.skillId, skill: skillById(state, e.skillId)?.name ?? capitalize(aNoun()), date: e.date, evaluator: ev?.name ?? "An evaluator", evaluatorUnverified: ev?.verified === false, setting: settingText(e), status, queueKey: queueKeyOf.get(e.id) ?? null, version: e.currentVersion }
    })
  const hist = studentHistory(state, studentId)
  const skills: RecordSkill[] = hist.skills.map((h) => {
    const pr = h.progress
    const state4: RecordSkill["state"] = pr.achieved ? "Achieved" : pr.counted > 0 ? "In progress" : h.attempts.some((a) => a.kind === "did-not-meet" || a.kind === "not-yet") ? "Evidence does not qualify" : "No evidence yet"
    return { skillId: h.skill.id, skill: h.skill.name, category: h.skill.category, state: state4, numbers: `${pr.counted} of ${pr.need}`, awaiting: pr.awaiting }
  })
  return {
    studentId,
    name: p.name,
    cohort: p.cohort ?? "",
    group: p.group ?? "",
    evaluations,
    skills,
    counts: {
      counted: evaluations.filter((e) => e.status === "Counted").length,
      awaiting: evaluations.filter((e) => e.status === "Awaiting approval").length,
      returned: evaluations.filter((e) => e.status === "Returned").length,
      achieved: skills.filter((k) => k.state === "Achieved").length,
      inProgress: skills.filter((k) => k.state === "In progress").length,
    },
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Links (every name and count goes where it is acted on, with the scope)

export const approvalsHref = (scope: LabScope, extra: Record<string, string | undefined> = {}) => withScope(`${LAB_REVIEWER}/approvals`, scope, extra)
export const reviewItemHref = (scope: LabScope, key: string, variant?: string) => withScope(`${LAB_REVIEWER}/review-item`, scope, { item: key, variant })
export const recordHref = (scope: LabScope, studentId: string, extra: Record<string, string | undefined> = {}) => withScope(`${LAB_REVIEWER}/student-record`, scope, { student: studentId, ...extra })

export const daysLabel = (n: number) => (n === 0 ? "Today" : n === 1 ? "1 day" : `${n} days`)
export const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`

// ---------------------------------------------------------------------------------------------------------------------
// Students list (reviewer/students). Appended 2026-10-26. One row per student in the population for the scope (the same
// `populationRows` the dashboard, attainment and facts read, so the student count here equals every other screen), joined with
// the approval queue rows in scope (`scopeRows`, the same entries the nav badge and Approvals list). Nothing is recounted here.

export type Attention = "aging" | "approval" | "behind" | "none"
export const ATTENTION_ORDER: Attention[] = ["aging", "approval", "behind", "none"]
export const ATTENTION_LABEL: Record<Attention, string> = { aging: `Waiting ${AGING_DAYS}+ days`, approval: "Awaiting approval", behind: "Behind", none: "On track" }

export interface ReviewerStudentRow extends Record<string, unknown> {
  id: string
  name: string
  cohort: string
  group: string
  achieved: number
  required: number
  /** Behind under the scope basis (population row). */
  behind: boolean
  /** Evaluations short of the term clock (population row). */
  behindBy: number
  /** Queue rows in scope for this student, and the oldest wait. */
  waiting: number
  oldestDays: number
  /** Key of the oldest queue row, for a direct link to the review item. */
  oldestKey: string | null
  attention: Attention
  /** One plain line: what needs the reviewer, or that nothing does. */
  next: string
}

export interface ReviewerStudents {
  rows: ReviewerStudentRow[]
  /** Students per attention level (sums to rows.length; a behind student with a submission waiting is counted as waiting). */
  counts: Record<Attention, number>
  /** Behind and not behind, whatever waits: the same figures as the dashboard (facts.behind). */
  behind: number
  onTrack: number
  /** Students with at least one submission waiting for approval. */
  waitingStudents: number
  /** Queue rows in scope (equals the Approvals count for the same scope). */
  waitingTotal: number
  cohorts: Array<{ cohort: string; rows: ReviewerStudentRow[]; counts: Record<Attention, number>; behind: number; waitingStudents: number; onTrack: number }>
}

function attentionOf(waiting: number, oldest: number, behind: boolean): Attention {
  if (waiting > 0 && oldest >= AGING_DAYS) return "aging"
  if (waiting > 0) return "approval"
  return behind ? "behind" : "none"
}

function nextLine(a: Attention, waiting: number, oldest: number, behindBy: number): string {
  // One short data line per row (density: 3 words or fewer besides numbers, so a list of 20 rows does not read as prose).
  if (a === "aging" || a === "approval") return `${waiting} waiting, oldest ${daysLabel(oldest).toLowerCase()}`
  if (a === "behind") return behindBy > 0 ? `Behind by ${plural(behindBy, "evaluation", "evaluations")}` : "Below expected"
  return "Nothing needs you"
}

const emptyCounts = (): Record<Attention, number> => ({ aging: 0, approval: 0, behind: 0, none: 0 })
const splits = (list: ReviewerStudentRow[]) => ({ behind: list.filter((r) => r.behind).length, onTrack: list.filter((r) => !r.behind).length, waitingStudents: list.filter((r) => r.waiting > 0).length })

/** Reviewer students list for one scope: needs-attention first, then by name. `state` is the lab state with decisions applied. */
export function reviewerStudents(state: V2State, rows: ReviewRow[], scope: LabScope): ReviewerStudents {
  const pop = populationRows(state, scope)
  const queue = scopeRows(state, rows, scope).rows
  const byStudent = new Map<string, ReviewRow[]>()
  for (const r of queue) byStudent.set(r.studentId, [...(byStudent.get(r.studentId) ?? []), r])
  const out: ReviewerStudentRow[] = pop.rows.map((p) => {
    const mine = (byStudent.get(p.id) ?? []).slice().sort((a, b) => b.days - a.days)
    const oldest = mine[0]?.days ?? 0
    const attention = attentionOf(mine.length, oldest, p.behind)
    return {
      id: p.id,
      name: p.name,
      cohort: p.cohort,
      group: p.group ?? "",
      achieved: p.achieved,
      required: p.required,
      behind: p.behind,
      behindBy: p.behindBy,
      waiting: mine.length,
      oldestDays: oldest,
      oldestKey: mine[0]?.key ?? null,
      attention,
      next: nextLine(attention, mine.length, oldest, p.behindBy),
    }
  })
  const rank = (a: Attention) => ATTENTION_ORDER.indexOf(a)
  out.sort((a, b) => rank(a.attention) - rank(b.attention) || b.oldestDays - a.oldestDays || b.behindBy - a.behindBy || a.name.localeCompare(b.name))
  const counts = emptyCounts()
  for (const r of out) counts[r.attention]++
  const cohorts = [...new Set(out.map((r) => r.cohort))].sort().map((cohort) => {
    const list = out.filter((r) => r.cohort === cohort)
    const c = emptyCounts()
    for (const r of list) c[r.attention]++
    return { cohort, rows: list, counts: c, ...splits(list) }
  })
  return { rows: out, counts, ...splits(out), waitingTotal: queue.length, cohorts }
}

export const reviewerStudentsHref = (scope: LabScope, extra: Record<string, string | undefined> = {}) => withScope(`${LAB_REVIEWER}/students`, scope, extra)
