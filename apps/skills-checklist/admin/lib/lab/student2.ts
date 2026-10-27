import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { EVALUATION_STATUS_LABEL, OVERLAY_LABEL, SENT_FOR_NEW_EVALUATION_WORD, STUDENT_NOT_COUNTED, sentForNewEvaluationLabel } from "@/lib/v2/labels"
import { evalsOfStudent, personById, skillById, submissionsOfStudent } from "@/lib/v2/evidence-index"
import { evaluatorChoices, openToLog, ratingKind, ratingOptions, ruleSentence as ruleSentenceOf, sentElsewhereTo, skillProgress, whereOptions, type WhereOption } from "@/lib/v2/student"
import { verificationStatus } from "@/lib/v2/verification"
import { heldState } from "@/lib/v2/approvals"
import type { Evaluation, Person, Setting, SignoffMethod, Skill, Submission, SyncConflict, SyncState, V2State } from "@/lib/v2/types"
import { DEFAULT_STUDENT, OUTCOME_WORD, STUDENT_BASE, attemptCountLine, shortDate, shortfallSentence, submissionWhere, type SkillState, type StudentModel } from "./student"
import { capitalize, countSkills, skillNoun, skillNounPlural } from "./terms"
import type { LoggedSitting } from "./logged"

/**
 * Student lab model for Log a skill, Send for evaluation, Record, Share record, and Offline and sync. A pure function of the v2
 * state (read only, v2 selectors and the evidence index). Nothing here writes the shared store: the lab screens keep their own
 * local draft so a demo never changes another worker's data.
 *
 * Decided [LEDGER]: the submission is the record and the request is the message to the evaluator; one link per request, one
 * evaluator per request; several skills from one sitting are one request [REQ EV-05]; drafts are saved on the device first and
 * shown as queued, synced or conflict; nothing is lost; a skill locks on sign-off [REQ RV-05].
 */

export type Student2Demo = "loading" | "empty" | "error" | "offline" | "conflict" | "queued" | "synced" | "verified"
export const STUDENT2_DEMOS: Student2Demo[] = ["loading", "empty", "error", "offline", "conflict", "queued", "synced", "verified"]

const fmt = (n: number) => n.toLocaleString("en-US")

/** Links for these screens and the screens they hand off to (one helper, never hand-built hrefs). */
export type Student2Screen = "home" | "log-skill" | "request-signoff" | "my-requests" | "record" | "share-record" | "offline-sync" | "skill-detail" | "fix-returned"

export function student2Href(screen: Student2Screen, params: Record<string, string | undefined> = {}, studentId: string = DEFAULT_STUDENT): string {
  const q = new URLSearchParams()
  if (studentId !== DEFAULT_STUDENT) q.set("student", studentId)
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v)
  const s = q.toString()
  return `${STUDENT_BASE}/${screen}${s ? `?${s}` : ""}`
}

// ---------------------------------------------------------------------------------------------------------------------
// Program-defined submission details [REQ SC-13, ST-10]
//
// SkillConfig has no field list yet [AUDIT T2 P0-2], so the lab carries one program-level sample: label, data type and whether
// it is mandatory. [INFER] sample configuration, not shipped content. A program could add a choice list or a number.

export type DetailType = "date" | "short" | "long" | "number" | "choice"

export interface DetailField {
  id: string
  label: string
  type: DetailType
  required: boolean
  /** Format, limit or requirement only (strategy 02: 12 words). */
  helper?: string
  options?: string[]
}

export const PROGRAM_DETAILS: DetailField[] = [
  { id: "date", label: "Date performed", type: "date", required: true },
  { id: "unit", label: "Unit", type: "short", required: true },
  { id: "case", label: "Case reference", type: "short", required: false, helper: "No patient names." },
]

export type DetailValues = Record<string, string>

/** Mandatory details that are empty, by field id, with the message the field shows [REQ ST-10]. */
export function detailErrors(values: DetailValues, fields: DetailField[] = PROGRAM_DETAILS): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of fields) {
    const v = (values[f.id] ?? "").trim()
    if (f.required && !v) out[f.id] = `Enter the ${f.label.toLowerCase()}.`
    else if (f.type === "date" && v && v > DEMO_TODAY) out[f.id] = "The date cannot be in the future."
    else if (f.type === "number" && v && Number.isNaN(Number(v))) out[f.id] = "Enter a number."
  }
  return out
}

/**
 * Self-evaluation is asked only where the program switched it on for the skill [REQ SC-15, ST-11]. A configuration saved from the
 * lab carries the flag (SkillConfig.selfEvaluation) and it wins. The seed has no flag, so a seeded skill with program-named levels
 * still reads as switched on [INFER stand-in kept so seeded figures do not move].
 */
export function selfEvalEnabled(skill: Skill | undefined): boolean {
  if (!skill) return false
  if (typeof skill.config?.selfEvaluation === "boolean") return skill.config.selfEvaluation
  return ratingKind(skill) === "levels" && ratingOptions(skill).length > 0
}

// ---------------------------------------------------------------------------------------------------------------------
// What the evaluator will answer, as the program configured it (read only) [REQ EV-03, SC-04..SC-07; Thursday flow S2]

