/**
 * Drafts: a submission saved before sending (Romit 2026-10-27: "can't we merge Log a skill with My requests"; ledger D-L10).
 *
 * "Save for later" in Send for evaluation saves the request as the student left it (skills, where, date, details, the one note,
 * self-ratings, course, step, who, how) to the shared v2 store as entries that share a batch, with no request yet. A draft lives in
 * My requests, Drafts, until the student sends it (it then becomes a request, Waiting) or deletes it. A request queued while
 * offline is the same kind of draft. A draft is not evidence: no fact in lib/v2/facts.ts reads it, and nothing counts until it is
 * sent and an evaluator answers [REQ ST-03, ST-10..ST-13; INFER]. Internal names keep "logged" (a rename would touch the store).
 *
 * Pure transitions: each returns a new state and never mutates its input.
 */
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { skillById } from "@/lib/v2/evidence-index"
import type { LogEntry, Setting, Submission, V2State } from "@/lib/v2/types"
import { skillNoun } from "./terms"

export interface LoggedInput {
  skillIds: string[]
  /** The where choice value (placement:..., lab, simulation). */
  where: string
  setting: Setting
  clinicalSetting: string | null
  location: string | null
  date: string
  unit: string
  case: string
  /** The one note the sitting carries [REQ ST-12]. */
  note: string
  /** Self-ratings by skill id, where the skill asks for one [REQ ST-11]. */
  ratings: Record<string, string>
  /** Configured details beyond date, unit and case, by field id (lib/lab/student2.ts detailFieldsFor) [REQ SC-13, ST-10]. */
  extra?: Record<string, string>
  /** Self-evaluation answers to the evaluator's own questions, by skill id [REQ ST-11: "against the same criteria"]. */
  answers?: Record<string, Array<"yes" | "no" | null>>
  /** Course the request was started from (Send C) and the step it was left on, so Continue reopens there. */
  course?: string | null
  step?: string | null
  /** The evaluator chosen so far (a person id) and how they sign. */
  who?: string | null
  method?: string | null
  /** Continue an existing draft: replace it in place (same id) instead of adding a second one. */
  batchId?: string | null
}

/** One saved sitting that has not been sent: one row in My requests, "Not sent yet". */
export interface LoggedSitting {
  batchId: string
  entryIds: string[]
  skillIds: string[]
  skillNames: string[]
  where: string
  setting: Setting
  clinicalSetting: string | null
  location: string | null
  /** When it was performed. */
  date: string
  /** When it was logged. */
  loggedAt: string
  unit: string
  case: string
  note: string
  ratings: Record<string, string>
  answers: Record<string, Array<"yes" | "no" | null>>
  extra: Record<string, string>
  course: string | null
  step: string | null
  who: string | null
  method: string | null
}

/** The lab clock: today in the demo, with the real time of day, so a new entry sorts after the seeded ones. */
export function labNow(): string {
  return `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`
}

const nextBatch = (s: V2State) => {
  let n = s.logEntries.filter((e) => e.batchId.startsWith("lb-lab-")).length + 1
  while (s.logEntries.some((e) => e.batchId === `lb-lab-${n}`)) n++
  return `lb-lab-${n}`
}

export function saveLogged(s0: V2State, input: LoggedInput, studentId: string, at: string = labNow()): { state: V2State; batchId: string } {
  // Saving a draft again replaces it in place: same id, so My requests never shows two copies of one request.
  const s = input.batchId ? deleteLogged(s0, studentId, input.batchId) : s0
  const batchId = input.batchId && !s0.logEntries.some((e) => e.batchId === input.batchId && e.requestId !== null) ? input.batchId : nextBatch(s)
  const note = input.note.trim()
  const rows: LogEntry[] = input.skillIds.map((skillId, i) => ({
    id: `log-${batchId.slice(3)}-${i + 1}`,
    studentId,
    skillId,
    batchId,
    setting: input.setting,
    clinicalSetting: input.setting === "clinical" ? input.clinicalSetting : null,
    location: input.location,
    rating: input.ratings[skillId] || null,
    // Complete answers go on the entry (the evaluator reads them beside their own); a draft keeps partial ones on the sitting.
    answers: (input.answers?.[skillId]?.length && input.answers[skillId].every((x) => x !== null) ? (input.answers[skillId] as Array<"yes" | "no">) : null),
    // One note per sitting [REQ ST-12]: on the first entry only, so it is never read twice.
    note: i === 0 ? note : "",
    at,
    requestId: null,
    sitting: { where: input.where, date: input.date, unit: input.unit, case: input.case, ...(input.course ? { course: input.course } : {}), ...(input.step ? { step: input.step } : {}), ...(input.who ? { who: input.who } : {}), ...(input.method ? { method: input.method } : {}), ...(input.answers && Object.keys(input.answers).length ? { answers: input.answers } : {}), ...(input.extra && Object.keys(input.extra).length ? { extra: { ...input.extra } } : {}) },
  }))
  return { state: { ...s, logEntries: [...s.logEntries, ...rows] }, batchId }
}

