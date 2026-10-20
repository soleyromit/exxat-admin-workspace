import type { Result } from "./admin-actions"
import { nextIdFor } from "./outcomes"
import { appendAudit } from "./store"
import type { Evaluation, LabBatch, LabCheckoff, Outcome, Person, Skill, V2State } from "./types"

/**
 * Stage 5: a lab instructor records one lab (or simulation) session for the whole group (EV-02, EV-05). Pure.
 * Results are stored as lab or simulation evidence with no clinical setting, so they can never satisfy a named clinical-setting
 * minimum (SC-12). A skill that holds evidence for approval holds the lab result too (AR-06). A saved batch is never edited.
 */

export const CELL_ORDER: Array<Outcome | null> = ["met", "not-met", "not-yet", null]
export const CELL_WORD: Record<Outcome, string> = { met: "Met", "not-met": "Not met", "not-yet": "Not yet" }
export const cellWord = (c: Outcome | null) => (c ? CELL_WORD[c] : "Not recorded")

/** The next state when a cell is pressed: Met, Not met, Not yet, Not recorded, and round again. */
export function nextCell(c: Outcome | null): Outcome | null {
  const i = CELL_ORDER.indexOf(c)
  return CELL_ORDER[(i + 1) % CELL_ORDER.length]
}

export const NAME_MAX = 80

export const cellKey = (studentId: string, skillId: string) => `${studentId}|${skillId}`

export const isLabInstructor = (p: Person | undefined): boolean => !!p && p.kind === "lab-instructor"

export const labBatchesOf = (s: V2State): LabBatch[] => s.labBatches ?? []

/** Why this person cannot record a lab session, or null. */
export function labBlockReason(p: Person | undefined): string | null {
  if (!p) return "That person is not on record."
  if (isLabInstructor(p)) return null
  return `Lab sessions are recorded by a lab instructor. ${p.name} is ${p.kind === "preceptor" ? "a preceptor" : p.kind === "student" ? "a student" : "not a lab instructor"}, and signs off clinical practice. Open this page as R. Whitmore to record a session.`
}

/** Why a person is not qualified to sign off this skill in the lab, or null. Role is not checked: a lab instructor signs lab evidence. */
function qualificationReason(skill: Skill, p: Person): string | null {
  const q = skill.config?.qualification
  if (!q) return null
  const have = p.credentials ?? []
  if (q.credentials.length && !q.credentials.some((x) => have.includes(x))) return `Needs ${q.credentials.join(" or ")} credential`
  if ((p.yearsPractice ?? 0) < q.minYears) return `Needs ${q.minYears} or more years of practice`
  const missing = q.training.filter((x) => !(p.training ?? []).includes(x))
  if (missing.length) return `Needs training in ${missing.join(", ")}`
  return null
}

export interface LabSkill {
  skill: Skill
  /** Why the skill is not offered for this session, or null. */
  blocked: string | null
}

/** Skills the course maps and the program has published. In a simulation session, a skill that does not allow simulation is blocked. */
export function labSkills(s: V2State, setting: "lab" | "simulation", instructor: Person | undefined): LabSkill[] {
  const out: LabSkill[] = []
  for (const m of s.mappings.filter((x) => x.courseId === s.course.id && x.level !== "not-expected")) {
    const skill = s.skills.find((k) => k.id === m.skillId)
    if (!skill?.config || !skill.published) continue
    let blocked: string | null = null
    if (setting === "simulation" && !skill.config.simulation.allowed) blocked = "Simulation does not count for this skill."
    else if (instructor) blocked = qualificationReason(skill, instructor)
    out.push({ skill, blocked })
  }
  return out.sort((a, b) => a.skill.name.localeCompare(b.skill.name))
}

export const labStudents = (s: V2State): Person[] => s.people.filter((p) => p.kind === "student")

export interface LabInput {
  name: string
  /** YYYY-MM-DD. */
  date: string
  setting: "lab" | "simulation"
  skillIds: string[]
  absentIds: string[]
  cells: Record<string, Outcome | null>
}

export interface LabCount {
  results: number
  studentsWithResults: number
  blank: number
  absent: number
}