export interface EvaluationPreview {
  skillId: string
  name: string
  /** How the evaluator answers, in one plain line ("Met or Unmet", "Yes or No to each question", "A level"). */
  answer: string
  /** The questions, levels or outcome words the evaluator chooses from, in the program's own words and order. */
  items: string[]
  /** How many times, from the published rule ("You need 3 successful evaluations..."). */
  rule: string
  /** Facts the evaluator form enforces: feedback required, approval before it counts. */
  notes: string[]
}

/**
 * The set of questions the program configured for a skill, so the student sees exactly what the evaluator will answer before
 * sending (Sankalp's S2 step "reviewing the set of questions basis the configuration done by the admin"). Read only: nothing here
 * changes how the skill is evaluated [REQ EV-03]. Pure, from SkillConfig.
 */
export function evaluationPreview(skill: Skill): EvaluationPreview {
  const c = skill.config
  const kind = ratingKind(skill)
  const items = !c ? [] : kind === "questions" ? c.questions.filter((q) => q.trim()) : kind === "levels" ? c.levels.filter((l) => l.trim()) : c.outcomeLabels.filter((l) => l.trim())
  const [first, second] = items
  const answer = kind === "questions" ? "Yes or No to each question" : kind === "levels" ? "One level" : items.length === 2 ? `${first} or ${second}` : "An outcome"
  const notes: string[] = []
  if (c?.feedbackRequired) notes.push("Written feedback is required.")
  if (c?.approvalRequired) notes.push("A reviewer approves it before it counts.")
  return { skillId: skill.id, name: skill.name, answer, items, rule: c ? ruleSentenceOf(skill) : "", notes }
}

// ---------------------------------------------------------------------------------------------------------------------
// The skill picker: every configured skill in the program library, grouped by section, "Likely here" first [CALL soft mapping]

export interface PickRow {
  id: string
  name: string
  section: string
  likely: boolean
  /** Mandatory or non-mandatory on one of the student's current courses. Never a restriction [REQ CM-05, ST-02]. */
  onCourse: boolean
  required: boolean
  state: SkillState | null
  stateLabel: string | null
  /** Waiting with an evaluator or awaiting approval: it can still be logged again, as a further entry. */
  waiting: boolean
  selfEval: boolean
}

export interface PickGroup {
  key: string
  title: string
  rows: PickRow[]
}

export function pickRows(s: V2State, m: StudentModel): PickRow[] {
  const rec = new Map(m.all.map((r) => [r.id, r]))
  const out: PickRow[] = []
  for (const k of s.skills) {
    if (!openToLog(k)) continue
    const r = rec.get(k.id)
    out.push({ id: k.id, name: k.name, section: k.category, likely: !!r?.likely && r.state !== "achieved", onCourse: !!r && r.level !== "evidence", required: !!r?.required, state: r?.state ?? null, stateLabel: r?.label ?? null, waiting: !!r?.waiting, selfEval: selfEvalEnabled(k) })
  }
  return out.sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
}

/** Likely here, then every section alphabetically. A query matches the skill or its section, case-insensitive. */
export function pickerGroups(rows: PickRow[], query = ""): PickGroup[] {
  const q = query.trim().toLowerCase()
  const hit = (r: PickRow) => !q || r.name.toLowerCase().includes(q) || r.section.toLowerCase().includes(q)
  const likely = rows.filter((r) => r.likely && hit(r))
  const groups: PickGroup[] = likely.length ? [{ key: "likely", title: "Likely here", rows: likely }] : []
  const bySection = new Map<string, PickRow[]>()
  for (const r of rows) if (hit(r) && !(r.likely && likely.length)) bySection.set(r.section, [...(bySection.get(r.section) ?? []), r])
  for (const [section, list] of bySection) groups.push({ key: `sec-${section}`, title: section, rows: list })
  return groups
}

// ---------------------------------------------------------------------------------------------------------------------
// Where it happened: from the placement [REQ ST-05, ST-06, ST-07]

export interface WhereChoice extends WhereOption {
  /** The placement id for clinical choices. */
  placementId: string | null
}

/** Lab and simulation evidence is sent to a lab instructor or faculty [REQ ST-05, EV-02]; it still counts as a practice trial. */
const NON_CLINICAL_DESCRIPTION = "Signed off by a lab instructor or faculty."

