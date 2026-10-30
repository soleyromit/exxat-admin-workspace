import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { OUTCOME_LABEL as SHARED_OUTCOME_LABEL, REVIEW_DECISION_LABEL, evaluationStatusLabel, outcomeWord } from "@/lib/v2/labels"
import { SETTING_LABEL } from "@/lib/v2/reports"
import { evalsOfSkill, evalsOfStudent, evalsOfStudentSkill, skillById } from "@/lib/v2/evidence-index"
import type { Evaluation, Outcome, V2State } from "@/lib/v2/types"
import { pipelineRecords, populationRows, RECORD_STATES, RECORD_STATE_LABEL, recordStateOf, type PipelineRecord, type Population, type RecordState } from "./dashboard"
import { graduationStageOf, isReportable, openRequests, REQUIRED_SET_LABEL } from "@/lib/v2/population"
import { skillProgress } from "@/lib/v2/student"
import { graduatingCohort, graduationSkillsIn } from "./director"
import { scopeQuery, SCOPE_LABEL, type LabScope, type ScopeKey } from "./scope"
import { capitalize, skillNoun, skillNounPlural } from "./terms"

/**
 * Attainment (REQ RP-02 to RP-06, RP-10; strategy/06 section 5.2; dashboard-concepts D "matrix explorer").
 *
 * One unit everywhere: a required skill record, one student in scope and one skill mandatory for them, read from the
 * dashboard's own `populationRows` and `pipelineRecords`, so the population, the "behind" flag (the single calculation in
 * lib/lab/dashboard.ts) and the four engine states [REQ AE-04; LEDGER D-L1] are the ones the Dashboard shows. Location and
 * setting recount first (RP-08) and pending never counts (AE-01), both inside those selectors.
 *
 * Views (RP-02 students, RP-03 skills, sections, RP-04 tags) are different roll-ups of the same records, so any count on any
 * view opens a peek of exactly that many records (RP-05, RP-06). The peek reference lives in the URL (`peek`).
 */

export type AttView = "students" | "skills" | "sections" | "tags"
export const ATT_VIEWS: AttView[] = ["students", "skills", "sections", "tags"]
export const isAttView = (v: string | null | undefined): v is AttView => ATT_VIEWS.includes(v as AttView)
export const ATT_PATH = "/lab/admin/attainment"
export const EXPORT_PATH = "/lab/admin/export"

export type StateCounts = Record<RecordState, number>
const zero = (): StateCounts => ({ achieved: 0, progress: 0, unqualified: 0, none: 0 })
const fmt = (n: number) => n.toLocaleString("en-US")
const pctOf = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))

export interface AttCell {
  achieved: number
  total: number
}

export interface AttStudent {
  id: string
  name: string
  cohort: string
  group: string | null
  /** The dashboard's single "behind" flag for the scope and basis. */
  behind: boolean
  total: number
  counts: StateCounts
  cells: Record<string, AttCell>
}

export interface AttSkill {
  skillId: string
  name: string
  section: string
  tags: string[]
  /** Students in scope it is mandatory for. */
  total: number
  counts: StateCounts
  achievedPct: number
}

export interface AttGroupRow {
  key: string
  label: string
  /** Distinct skills in the group. */
  skills: number
  /** Records (student x skill) in the group. */
  total: number
  counts: StateCounts
  achievedPct: number
}

// ---------------------------------------------------------------------------------------------------------------------
// Basis: which required set the records are read against (decision D-X12). The two sets are never mixed in one model.

export type RequiredSetKey = "thisTerm" | "toGraduate"
export const REQUIRED_SET_KEYS: RequiredSetKey[] = ["thisTerm", "toGraduate"]
/** The switch: "Required this term | Required to graduate", labels from lib/v2/population.ts REQUIRED_SET_LABEL. */
export const REQUIRED_SET_OPTIONS: Array<{ value: RequiredSetKey; label: string }> = REQUIRED_SET_KEYS.map((value) => ({ value, label: REQUIRED_SET_LABEL[value] }))
/**
 * URL parameter for the switch (`required=graduate`); absent means the default for the scope. Not `set`: that name is the
 * lab's option set (lib/lab/links.ts), and sharing it sent every attainment link to a wrong design.
 */
