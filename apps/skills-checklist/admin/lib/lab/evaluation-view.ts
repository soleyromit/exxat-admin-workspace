/**
 * One recorded evaluation, in full and read-only [REQ RP-07, AR-03, EV-04]: "which questions were answered Yes, what score was given
 * on each, the feedback, and the details the student supplied, not only a summary". Shared by every staff surface that opens an
 * evaluation (reviewer Student record, director Verification detail, the attainment evidence peek through the record link).
 *
 * The responses are the same rows the reviewer compares (lib/v2/queue.ts compareEvaluation), so the review item and this view can
 * never disagree. Nothing here writes: completed evaluations are immutable [REQ RV-03, RV-05]; a change is "Request a correction".
 *
 * Student note: read from `studentNote` on the request (or the evaluation, once stored there), then the log entry's own note, then
 * the self-evaluation note. Absent means nothing is shown; nothing is invented.
 */
import type { Evaluation, V2State } from "@/lib/v2/types"
import { compareEvaluation, ROLE_LABEL, type Comparison } from "@/lib/v2/queue"
import { studentContext } from "@/lib/v2/preceptor"
import { evalsOfStudentSkill, personById, skillById, submissionById } from "@/lib/v2/evidence-index"
import { OUTCOME_LABEL, outcomeWord } from "@/lib/v2/labels"
import { longDate } from "@/lib/v2/format"
import { capitalize, aNoun } from "./terms"

export interface EvaluationFact {
  label: string
  value: string
}

export interface EvaluationView {
  id: string
  skillId: string
  skill: string
  student: string
  /** The evaluator's outcome, in the program's outcome words (Met, Unmet, Not yet). */
  outcome: string
  /** Counted, Awaiting approval, Returned: where the record sits now. */
  status: string
  version: number
  facts: EvaluationFact[]
  /** Self versus evaluator, row by row, with every question, score, level and the outcome (AR-03). */
  comparison: Comparison
  /** True when the evaluator's answers were stored; false when only the outcome survives (older history). */
  recorded: boolean
  feedback: string
  /** What the student supplied with the request (setting, location, self-rating, any program fields). */
  supplied: EvaluationFact[]
  studentNote: string
  /** The reviewer's decision note, when one was written (AR-04). */
  reviewNote: string
}

const STATUS_WORD: Record<Evaluation["status"], string> = { counted: "Counted", "awaiting-approval": "Awaiting approval", returned: "Returned", reopened: "Returned" }

const settingText = (e: Evaluation): string => (e.setting === "clinical" ? (e.clinicalSetting ? `Clinical, ${e.clinicalSetting}` : "Clinical") : e.setting === "lab" ? "Lab" : "Simulation")

/** A string field another worker may add to a record (studentNote, datePerformed, values). Read without assuming it exists. */
function readString(o: unknown, key: string): string {
  if (!o || typeof o !== "object") return ""
  const v = (o as Record<string, unknown>)[key]
  return typeof v === "string" ? v.trim() : ""
}

function readValues(o: unknown): EvaluationFact[] {
  if (!o || typeof o !== "object") return []
  const v = (o as Record<string, unknown>).values
  if (!v || typeof v !== "object") return []
  return Object.entries(v as Record<string, unknown>)
    .filter(([, x]) => typeof x === "string" && x.trim())
    .map(([k, x]) => ({ label: k, value: String(x).trim() }))
}

export function evaluationView(s: V2State, evaluationId: string): EvaluationView | null {
  const e = s.evaluations.find((x) => x.id === evaluationId)
  if (!e) return null
  const skill = skillById(s, e.skillId)
  const student = personById(s, e.studentId)
  const evaluator = personById(s, e.evaluatorId)
  const sub = e.submissionId ? (submissionById(s, e.submissionId) ?? null) : null
  const entry = sub ? studentContext(s, sub, e.skillId) : null
  const c = compareEvaluation(s, e)
  const comparison: Comparison = { ...c, rows: c.rows.map((r) => ({ ...r, student: outcomeWord(r.student), evaluator: outcomeWord(r.evaluator) })) }
  const performed = readString(entry, "datePerformed") || readString(sub, "datePerformed") || readString(e, "datePerformed")
  const course = e.courseId ? s.courses?.find((x) => x.id === e.courseId) : undefined

  const facts: EvaluationFact[] = [
    { label: performed ? "Date performed" : "Evaluated", value: longDate(performed || e.date) },
    { label: "Evaluator", value: evaluator ? `${evaluator.name}, ${ROLE_LABEL[evaluator.kind]}` : "Not recorded" },
    { label: "Setting", value: settingText(e) },
    { label: "Location", value: e.location ?? entry?.location ?? "Not recorded" },
    ...(course ? [{ label: "Course", value: course.code }] : []),
    ...(e.source === "paper-form" ? [{ label: "Entered from", value: "Signed paper form" }] : []),
    ...(e.currentVersion > 1 ? [{ label: "Version", value: String(e.currentVersion) }] : []),
  ]

  const supplied: EvaluationFact[] = []
  if (entry) {
    supplied.push({ label: "Logged", value: longDate(entry.at) })
    if (entry.rating) supplied.push({ label: "Self-rating", value: outcomeWord(entry.rating) })
  } else if (e.self?.rating) {
    supplied.push({ label: "Self-rating", value: outcomeWord(e.self.rating) })
  }
  supplied.push(...readValues(entry), ...readValues(sub))

  const studentNote = readString(e, "studentNote") || readString(sub, "studentNote") || (entry?.note ?? "").trim() || (e.self?.note ?? "").trim()

  return {
    id: e.id,
    skillId: e.skillId,
    skill: skill?.name ?? capitalize(aNoun()),
    student: student?.name ?? "A student",
    outcome: OUTCOME_LABEL[e.outcome],
    status: STATUS_WORD[e.status],
    version: e.currentVersion,
    facts,
    comparison,
    recorded: c.recorded,
    feedback: c.feedback,
    supplied,
    studentNote,
    reviewNote: (e.review?.note ?? "").trim(),
  }
}

/**
 * Every evaluation of one student on one skill, newest first, in full. `countedOnly` matches a count of counted evaluations (the
 * director's Evidence count), so the list opened is as long as the figure that opened it.
 */
export function evaluationViewsFor(s: V2State, studentId: string, skillId: string, countedOnly = false): EvaluationView[] {
  return [...evalsOfStudentSkill(s, studentId, skillId)]
    .filter((e) => !countedOnly || e.status === "counted")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) => evaluationView(s, e.id))
    .filter((v): v is EvaluationView => !!v)
}