export function whereChoices(s: V2State, studentId: string): WhereChoice[] {
  // One choice per place: placements repeat across terms with the same location and setting.
  const seen = new Set<string>()
  return whereOptions(s, studentId)
    .filter((w) => {
      const k = `${w.setting}|${w.clinicalSetting ?? ""}|${w.location ?? w.label}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .map((w) => ({ ...w, description: w.setting === "clinical" ? w.description : NON_CLINICAL_DESCRIPTION, placementId: w.value.startsWith("placement:") ? w.value.slice("placement:".length) : null }))
}

/**
 * The location to record with a choice [REQ ST-06, ST-07]: the placement's own location, the typed one when no placement is on
 * record (askLocation), or the typed one for lab and simulation (optional there).
 */
export function locationFor(w: WhereChoice | null | undefined, typed: string): string | null {
  if (!w) return null
  if (w.location) return w.location
  return typed.trim() || null
}

/** The location is mandatory only when no placement supplies it for clinical work [REQ ST-07]. */
export function locationError(w: WhereChoice | null | undefined, typed: string): string | null {
  return w?.askLocation && !typed.trim() ? "Enter the location, for example the unit or clinic name." : null
}

/** The setting in words for a confirmation or a record row: "Clinical, Inpatient", "Lab", "Simulation". */
export function settingWords(w: Pick<WhereChoice, "setting" | "clinicalSetting"> | null | undefined): string {
  if (!w) return "Not chosen"
  return w.setting === "clinical" ? `Clinical${w.clinicalSetting ? `, ${w.clinicalSetting}` : ""}` : w.setting === "lab" ? "Lab" : "Simulation"
}

/** One line for the lab or simulation rule, said once on the screen [AUDIT T2 cut: said three times in v2; REQ SC-12]. */
export const PRACTICE_LINE = "Lab and simulation evidence never counts toward a clinical setting."
export const SETTING_LINE = PRACTICE_LINE

// ---------------------------------------------------------------------------------------------------------------------
// The student's note: at most one narrative note per submission, kept apart from the evaluator's comment [REQ ST-12]

export const STUDENT_NOTE_MAX = 500
export const NOTE_LABEL = "Note for the evaluator (optional)"
export const NOTE_HELPER = "Kept apart from the evaluator's comment."

export function noteError(note: string): string | null {
  return note.length > STUDENT_NOTE_MAX ? `Keep the note under ${STUDENT_NOTE_MAX} characters.` : null
}

/**
 * The one note a request carries [REQ ST-12, EV-04]: the request's own `studentNote`, else the first non-empty note on the log
 * entries it carries (one entry note per skill can exist from older logs; only one is ever shown). Empty when none was written.
 */
export function studentNoteOf(s: V2State, sub: { studentNote?: string; entryIds?: string[] }): string {
  const own = (sub.studentNote ?? "").trim()
  if (own) return own
  for (const id of sub.entryIds ?? []) {
    const n = (s.logEntries.find((e) => e.id === id)?.note ?? "").trim()
    if (n) return n
  }
  return ""
}

// ---------------------------------------------------------------------------------------------------------------------
// Log hands its details to Send (one sitting, one request) [REQ ST-10, ST-12]

/** URL keys Log uses to hand the sitting to Send, so nothing typed is asked for twice. */
export const SEND_KEYS = ["skills", "where", "date", "unit", "case", "note", "loc"] as const
export type SendHandoff = Partial<Record<(typeof SEND_KEYS)[number], string>>

export function sendHandoff(h: SendHandoff): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const k of SEND_KEYS) out[k] = h[k]?.trim() ? (k === "note" ? h[k]!.slice(0, STUDENT_NOTE_MAX) : h[k]) : undefined
  return out
}

/**
 * The URL params Send opens with to continue a draft: the draft as saved, the course and step it was left on, plus `logged` (the
 * draft's id) so Send updates or sends that draft rather than making a second one. Nothing is typed twice.
 */
export function loggedHandoff(x: LoggedSitting): Record<string, string | undefined> {
  return { ...sendHandoff({ skills: x.skillIds.join(","), where: x.where, date: x.date, unit: x.unit, case: x.case, note: x.note, loc: x.location ?? "" }), course: x.course ?? undefined, step: x.step ?? undefined, logged: x.batchId }
}

// ---------------------------------------------------------------------------------------------------------------------
// Who signs off [REQ ST-08, ST-09, SC-16]

export interface EvaluatorOption {
  id: string
  name: string
  role: string
  /** Supervises at the placement's facility. */
  here: boolean
  eligible: boolean
  reason: string | null
  initials: string
}

const facilityOf = (location: string) => location.split(",")[0].trim()
const initialsOf = (name: string) =>
  name
    .replace(/,.*$/, "")
    .replace(/^Dr\.\s*/, "")
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

/**
 * Evaluators for a request carrying these skills, by where the skills were performed [REQ ST-08, ST-09, EV-02]:
 * - Clinical: preceptors at the placement's facility first, then faculty who qualify for every skill. An unqualified preceptor at
 *   the site is listed with the reason; a lab instructor is never offered.
 * - Lab or simulation: the program's recorded lab instructors first (an unqualified one is listed with the reason), then faculty
 *   who qualify; a preceptor is never offered.
 */
export function evaluatorsFor(s: V2State, skillIds: string[], placementLocation: string | null, setting: Setting = "clinical"): EvaluatorOption[] {
  if (setting !== "clinical") {
    const choices = skillIds.length ? evaluatorChoices(s, skillIds, setting) : evaluatorChoices(s, [], setting).map((c) => ({ ...c, eligible: true, reasons: [] }))
    return choices
      .filter((c) => c.person.kind !== "preceptor")
      .map((c) => ({ id: c.person.id, name: c.person.name, role: c.person.title, here: c.person.kind === "lab-instructor", eligible: c.eligible, reason: c.reasons[0] ?? null, initials: initialsOf(c.person.name) }))
      .sort((a, b) => Number(b.here) - Number(a.here) || Number(b.eligible) - Number(a.eligible) || a.name.localeCompare(b.name))
  }
  // Match by record: the placement's site and each preceptor's home site (Person.homeSiteId), same facility. Title text is
  // only the fallback for a typed location that names no site.
  const sites = s.sites ?? []
  const placeSite = placementLocation ? sites.find((x) => x.location === placementLocation) : undefined
  const facility = placeSite ? placeSite.facility : placementLocation ? facilityOf(placementLocation) : null
  const homeFacility = (p: { homeSiteId?: string }) => (p.homeSiteId ? sites.find((x) => x.id === p.homeSiteId)?.facility : undefined)
  const choices = skillIds.length ? evaluatorChoices(s, skillIds) : evaluatorChoices(s, []).map((c) => ({ ...c, eligible: true, reasons: [] }))
  const out: EvaluatorOption[] = []
  for (const c of choices) {
    const p = c.person
    if (p.kind === "lab-instructor") continue
    const here = !!facility && p.kind === "preceptor" && (placeSite ? homeFacility(p) === placeSite.facility : p.title.includes(facility))
    if (p.kind === "preceptor" && facility && !here) continue
    out.push({ id: p.id, name: p.name, role: p.title, here, eligible: c.eligible, reason: c.reasons[0] ?? null, initials: initialsOf(p.name) })
  }
  return out.sort((a, b) => Number(b.here) - Number(a.here) || Number(b.eligible) - Number(a.eligible) || a.name.localeCompare(b.name))
}

/** Someone not on record: name and email. Not yet recorded until a reviewer adds them [REQ ST-09; glossary: "Not yet recorded"]. */
export interface NewEvaluator {
  name: string
  email: string
}

export function newEvaluatorErrors(n: NewEvaluator): { name?: string; email?: string } {
  const out: { name?: string; email?: string } = {}
  if (n.name.trim().length < 2) out.name = "Enter their full name."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(n.email.trim())) out.email = "Enter an email address, for example name@hospital.org."
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// How it reaches them: one request, one evaluator, one link [LEDGER D-L2]

export interface MethodDef {
  id: SignoffMethod
  label: string
  icon: string
  /** Works with no connection: hand over and the paper photo queue on the device. */
  offline: boolean
  /** Needs the evaluator beside the student. */
  inPerson: boolean
}

/**
 * Email a link first and by default: the REQ path [REQ EV-01] and one link per request [LEDGER D-L2]. QR, hand over and the paper
 * photo stay as choices [LEDGER D-X5]; QR is fastest in person [COMP Snyder 2018] but needs the evaluator beside the student.
 */
export const METHODS: MethodDef[] = [
  { id: "link", label: "Email a link", icon: "fa-envelope", offline: false, inPerson: false },
  { id: "qr", label: "QR code", icon: "fa-qrcode", offline: false, inPerson: true },
  { id: "handover", label: "Hand over device", icon: "fa-mobile-screen", offline: true, inPerson: true },
  { id: "photo", label: "Photo of paper form", icon: "fa-camera", offline: true, inPerson: false },
]

export const methodById = (id: SignoffMethod): MethodDef => METHODS.find((m) => m.id === id) ?? METHODS[0]

/** The method a new request starts on [LEDGER D-L2]: an email with one link to this request only. */
export const DEFAULT_METHOD: SignoffMethod = "link"

/** True when any skill in the request is held for approval after the evaluator answers [REQ SC-15, EV-07]. */
export function needsApproval(s: V2State, skillIds: string[]): boolean {
  return skillIds.some((id) => skillById(s, id)?.config?.approvalRequired === true)
}

/** Compose screen: how an evaluator signs [REQ EV-01: no login]. */
export const NO_ACCOUNT_LINE = "Evaluators sign through a link, no account needed."

/**
 * The single "what happens next" sentence after Send [REQ ST-13, EV-07]. Said once, on the result. When it counts is not here: each
 * skill's own rule says it beside the skill (countsWhen), so a skill that needs 3 Met evaluations is never told "it counts when
 * they answer Met".
 */
export function nextSentence(opts: { method: SignoffMethod; who: string; approval: boolean; offline: boolean; newName: boolean }): string {
  if (opts.method === "photo") return `The photo goes to your program for review. ${opts.offline ? "It uploads when you reconnect. " : ""}It counts once a reviewer enters the outcome.`
  if (opts.offline && !methodById(opts.method).offline) return `Kept on this device. It goes to ${opts.who} when you reconnect.`
  const lead = opts.method === "qr" ? `${opts.who} scans the code and signs, no account needed.` : opts.method === "handover" ? `${opts.who} signs on this device, no account needed.` : `${opts.who} gets one email with a link to this request only.`
  return `${lead}${opts.newName ? " Your program records their name first." : ""}`
}

/**
 * When this request counts for one skill, from the skill's own rule and the student's counted evidence [REQ AE-02, SH-03, EV-07]:
 * "Met adds 1 of the 3 Met evaluations needed (1 so far)." Unmet parts beyond the count (different evaluators, a setting minimum)
 * and approval are named. Pending never counts, so "so far" reads counted evidence only [REQ AE-01].
 */
export function countsWhen(r: { counted: number; need: number; achieved: boolean; parts: Array<{ label: string; have: number; need: number; met: boolean }> }, approval: boolean): string {
  const after = approval ? ", after a reviewer approves it" : ""
  if (r.achieved) return `Already achieved. A Met answer is added to My evaluations${after}.`
  const extra = r.parts.filter((p) => !p.met && p.label !== "Evaluations").map((p) => (p.label === "Different evaluators" ? `from ${p.need} different evaluators` : `${p.need} in ${p.label}`))
  const base = r.need <= 1 ? "Met achieves it" : `Met adds 1 of the ${r.need} Met evaluations needed (${Math.min(r.counted, r.need)} so far)`
  return `${base}${extra.length ? `; also needs ${extra.join(" and ")}` : ""}${after}.`
}

/**
 * What was submitted, to whom, in what role, and in which setting and location [REQ ST-13], as label and value pairs for the
 * confirmation after Send. Every value is what the request carries; nothing is restated elsewhere on the result.
 */
export function confirmationLines(c: { skillNames: string[]; who: string; role: string; setting: string; location: string | null; date: string; note: string }): Array<{ label: string; value: string }> {
  const list = c.skillNames.length > 1 ? `${c.skillNames.slice(0, -1).join(", ")} and ${c.skillNames[c.skillNames.length - 1]}` : c.skillNames[0] ?? ""
  return [
    { label: capitalize(c.skillNames.length === 1 ? skillNoun() : skillNounPlural()), value: list },
    { label: "To", value: c.role ? `${c.who}, ${c.role}` : c.who },
    { label: "Setting", value: c.setting },
    { label: "Location", value: c.location ?? "Not recorded" },
    { label: "Date performed", value: c.date ? shortDate(c.date) : "Not recorded" },
    ...(c.note.trim() ? [{ label: "Your note", value: c.note.trim() }] : []),
  ]
}

// ---------------------------------------------------------------------------------------------------------------------
// Record: the student's evidence, with why each did or did not count [REQ SH-01..SH-07]

/**
 * "requested": a request with the evaluator, not answered yet (no evaluation exists). "waiting": a completed evaluation awaiting
 * approval. Both are outstanding [REQ SH-04], with "sent" (a reviewer's handoff to another evaluator).
 */
export type RecordResult = "counted" | "not-counted" | "requested" | "waiting" | "returned" | "sent"

/** "Did not count" is the student's word for an attempt that did not qualify (Unmet, or outside the rule); overlays are shared. */
export const RESULT_WORD: Record<RecordResult, string> = { counted: EVALUATION_STATUS_LABEL.counted, "not-counted": STUDENT_NOT_COUNTED, requested: OVERLAY_LABEL.waiting, waiting: OVERLAY_LABEL.awaitingApproval, returned: OVERLAY_LABEL.returned, sent: SENT_FOR_NEW_EVALUATION_WORD }

/** Results that are outstanding: not answered yet, awaiting approval, or sent to someone else for a new evaluation [REQ SH-04]. */
export const OUTSTANDING: RecordResult[] = ["requested", "waiting", "sent"]

export interface RecordRow {
  /** The evaluation id, or the request id for a request with no evaluation yet. */
  id: string
  /** The completed evaluation behind the row, which the student can open in full [REQ SH-07]; null for a request not answered. */
  evaluationId: string | null
  /**
   * What the figures count once [REQ SH-04]: the request for anything tied to an open or returned request, else the evaluation. A
   * request with two skills is one submission waiting, not two.
   */
  unit: string
  skillId: string
  skillName: string
  section: string
  date: string
  evaluatorName: string
  evaluatorRole: string
  settingKind: Setting
  setting: string
  courseId: string
  courseCode: string
  result: RecordResult
  answer: string
  /** Why it counted or did not, in numbers where it did not [REQ SH-03]. */
  why: string
  skillState: SkillState | null
  skillLabel: string | null
}

const settingText = (e: Evaluation) => (e.setting === "clinical" ? `Clinical, ${e.clinicalSetting ?? "setting not recorded"}` : e.setting === "lab" ? "Lab" : "Simulation")

export function recordRows(input: V2State, m: StudentModel): RecordRow[] {
  // The same held view My progress reads (evidence signed under an unadopted name waits for approval), so counts agree.
  const s = heldState(input)
  const studentId = m.student.id
  const evals = evalsOfStudent(s, studentId)
  const bySkill = new Map<string, Evaluation[]>()
  for (const e of evals) bySkill.set(e.skillId, [...(bySkill.get(e.skillId) ?? []), e])
  const courses = s.courses ?? [s.course, ...(s.otherCourses ?? [])]
  const rec = new Map(m.all.map((r) => [r.id, r]))
  const subs = submissionsOfStudent(s, studentId)
  const out: RecordRow[] = []
  for (const [skillId, list] of bySkill) {
    const skill = skillById(s, skillId)
    const p = skillProgress(s, studentId, skillId)
    if (!skill || !p) continue
    const used = new Set(p.used)
    for (const e of list) {
      const person = personById(s, e.evaluatorId)
      const courseId = e.courseId ?? s.course.id
      let result: RecordResult
      let why: string
      const sentTo = sentElsewhereTo(s, e)
      if (e.status === "awaiting-approval") {
        result = "waiting"
        why = "Completed. It counts once a reviewer approves it."
      } else if (sentTo) {
        // Assigned to another evaluator by a reviewer: a handoff, not a return (lib/v2/labels.ts).
        result = "sent"
        why = `${sentForNewEvaluationLabel(sentTo.name)}. It counts after they answer Met.`
      } else if (e.status === "returned" || e.status === "reopened") {
        result = "returned"
        why = e.review?.note ? `Returned: ${e.review.note}` : "Returned for correction. It does not count until corrected."
      } else if (used.has(e.id)) {
        result = "counted"
        why = e.setting === "clinical" && e.clinicalSetting && p.settings.some((x) => x.setting === e.clinicalSetting) ? `Counts toward the rule and toward ${e.clinicalSetting}.` : "Counts toward the rule."
      } else {
        result = "not-counted"
        const base = p.leftOut[e.id] ?? (e.outcome === "met" ? "Outside the rule's window of recent evaluations." : `The evaluator answered ${OUTCOME_WORD[e.outcome]}.`)
        why = p.achieved ? base : `${base.replace(/\.?$/, ".")} ${shortfallSentence(p)}`
      }
      // One unit per submission [REQ SH-04]: an outstanding evaluation belongs to its open request, a returned one to its returned
      // request; anything else (an older return on a request sent again, evidence with no request) is its own unit.
      const linked = e.submissionId ? subs.find((x) => x.id === e.submissionId) : undefined
      const unit = linked && ((OUTSTANDING.includes(result) && OPEN_SUB.includes(linked.status)) || (result === "returned" && linked.status === "returned")) ? linked.id : e.id
      out.push({
        id: e.id,
        evaluationId: e.id,
        unit,
        skillId,
        skillName: skill.name,
        section: skill.category,
        date: e.date,
        evaluatorName: person?.name ?? "An evaluator",
        evaluatorRole: person?.title ?? "Evaluator",
        settingKind: e.setting,
        setting: settingText(e),
        courseId,
        courseCode: courses.find((c) => c.id === courseId)?.code ?? "",
        result,
        answer: OUTCOME_WORD[e.outcome],
        why,
        skillState: rec.get(skillId)?.state ?? null,
        skillLabel: rec.get(skillId)?.label ?? null,
      })
    }
  }
  // Requests with no evaluation row yet [REQ SH-01, SH-04]: waiting with the evaluator, or returned before anyone answered. A request
  // already shown through one of its evaluations (awaiting approval, sent elsewhere, returned) is not listed twice.
  const shown = new Set(out.filter((r) => r.unit !== r.id).map((r) => r.unit))
  for (const x of subs) {
    const open = OPEN_SUB.includes(x.status)
    if ((!open && x.status !== "returned") || shown.has(x.id)) continue
    const skillId = x.skillIds[0]
    const skill = skillId ? skillById(s, skillId) : undefined
    if (!skill) continue
    const names = x.skillIds.map((id) => skillById(s, id)?.name).filter((n): n is string => !!n)
    const person = personById(s, x.assignedToId)
    const where = submissionWhere(s, x)
    const r = x.returns?.[x.returns.length - 1]
    const days = Math.max(x.daysWaiting, Math.round((Date.parse(`${DEMO_TODAY}T00:00:00Z`) - Date.parse(`${x.createdAt.slice(0, 10)}T00:00:00Z`)) / 86_400_000))
    out.push({
      id: x.id,
      evaluationId: null,
      unit: x.id,
      skillId,
      skillName: names.length > 1 ? `${names[0]} and ${names.length - 1} more` : names[0] ?? skill.name,
      section: skill.category,
      date: open ? x.createdAt : r?.at ?? x.createdAt,
      evaluatorName: person?.name ?? "An evaluator",
      evaluatorRole: person?.title ?? "Evaluator",
      settingKind: where.setting,
      setting: settingWords(where),
      courseId: s.course.id,
      courseCode: s.course.code,
      result: open ? "requested" : "returned",
      answer: open ? "Not answered yet" : OVERLAY_LABEL.returned,
      why: open
        ? x.status === "on-device"
          ? "Saved on this device, not sent yet. It counts after the evaluator answers Met."
          : `Waiting for ${person?.name ?? "the evaluator"}, ${days === 1 ? "1 day" : `${days} days`}. It counts after they answer Met.`
        : `Returned: ${r?.reason ?? "correction needed"}`,
      skillState: rec.get(skillId)?.state ?? null,
      skillLabel: rec.get(skillId)?.label ?? null,
    })
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.skillName.localeCompare(b.skillName)))
}

const OPEN_SUB: Submission["status"][] = ["on-device", "with-evaluator", "awaiting-review", "stalled"]

/**
 * The three Record figures [REQ SH-04]: submissions that counted, are outstanding (waiting with the evaluator, awaiting approval,
 * or sent to someone else) and were returned. Outstanding and returned count each request once, whatever number of skills it
 * carries, so they match My progress (lib/lab/student.ts counts) and the drill length (rows sharing a unit are one submission).
 */
export function recordFigures(rows: RecordRow[]): { counted: number; outstanding: number; returned: number } {
  const units = (pred: (r: RecordRow) => boolean) => new Set(rows.filter(pred).map((r) => r.unit)).size
  return { counted: rows.filter((r) => r.result === "counted").length, outstanding: units((r) => OUTSTANDING.includes(r.result)), returned: units((r) => r.result === "returned") }
}

export interface RecordFilter {
  q: string
  /** "outstanding" is the figure's filter: requested, awaiting approval and sent together [REQ SH-04]. */
  result: RecordResult | "outstanding" | "all"
  setting: Setting | "all"
  course: string | "all"
}

export const EMPTY_RECORD_FILTER: RecordFilter = { q: "", result: "all", setting: "all", course: "all" }

export function filterRecord(rows: RecordRow[], f: RecordFilter): RecordRow[] {
  const q = f.q.trim().toLowerCase()
  return rows.filter((r) => (f.result === "all" || r.result === f.result || (f.result === "outstanding" && OUTSTANDING.includes(r.result))) && (f.setting === "all" || r.settingKind === f.setting) && (f.course === "all" || r.courseId === f.course) && (!q || r.skillName.toLowerCase().includes(q) || r.evaluatorName.toLowerCase().includes(q) || r.section.toLowerCase().includes(q)))
}

export function recordCounts(rows: RecordRow[]): Record<RecordResult, number> {
  const out: Record<RecordResult, number> = { counted: 0, "not-counted": 0, requested: 0, waiting: 0, returned: 0, sent: 0 }
  for (const r of rows) out[r.result]++
  return out
}

/** Courses that appear in the record, for the course filter [REQ SH-06]. */
export function recordCourses(rows: RecordRow[]): Array<{ id: string; code: string; n: number }> {
  const m = new Map<string, { id: string; code: string; n: number }>()
  for (const r of rows) {
    const x = m.get(r.courseId) ?? { id: r.courseId, code: r.courseCode || "Other course", n: 0 }
    x.n++
    m.set(r.courseId, x)
  }
  return [...m.values()].sort((a, b) => b.n - a.n)
}

export interface SkillGroupRow {
  skillId: string
  skillName: string
  section: string
  state: SkillState | null
  label: string | null
  rows: RecordRow[]
  counted: number
  notCounted: number
  latest: string
}

export function groupBySkill(rows: RecordRow[]): SkillGroupRow[] {
  const m = new Map<string, SkillGroupRow>()
  for (const r of rows) {
    const g = m.get(r.skillId) ?? { skillId: r.skillId, skillName: r.skillName, section: r.section, state: r.skillState, label: r.skillLabel, rows: [], counted: 0, notCounted: 0, latest: r.date }
    g.rows.push(r)
    if (r.result === "counted") g.counted++
    if (r.result === "not-counted") g.notCounted++
    if (r.date > g.latest) g.latest = r.date
    m.set(r.skillId, g)
  }
  return [...m.values()].sort((a, b) => b.notCounted - a.notCounted || (a.latest < b.latest ? 1 : -1))
}

/**
 * "5 attempts, 3 count" for one skill on the record [CALL 10-26 B.4]: the published rule through the one engine (the same counts
 * the skill page shows, lib/lab/student.ts attemptCountLine), never a count of rows. Compact on the record: the breakdown and the
 * question sentence live on the skill page (density budget at 375). Waiting and returned evaluations are not attempts yet.
 */
export function recordAttemptLine(state: V2State, studentId: string, skillId: string): string {
  return attemptCountLine(state, studentId, skillId, { compact: true })
}

/** Month buckets for the chronological view: "October 2026". */
export function groupByMonth(rows: RecordRow[]): Array<{ key: string; label: string; rows: RecordRow[] }> {
  const m = new Map<string, RecordRow[]>()
  for (const r of rows) m.set(r.date.slice(0, 7), [...(m.get(r.date.slice(0, 7)) ?? []), r])
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([key, list]) => ({ key, label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }), rows: list }))
}

// ---------------------------------------------------------------------------------------------------------------------
// Share record: what leaves the program, attested by evaluators, gaps stated [glossary: verification is INFER, kept as v2 scope]

export interface Attestation {
  evaluationId: string
  evaluatorName: string
  evaluatorRole: string
  date: string
  setting: string
}

export interface ShareSkill {
  id: string
  name: string
  section: string
  attestations: Attestation[]
}

export interface ShareGap {
  id: string
  name: string
  label: string
}

export interface ShareModel {
  status: "not-verified" | "verified" | "changed"
  statusLabel: string
  verifiedBy: string | null
  verifiedAt: string | null
  /** Why sharing is closed, or null when it is open. */
  blocked: string | null
  skills: ShareSkill[]
  gaps: ShareGap[]
  /** What stays inside the program, as counts. */
  withheld: Array<{ key: string; label: string }>
  evaluators: number
  evidence: number
}

export const EXPIRY_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const

export function expiryDate(days: number, from: string = DEMO_TODAY): string {
  const d = new Date(`${from}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function shareModel(s: V2State, m: StudentModel, demoVerified = false): ShareModel {
  const studentId = m.student.id
  const st = verificationStatus(s, studentId)
  const verified = demoVerified || st.status === "verified"
  const director = s.people.find((p) => p.kind === "director")
  const skills: ShareSkill[] = []
  const people = new Set<string>()
  for (const r of m.all.filter((x) => x.state === "achieved")) {
    const used = new Set(r.progress.used)
    const atts: Attestation[] = evalsOfStudent(s, studentId)
      .filter((e) => e.skillId === r.id && used.has(e.id))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((e) => {
        const p = personById(s, e.evaluatorId)
        people.add(e.evaluatorId)
        return { evaluationId: e.id, evaluatorName: p?.name ?? "An evaluator", evaluatorRole: p?.title ?? "Evaluator", date: e.date, setting: settingText(e) }
      })
    skills.push({ id: r.id, name: r.name, section: r.section, attestations: atts })
  }
  skills.sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
  const gaps = m.required.filter((r) => r.state !== "achieved").map((r) => ({ id: r.id, name: r.name, label: r.label }))
  const notCounted = recordRows(s, m).filter((r) => r.result !== "counted").length
  const notes = s.logEntries.filter((e) => e.studentId === studentId && (e.note.trim() || e.rating)).length
  const withheld = [
    { key: "attempts", label: `${fmt(notCounted)} attempts that did not count or are not final` },
    { key: "self", label: `${fmt(notes)} of your own notes and ratings` },
    { key: "feedback", label: "Evaluator comments" },
  ]
  const status: ShareModel["status"] = verified ? "verified" : st.status === "changed" ? "changed" : "not-verified"
  return {
    status,
    statusLabel: status === "verified" ? "Verified" : status === "changed" ? "Changed since verified" : "Not verified yet",
    verifiedBy: verified ? (st.latest ? personById(s, st.latest.byId)?.name ?? null : director?.name ?? null) : null,
    verifiedAt: verified ? (st.latest?.at ?? DEMO_TODAY) : null,
    blocked: verified ? null : status === "changed" ? "Your record changed after it was verified. Sharing opens when your director verifies it again." : "Sharing opens after your program director verifies your record.",
    skills,
    gaps,
    withheld,
    evaluators: people.size,
    evidence: skills.reduce((n, k) => n + k.attestations.length, 0),
  }
}

/** A CLR 2.0 shaped document from the share model [COMP rec 11]. Lab shape only: not signed. */
export function clrDocument(student: Person, share: ShareModel, issuedOn: string = DEMO_TODAY): Record<string, unknown> {
  return {
    "@context": ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json"],
    type: ["VerifiableCredential", "ClrCredential"],
    issuanceDate: issuedOn,
    credentialSubject: {
      type: ["ClrSubject"],
      identifier: student.email,
      name: student.name,
      verifiableCredential: share.skills.map((k) => ({
        type: ["VerifiableCredential", "AchievementCredential"],
        credentialSubject: { achievement: { name: k.name, criteria: { narrative: `${k.attestations.length} evaluator sign-offs` } } },
        evidence: k.attestations.map((a) => ({ type: ["Evidence"], name: `${a.evaluatorName}, ${a.setting}`, description: shortDate(a.date) })),
      })),
    },
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Offline and sync: every change on the device, as queued, synced or conflict. Nothing is lost.

export interface SyncRow {
  id: string
  label: string
  state: SyncState
  at: string
  detail: string
  conflict: SyncConflict | null
  href: string | null
}

export const SYNC_WORD: Record<SyncState, string> = { queued: "Queued", synced: "Synced", conflict: "Conflict", failed: "Not sent" }

/**
 * Sync rows for the student. Demo states reshape the same rows: `queued` and `offline` hold everything on the device,
 * `synced` shows everything sent, `conflict` keeps the seeded conflict.
 */
export function syncRows(s: V2State, studentId: string, demo: Student2Demo | null): SyncRow[] {
  const base: SyncRow[] = s.syncQueue
    .filter((i) => i.studentId === studentId)
    .map((i) => ({
      id: i.id,
      label: i.label,
      state: i.state,
      at: i.at,
      detail: i.state === "conflict" ? "Two versions of this note. Pick the one to keep." : i.state === "failed" ? (i.error ?? "It did not send. It is kept on this device.") : i.state === "queued" ? "Not sent yet." : "Reached your program.",
      conflict: i.conflict ?? null,
      href: i.entryId ? student2Href("log-skill", { entry: i.entryId }, studentId) : null,
    }))
  for (const x of submissionsOfStudent(s, studentId).filter((y) => y.status === "on-device")) {
    base.push({ id: `req-${x.id}`, label: `Request to ${personById(s, x.assignedToId)?.name ?? "an evaluator"}, ${countSkills(x.skillIds.length)}`, state: "queued", at: x.createdAt, detail: "Not sent yet.", conflict: null, href: null })
  }
  const order: Record<SyncState, number> = { conflict: 0, failed: 1, queued: 2, synced: 3 }
  const shaped = base.map((r) => {
    if (demo === "synced") return { ...r, state: "synced" as const, conflict: null, detail: "Reached your program." }
    if ((demo === "queued" || demo === "offline") && r.state === "synced") return { ...r, state: "queued" as const, detail: "Not sent yet." }
    return r
  })
  return shaped.sort((a, b) => order[a.state] - order[b.state] || (a.at < b.at ? 1 : -1))
}

export function syncCounts(rows: SyncRow[]): Record<SyncState, number> {
  const out: Record<SyncState, number> = { queued: 0, synced: 0, conflict: 0, failed: 0 }
  for (const r of rows) out[r.state]++
  return out
}

/** Choices for a conflict. A rating keeps one value, so "Keep both" only exists for a note. */
export function conflictChoices(c: SyncConflict): Array<{ id: "mine" | "theirs" | "both"; label: string }> {
  const out: Array<{ id: "mine" | "theirs" | "both"; label: string }> = [
    { id: "mine", label: "Keep this device" },
    { id: "theirs", label: `Keep ${c.theirsBy.replace(/^Your /, "your ")}` },
  ]
  if (c.field === "note") out.push({ id: "both", label: "Keep both" })
  return out
}