export const REQUIRED_SET_PARAM = "required"
export const requiredSetQuery = (k: RequiredSetKey): string => (k === "toGraduate" ? "graduate" : "term")
export function parseRequiredSet(v: string | null | undefined): RequiredSetKey | null {
  return v === "graduate" || v === "toGraduate" ? "toGraduate" : v === "term" || v === "thisTerm" ? "thisTerm" : null
}
/**
 * Default basis: "Required to graduate" when the scope is the graduating cohort (the director's question is graduation
 * readiness), otherwise "Required this term" (pace and attainment this term).
 */
export function defaultRequiredSet(state: V2State, scope: Pick<LabScope, "cohort">, today: string = DEMO_TODAY): RequiredSetKey {
  return scope.cohort && scope.cohort === graduatingCohort(state, today) ? "toGraduate" : "thisTerm"
}

/** Records against "Required to graduate": every student in the population x the graduation skills in scope (director readiness). */
function graduateRecords(state: V2State, pop: Population, scope: LabScope): PipelineRecord[] {
  const required = graduationSkillsIn(state, scope)
  const waits = new Map<string, { assignedToId: string; daysWaiting: number }>()
  for (const x of openRequests(state, pop.ids)) for (const k of x.skillIds) if (!waits.has(`${x.studentId}|${k}`)) waits.set(`${x.studentId}|${k}`, x)
  const names = new Map(state.people.map((p) => [p.id, p.name]))
  const out: PipelineRecord[] = []
  for (const r of pop.rows) {
    for (const k of required) {
      const pr = skillProgress(pop.evidenceState, r.id, k.id)
      const w = waits.get(`${r.id}|${k.id}`)
      out.push({ key: `${r.id}|${k.id}`, studentId: r.id, student: r.name, cohort: r.cohort, skillId: k.id, skill: k.name, section: k.category ?? "", state: recordStateOf(pr), counted: Math.min(pr?.counted ?? 0, pr?.need ?? 0), need: pr?.need ?? 0, waitingWith: w ? (names.get(w.assignedToId) ?? "Unknown evaluator") : null, waitingDays: w ? w.daysWaiting : null })
    }
  }
  return out
}

export interface AttainmentModel {
  /** The required set the records are read against (decision D-X12); `basisLabel` names it on screen. */
  basis: RequiredSetKey
  basisLabel: string
  pop: Population
  records: PipelineRecord[]
  /** Sections (skill categories) with a required skill in scope, lowest share achieved first. */
  sections: string[]
  students: AttStudent[]
  skills: AttSkill[]
  sectionRows: AttGroupRow[]
  tagRows: AttGroupRow[]
  /** Records whose skill carries more than one tag: they appear under each tag (RP-04 overlap). */
  multiTagged: number
  /** Records whose skill carries no tag (not in the Tags view). */
  untagged: number
  totals: StateCounts
  total: number
  behind: number
  /** The scope the model was built for: the export reads its category and tag filters (RP-10 "the full filtered scope"). */
  scope?: LabScope
}

function tally(recs: PipelineRecord[]): StateCounts {
  const c = zero()
  for (const r of recs) c[r.state]++
  return c
}

function groupRows(by: Map<string, PipelineRecord[]>): AttGroupRow[] {
  return [...by]
    .map(([key, recs]) => {
      const counts = tally(recs)
      return { key, label: key, skills: new Set(recs.map((r) => r.skillId)).size, total: recs.length, counts, achievedPct: pctOf(counts.achieved, recs.length) }
    })
    .sort((a, b) => a.achievedPct - b.achievedPct || a.label.localeCompare(b.label))
}