/** The student's saved sittings with no request yet, newest first. Seeded practice trials (no sitting) are not listed. */
export function loggedNotSent(s: V2State, studentId: string): LoggedSitting[] {
  const by = new Map<string, LogEntry[]>()
  for (const e of s.logEntries) {
    if (e.studentId !== studentId || e.requestId !== null || !e.sitting) continue
    by.set(e.batchId, [...(by.get(e.batchId) ?? []), e])
  }
  return [...by.entries()]
    .map(([batchId, list]) => {
      const first = list[0]
      const sit = first.sitting!
      return {
        batchId,
        entryIds: list.map((e) => e.id),
        skillIds: list.map((e) => e.skillId),
        skillNames: list.map((e) => skillById(s, e.skillId)?.name ?? `A removed ${skillNoun()}`),
        where: sit.where,
        setting: first.setting,
        clinicalSetting: first.clinicalSetting,
        location: first.location,
        date: sit.date,
        loggedAt: first.at,
        unit: sit.unit,
        case: sit.case,
        note: list.map((e) => e.note.trim()).find(Boolean) ?? "",
        ratings: Object.fromEntries(list.filter((e) => e.rating).map((e) => [e.skillId, e.rating as string])),
        answers: sit.answers ?? Object.fromEntries(list.filter((e) => e.answers).map((e) => [e.skillId, e.answers as Array<"yes" | "no" | null>])),
        extra: sit.extra ?? {},
        course: sit.course ?? null,
        step: sit.step ?? null,
        who: sit.who ?? null,
        method: sit.method ?? null,
      }
    })
    .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1))
}

export function loggedSitting(s: V2State, studentId: string, batchId: string | null | undefined): LoggedSitting | null {
  if (!batchId) return null
  return loggedNotSent(s, studentId).find((x) => x.batchId === batchId) ?? null
}

export function deleteLogged(s: V2State, studentId: string, batchId: string): V2State {
  return { ...s, logEntries: s.logEntries.filter((e) => !(e.batchId === batchId && e.studentId === studentId && e.requestId === null && e.sitting)) }
}

/**
 * Sent: the sitting becomes a request. The entries carry its id (so they leave "Not sent yet") and the request is kept, so it
 * shows in My requests as waiting for the evaluator.
 */
export function markLoggedSent(s: V2State, studentId: string, batchId: string, submission: Submission): V2State {
  const ids = s.logEntries.filter((e) => e.batchId === batchId && e.studentId === studentId && e.requestId === null).map((e) => e.id)
  if (ids.length === 0) return s
  const sub: Submission = { ...submission, entryIds: ids }
  return {
    ...s,
    submissions: s.submissions.some((x) => x.id === sub.id) ? s.submissions : [...s.submissions, sub],
    logEntries: s.logEntries.map((e) => (ids.includes(e.id) ? { ...e, requestId: sub.id } : e)),
  }
}

/** Send without a draft first: the request is written as a draft and sent in one step, so it waits in My requests like any other. */
export function sendNew(s: V2State, input: LoggedInput, studentId: string, submission: Submission, at: string = labNow()): V2State {
  const saved = saveLogged(s, input, studentId, at)
  return markLoggedSent(saved.state, studentId, saved.batchId, { ...submission, createdAt: at })
}