/** What a save would do, counted before it happens so the confirmation can say it. */
export function labCounts(s: V2State, input: LabInput): LabCount {
  const absent = new Set(input.absentIds)
  const present = labStudents(s).filter((p) => !absent.has(p.id))
  let results = 0
  let blank = 0
  const withResults = new Set<string>()
  for (const p of present) {
    for (const id of input.skillIds) {
      if (input.cells[cellKey(p.id, id)]) {
        results++
        withResults.add(p.id)
      } else blank++
    }
  }
  return { results, studentsWithResults: withResults.size, blank, absent: input.absentIds.filter((id) => labStudents(s).some((p) => p.id === id)).length }
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export function saveLabBatch(s: V2State, input: LabInput, actorId: string, at: string): Result<{ batch: LabBatch; counts: LabCount }> {
  const actor = s.people.find((p) => p.id === actorId)
  const why = labBlockReason(actor)
  if (why) return { ok: false, error: why }
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Name the session so it can be found later, for example Skills lab, group A." }
  if (name.length > NAME_MAX) return { ok: false, error: `Shorten the session name to ${NAME_MAX} characters or fewer (now ${name.length}).` }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(`${input.date}T00:00:00Z`))) return { ok: false, error: "Choose the date of the session." }
  if (input.skillIds.length === 0) return { ok: false, error: "Choose at least one skill for this session." }
  const offered = new Map(labSkills(s, input.setting, actor).map((x) => [x.skill.id, x]))
  for (const id of input.skillIds) {
    const o = offered.get(id)
    if (!o) return { ok: false, error: "One of the chosen skills is not open for this course." }
    if (o.blocked) return { ok: false, error: `${o.skill.name}: ${o.blocked}` }
  }
  if (labBatchesOf(s).some((b) => b.name.trim().toLowerCase() === name.toLowerCase() && b.date === input.date && b.setting === input.setting)) {
    return { ok: false, error: `A session called ${name} on ${input.date} is already saved. Saved sessions are not edited. Give this one another name or date.` }
  }
  const counts = labCounts(s, input)
  if (counts.results === 0) return { ok: false, error: "Record at least one result before you save. Press a cell to set Met, Not met or Not yet, or mark a student absent." }

  const absent = new Set(input.absentIds)
  const evaluations: Evaluation[] = []
  const ids = s.evaluations.map((e) => e.id)
  const checkoffs: LabCheckoff[] = []
  const coIds = s.labCheckoffs.map((c) => c.id)
  const when = `${input.date}T09:00:00.000Z`
  let awaiting = 0
  for (const p of labStudents(s).filter((x) => !absent.has(x.id))) {
    for (const skillId of input.skillIds) {
      const outcome = input.cells[cellKey(p.id, skillId)]
      if (!outcome) continue
      const skill = s.skills.find((k) => k.id === skillId)!
      const id = nextIdFor("ev-lab", ids)
      ids.push(id)
      const status = skill.config?.approvalRequired ? "awaiting-approval" : "counted"
      if (status === "awaiting-approval") awaiting++
      evaluations.push({
        id,
        studentId: p.id,
        skillId,
        evaluatorId: actorId,
        setting: input.setting,
        date: when,
        status,
        outcome,
        currentVersion: 1,
        versions: [{ version: 1, outcome, at: when, by: actorId, reason: null, detail: { feedback: "" } }],
        source: "evaluator",
      })
      if (outcome === "met" && input.setting === "lab" && !s.labCheckoffs.some((c) => c.studentId === p.id && c.skillId === skillId) && !checkoffs.some((c) => c.studentId === p.id && c.skillId === skillId)) {
        const cid = nextIdFor("lc", coIds)
        coIds.push(cid)
        checkoffs.push({ id: cid, studentId: p.id, skillId, byId: actorId, at })
      }
    }
  }
  const batch: LabBatch = {
    id: nextIdFor("lab", labBatchesOf(s).map((b) => b.id)),
    name,
    date: input.date,
    setting: input.setting,
    instructorId: actorId,
    skillIds: [...input.skillIds],
    absentIds: [...absent].filter((id) => labStudents(s).some((p) => p.id === id)),
    evaluationIds: evaluations.map((e) => e.id),
    blank: counts.blank,
    savedAt: at,
  }
  const state = appendAudit(
    { ...s, evaluations: [...s.evaluations, ...evaluations], labCheckoffs: [...s.labCheckoffs, ...checkoffs], labBatches: [...labBatchesOf(s), batch] },
    actorId,
    `Saved a ${input.setting} session`,
    `${name}: ${counts.results} ${plural(counts.results, "result", "results")} for ${counts.studentsWithResults} ${plural(counts.studentsWithResults, "student", "students")}, ${counts.absent} absent${awaiting ? `, ${awaiting} held for approval` : ""}`,
    at,
  )
  return { ok: true, state, batch, counts }
}