export function buildAttainment(state: V2State, scope: LabScope, today: string = DEMO_TODAY, opts: { basis?: RequiredSetKey } = {}): AttainmentModel {
  const basis = opts.basis ?? "thisTerm"
  const pop = populationRows(state, scope, today)
  const records = basis === "toGraduate" ? graduateRecords(state, pop, scope) : pipelineRecords(state, pop)
  const bySection = new Map<string, PipelineRecord[]>()
  const bySkill = new Map<string, PipelineRecord[]>()
  const byStudent = new Map<string, PipelineRecord[]>()
  const byTag = new Map<string, PipelineRecord[]>()
  let multiTagged = 0
  let untagged = 0
  for (const r of records) {
    bySection.set(r.section, [...(bySection.get(r.section) ?? []), r])
    bySkill.set(r.skillId, [...(bySkill.get(r.skillId) ?? []), r])
    byStudent.set(r.studentId, [...(byStudent.get(r.studentId) ?? []), r])
    const tags = skillById(state, r.skillId)?.tags ?? []
    if (tags.length > 1) multiTagged++
    if (tags.length === 0) untagged++
    for (const t of tags) byTag.set(t, [...(byTag.get(t) ?? []), r])
  }
  const sectionRows = groupRows(bySection)
  // Matrix order. Cohorts take different courses, so their sections differ. Rows go cohort by cohort (furthest behind first
  // inside each, the dashboard order) and columns go from the sections most students share to the fewest, so each cohort's
  // cells sit in one block instead of a checkerboard. Cohort stays a filter: this is order, not comparison lanes.
  const reach = new Map<string, number>()
  for (const [sec, recs] of bySection) reach.set(sec, new Set(recs.map((r) => r.studentId)).size)
  const sections = sectionRows.map((s) => s.key).sort((a, b) => (reach.get(b) ?? 0) - (reach.get(a) ?? 0) || sectionRows.findIndex((x) => x.key === a) - sectionRows.findIndex((x) => x.key === b))
  const rank = new Map(pop.rows.map((r, i) => [r.id, i]))
  const ordered = [...pop.rows].sort((a, b) => a.cohort.localeCompare(b.cohort) || (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
  const students: AttStudent[] = ordered.map((row) => {
    const recs = byStudent.get(row.id) ?? []
    const cells: Record<string, AttCell> = {}
    for (const r of recs) {
      const c = (cells[r.section] ??= { achieved: 0, total: 0 })
      c.total++
      if (r.state === "achieved") c.achieved++
    }
    const counts = tally(recs)
    // Under "Required to graduate" the flag is the director's "far behind" (decision D-X11), never the term pace, so the model
    // never mixes the two sets.
    const behind = basis === "toGraduate" ? graduationStageOf(recs.length - counts.achieved) === "far" : row.behind
    return { id: row.id, name: row.name, cohort: row.cohort, group: row.group, behind, total: recs.length, counts, cells }
  })
  // Under "Required to graduate" the order inside each cohort is most missing first (far behind at the top), so the director
  // sees who stands between the cohort and graduation before the complete records. Order only; no count changes.
  if (basis === "toGraduate") {
    const pos = new Map(students.map((s, i) => [s.id, i]))
    students.sort((a, b) => a.cohort.localeCompare(b.cohort) || (b.total - b.counts.achieved) - (a.total - a.counts.achieved) || (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0))
  }
  const skills: AttSkill[] = [...bySkill]
    .map(([skillId, recs]) => {
      const k = skillById(state, skillId)
      const counts = tally(recs)
      return { skillId, name: recs[0].skill, section: recs[0].section, tags: k?.tags ?? [], total: recs.length, counts, achievedPct: pctOf(counts.achieved, recs.length) }
    })
    // Ranked: most students not yet achieved first, then the lowest share.
    .sort((a, b) => b.total - b.counts.achieved - (a.total - a.counts.achieved) || a.achievedPct - b.achievedPct || a.name.localeCompare(b.name))
  return {
    basis,
    basisLabel: REQUIRED_SET_LABEL[basis],
    pop,
    records,
    sections,
    students,
    skills,
    sectionRows,
    tagRows: groupRows(byTag),
    multiTagged,
    untagged,
    totals: tally(records),
    total: records.length,
    behind: students.filter((r) => r.behind).length,
    scope,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Peek: the records behind any count, referenced from the URL so a pasted link reopens it.

export type PeekKind = "cell" | "student" | "skill" | "section" | "tag" | "all"
export interface PeekRef {
  kind: PeekKind
  /** Student id, skill id, section name or tag name ("" for all). */
  id: string
  /** For a cell: the section. */
  section?: string
  state?: RecordState
}

const SEP = "~"
export const peekParam = (p: PeekRef): string => [p.kind, p.id, p.section ?? "", p.state ?? ""].join(SEP)

export function parsePeek(raw: string | null | undefined): PeekRef | null {
  if (!raw) return null
  const [kind, id = "", section = "", st = ""] = raw.split(SEP)
  if (!["cell", "student", "skill", "section", "tag", "all"].includes(kind)) return null
  const state = (RECORD_STATES as string[]).includes(st) ? (st as RecordState) : undefined
  return { kind: kind as PeekKind, id, ...(section ? { section } : {}), ...(state ? { state } : {}) }
}

export interface PeekModel {
  title: string
  /** "2 of 4 achieved" or "38 records, in progress". */
  summary: string
  records: PipelineRecord[]
  /** True when the rows are one student's skills (evidence shown inline); false for many students. */
  oneStudent: boolean
  studentId: string | null
}

export function peekRecords(m: AttainmentModel, state: V2State, ref: PeekRef): PeekModel | null {
  let recs = m.records
  let title = ""
  if (ref.kind === "cell" || ref.kind === "student") {
    recs = recs.filter((r) => r.studentId === ref.id && (ref.kind === "student" || r.section === ref.section))
    const name = m.students.find((s) => s.id === ref.id)?.name ?? state.people.find((p) => p.id === ref.id)?.name
    if (!name) return null
    title = ref.kind === "cell" ? `${name}, ${ref.section}` : name
  } else if (ref.kind === "skill") {
    recs = recs.filter((r) => r.skillId === ref.id)
    title = skillById(state, ref.id)?.name ?? ref.id
  } else if (ref.kind === "section") {
    recs = recs.filter((r) => r.section === ref.id)
    title = ref.id
  } else if (ref.kind === "tag") {
    recs = recs.filter((r) => (skillById(state, r.skillId)?.tags ?? []).includes(ref.id))
    title = `Tag: ${ref.id}`
  } else title = `Required ${skillNounPlural()} in scope`
  if (ref.state) recs = recs.filter((r) => r.state === ref.state)
  const order: Record<RecordState, number> = { none: 0, unqualified: 1, progress: 2, achieved: 3 }
  recs = [...recs].sort((a, b) => order[a.state] - order[b.state] || a.student.localeCompare(b.student) || a.skill.localeCompare(b.skill))
  const oneStudent = ref.kind === "cell" || ref.kind === "student"
  const achieved = recs.filter((r) => r.state === "achieved").length
  const summary = ref.state
    ? `${fmt(recs.length)} ${recs.length === 1 ? "record" : "records"}, ${RECORD_STATE_LABEL[ref.state].toLowerCase()}`
    : `${fmt(achieved)} of ${fmt(recs.length)} achieved`
  return { title, summary, records: recs, oneStudent, studentId: oneStudent ? ref.id : null }
}

// ---------------------------------------------------------------------------------------------------------------------
// Evidence behind one record (RP-06, RP-07 in summary; the full evaluation opens on the student record).

/** Evaluator answers: the shared labels (lib/v2/labels.ts, default Met / Unmet / Not yet). */
export const OUTCOME_LABEL: Record<Outcome, string> = SHARED_OUTCOME_LABEL

export interface EvidenceRow {
  id: string
  date: string
  evaluator: string
  setting: string
  location: string
  outcome: string
  /** Counted, or the overlay that keeps it out ("Awaiting approval", "Returned"). */
  status: string
}

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
const settingOf = (e: Evaluation) => (e.setting === "clinical" ? `Clinical${e.clinicalSetting ? `, ${e.clinicalSetting}` : ""}` : SETTING_LABEL[e.setting])

export function recordEvidence(evidenceState: V2State, state: V2State, studentId: string, skillId: string): EvidenceRow[] {
  const names = new Map(state.people.map((p) => [p.id, p.name]))
  return [...evalsOfStudentSkill(evidenceState, studentId, skillId)]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) => ({
      id: e.id,
      date: dateLabel(e.date),
      evaluator: names.get(e.evaluatorId) ?? "Unknown evaluator",
      setting: settingOf(e),
      location: e.location ?? "No location recorded",
      outcome: OUTCOME_LABEL[e.outcome],
      status: evaluationStatusLabel(e.status),
    }))
}

// ---------------------------------------------------------------------------------------------------------------------
// Links: every count carries the scope in the URL.

export const attainmentHref = (scope: LabScope, extra: Record<string, string | undefined> = {}): string => {
  const q = scopeQuery(scope, extra)
  return q ? `${ATT_PATH}?${q}` : ATT_PATH
}

// ---------------------------------------------------------------------------------------------------------------------
// Export (REQ RP-10; OD-10 open on CSV versus Excel, so both are offered; strategy/06 section 3.7).

export type ExportFormat = "pdf" | "csv" | "xlsx"
export const EXPORT_FORMATS: ExportFormat[] = ["pdf", "csv", "xlsx"]

export interface ExportFormatDef {
  id: ExportFormat
  label: string
  icon: string
  /** One row per what. */
  unit: string
  contains: string[]
  excludes: string[]
}

/** The column list of the row-per-evaluation detail (CSV and Excel share it). */
export const detailColumns = (): string[] => ["Student", "Cohort", "Group", capitalize(skillNoun()), "Section", "Date", "Evaluator", "Setting", "Location", "Outcome", "Status", "Feedback", "Self-rating", "Self-evaluation note", "Review decision", "Review note", "Required"]

export function exportFormats(): ExportFormatDef[] {
  // REQ RP-10 names feedback, settings, locations, self-evaluations and review notes for the row-per-evaluation detail, so
  // the detail carries them (LEDGER D-X13; the v2 D36 proposal to leave self-ratings out is overruled by REQ). The signed
  // PDF stays the aggregate summary of the view. CSV versus a native Excel workbook is OD-10, open: both are offered.
  return [
    { id: "pdf", label: "Signed PDF", icon: "fa-file-pdf", unit: "summary", contains: ["The view on screen as a table", "Scope, basis and as-of time", "A signature block"], excludes: ["Individual evaluations", "Feedback text", "Self-evaluations", "Review notes"] },
    { id: "csv", label: "CSV", icon: "fa-file-csv", unit: "evaluation", contains: ["One row per evaluation", "Evaluator, setting, location and outcome", "Feedback, self-evaluation and review note", "The filters that produced it, in the first rows"], excludes: ["Evaluations outside the scope on screen"] },
    { id: "xlsx", label: "Excel", icon: "fa-file-excel", unit: "evaluation", contains: ["The same rows as CSV", "The filters on their own sheet", "A second sheet with the view on screen"], excludes: ["Evaluations outside the scope on screen"] },
  ]
}

/** OD-10 (CSV or a native Excel workbook) is open: the screens show both and flag the choice. Never treat it as decided. */
export const FORMAT_DECISION_PENDING = "Which of CSV and Excel the product ships is not decided yet. Both are offered so each can be tried."

export interface DetailRow {
  student: string
  cohort: string
  group: string
  skill: string
  section: string
  date: string
  evaluator: string
  setting: string
  location: string
  outcome: string
  status: string
  feedback: string
  /** The student's self-rating sent with the request (RP-10), or "" when none was given. */
  selfRating: string
  selfNote: string
  review: string
  /** The reviewer's note on the latest approve or return (RP-10 "review notes"). */
  reviewNote: string
  /** "Yes" when the evaluation sits on a record in the required set the view reads, "No" for any other skill in scope. */
  required: string
}

/**
 * Every evaluation in the filtered scope (REQ RP-10 "An export must cover the full filtered scope"): first the evaluations on
 * required records, then those on any other reportable skill for the same students that the category and tag filters let in.
 * All after the location and setting recount (RP-08), so the file matches the evidence the figures read. The "Required" column
 * says which is which, so no reader mistakes an extra skill for one the figures count.
 */
export function detailRows(m: AttainmentModel, state: V2State): DetailRow[] {
  const names = new Map(state.people.map((p) => [p.id, p]))
  // Self-evaluation: stored on the evaluation when the request carried one; otherwise the log entry the request was sent from.
  const subs = new Map((state.submissions ?? []).map((x) => [x.id, x]))
  const entries = new Map((state.logEntries ?? []).map((x) => [x.id, x]))
  const selfOf = (e: Evaluation): { rating: string; note: string } => {
    // A stored legacy "Not met" self-rating is written as the default "Unmet" (lib/v2/labels.ts outcomeWord).
    if (e.self) return { rating: outcomeWord(e.self.rating), note: e.self.note }
    const sub = e.submissionId ? subs.get(e.submissionId) : undefined
    const entry = (sub?.entryIds ?? []).map((id) => entries.get(id)).find((x) => x && x.skillId === e.skillId)
    return entry ? { rating: outcomeWord(entry.rating), note: entry.note } : { rating: "", note: "" }
  }
  const row = (e: Evaluation, who: { student: string; cohort: string; studentId: string }, skill: { name: string; section: string }, required: boolean): DetailRow => {
    const latest = e.versions[e.versions.length - 1]
    const self = selfOf(e)
    return {
      student: who.student,
      cohort: who.cohort,
      group: names.get(who.studentId)?.group ?? "",
      skill: skill.name,
      section: skill.section,
      date: e.date.slice(0, 10),
      evaluator: names.get(e.evaluatorId)?.name ?? "Unknown evaluator",
      setting: settingOf(e),
      location: e.location ?? "",
      outcome: OUTCOME_LABEL[e.outcome],
      // Held evidence sent to another evaluator is a handoff (decision D-X25), so it never exports as "Returned".
      status: e.review?.decision === "reassigned" ? REVIEW_DECISION_LABEL.reassigned : evaluationStatusLabel(e.status),
      feedback: latest?.detail?.feedback ?? "",
      selfRating: self.rating,
      selfNote: self.note,
      review: e.review ? REVIEW_DECISION_LABEL[e.review.decision] : "",
      reviewNote: e.review?.note ?? "",
      required: required ? "Yes" : "No",
    }
  }
  const out: DetailRow[] = []
  const onRecord = new Set<string>()
  for (const r of m.records) {
    onRecord.add(`${r.studentId}|${r.skillId}`)
    for (const e of evalsOfStudentSkill(m.pop.evidenceState, r.studentId, r.skillId)) out.push(row(e, { student: r.student, cohort: r.cohort, studentId: r.studentId }, { name: r.skill, section: r.section }, true))
  }
  const cat = m.scope?.cat
  const tag = m.scope?.tag
  for (const sr of m.pop.rows) {
    for (const e of evalsOfStudent(m.pop.evidenceState, sr.id)) {
      if (onRecord.has(`${sr.id}|${e.skillId}`)) continue
      const k = skillById(state, e.skillId)
      if (!k || !isReportable(k)) continue
      if (cat && k.category !== cat) continue
      if (tag && !(k.tags ?? []).includes(tag)) continue
      out.push(row(e, { student: sr.name, cohort: sr.cohort, studentId: sr.id }, { name: k.name, section: k.category }, false))
    }
  }
  return out
}

/** The filter lines an export records (RP-10: "record the filters that produced it"). */
export function scopeLines(scope: LabScope, termName: string, basisLabel: string, asOf: string, label: (k: ScopeKey, v: string) => string): string[] {
  const lines = [`Term: ${termName}`]
  for (const k of ["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]) {
    const v = scope[k]
    if (v) lines.push(`${SCOPE_LABEL[k]}: ${label(k, v)}`)
  }
  lines.push(`Compare with: ${basisLabel}`, `As of ${asOf}`)
  return lines
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

export function toCsv(rows: DetailRow[], header: string[]): string {
  const lines = header.map((h) => csvCell(h))
  lines.push(csvCell(`Rows (one per evaluation): ${rows.length}`))
  lines.push("")
  lines.push(detailColumns().join(","))
  for (const r of rows) lines.push([r.student, r.cohort, r.group, r.skill, r.section, r.date, r.evaluator, r.setting, r.location, r.outcome, r.status, r.feedback, r.selfRating, r.selfNote, r.review, r.reviewNote, r.required].map(csvCell).join(","))
  return lines.join("\n")
}

/** Rows the summary (PDF) carries for a view: what the table on screen holds. */
export function summaryRows(m: AttainmentModel, view: AttView): number {
  return view === "students" ? m.students.length : view === "skills" ? m.skills.length : view === "sections" ? m.sectionRows.length : m.tagRows.length
}

// ---------------------------------------------------------------------------------------------------------------------
// Skills tab: "Required this term" (default) or "All skills" (LEDGER D-X16). The required set is the one every figure
// uses; "All skills" adds the published skills nobody in scope needs this term, as rows with no state counts (they hold
// no required record), so 143 skills are not hidden and no figure changes.

export type SkillsScope = "required" | "all"
export const isSkillsScope = (v: string | null | undefined): v is SkillsScope => v === "required" || v === "all"

export interface UnrequiredSkill {
  skillId: string
  name: string
  section: string
  /** Evaluations recorded on it for students in scope (any term). Not a figure: context for "why is this here". */
  evaluations: number
}

export function unrequiredSkills(state: V2State, m: AttainmentModel): UnrequiredSkill[] {
  const required = new Set(m.skills.map((k) => k.skillId))
  const ids = m.pop.ids
  return state.skills
    .filter((k) => k.published && k.configured && !required.has(k.id))
    .map((k) => ({ skillId: k.id, name: k.name, section: k.category, evaluations: evalsOfSkill(m.pop.evidenceState, k.id).filter((e) => ids.has(e.studentId)).length }))
    .sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
}
