/**
 * Details collected with every evaluation (Proposed, D-EM1116-c; prototype 2026-11-16 F6): one program-wide list, not one per method [REQ SC-13].
 * Four built-in rows are locked; the program adds, edits, moves, stops or deletes its own. Stored beside the methods in `V2State.methodEdits.details`
 * (lib/lab/methods.ts keeps the key on every method write).
 *
 * Not decided here: how Graded or practice behaves (whether practice ever counts) is new behaviour for Sankalp; it is listed as a detail only.
 * The engine and the student and evaluator forms still read each method's own `studentFields` until they read this list [INFER, flagged].
 * Sankalp [CALL 11-16]: longer term the Prism form builder owns forms; this list stays simple on purpose.
 */
import type { V2State } from "@/lib/v2/types"

export type DetailType = "date" | "short" | "long" | "number" | "choice" | "placement"
export type DetailBy = "student" | "evaluator"

export interface ProgramDetail {
  id: string
  name: string
  type: DetailType
  by: DetailBy
  required: boolean
  choices?: string[]
  builtIn?: boolean
  /** Stopped: no longer asked for; values already recorded are kept. */
  stopped?: boolean
  /** Added by the program on this page after evaluations were recorded: never used until an evaluation asks for it. */
  added?: boolean
}

export const DETAIL_TYPE_LABEL: Record<DetailType, string> = { date: "Date", short: "Short text", long: "Long text", number: "Number", choice: "Choice", placement: "From the student's placement" }
export const DETAIL_BY_LABEL: Record<DetailBy, string> = { student: "Student", evaluator: "Evaluator" }

export const BUILT_IN_DETAILS: readonly ProgramDetail[] = [
  { id: "d-date", name: "Date performed", type: "date", by: "student", required: true, builtIn: true },
  { id: "d-graded", name: "Graded or practice", type: "choice", by: "student", required: true, builtIn: true, choices: ["Graded", "Practice"] },
  { id: "d-patient", name: "On a patient or simulated", type: "choice", by: "student", required: true, builtIn: true, choices: ["On a patient", "Simulated"] },
  { id: "d-site", name: "Clinical site", type: "placement", by: "student", required: true, builtIn: true },
]

const NAME_MAX = 60
const key = (s: string) => s.trim().toLowerCase()

/** The stored program rows, or null when the program has not edited the list yet. */
function storedOf(s: V2State): ProgramDetail[] | null {
  const d = (s.methodEdits as { details?: unknown } | undefined)?.details
  return Array.isArray(d) ? (d as ProgramDetail[]) : null
}

/**
 * The program's rows before any edit: the fields the program's saved rule asks the student for, less the built-ins. A row read this way was asked
 * for by evaluations already recorded, so it counts as used when the program has any evaluation [INFER].
 */
function seededRows(s: V2State): ProgramDetail[] {
  const rule = s.programSettings?.rule as { studentFields?: Array<{ label: string; type: string; mandatory: boolean; choices?: string[] }> } | undefined
  const built = new Set(BUILT_IN_DETAILS.map((d) => key(d.name)))
  return (rule?.studentFields ?? [])
    .filter((f) => f.label.trim() && !built.has(key(f.label)))
    .map((f, i) => ({ id: `d-seed-${i}`, name: f.label.trim(), type: (["date", "short", "long", "number", "choice"].includes(f.type) ? f.type : "short") as DetailType, by: "student" as const, required: f.mandatory, ...(f.choices ? { choices: [...f.choices] } : {}) }))
}

/** Every row, built-ins first. */
export function detailsOf(s: V2State): ProgramDetail[] {
  return [...BUILT_IN_DETAILS, ...(storedOf(s) ?? seededRows(s))]
}

/** Whether evaluations already recorded hold a value for it: built-ins and rows read from the program always, added rows never in the lab [INFER]. */
export function detailUsed(s: V2State, d: ProgramDetail): boolean {
  if (d.added) return false
  return (s.evaluations?.length ?? 0) > 0
}

/** Why a row cannot be deleted, or null. */
export function detailDeleteBlocked(s: V2State, d: ProgramDetail): string | null {
  if (d.builtIn) return "Built in"
  if (detailUsed(s, d)) return "Already used in evaluations. Stop collecting it instead"
  return null
}

export function detailNameIssue(s: V2State, name: string, exceptId?: string): string | null {
  const t = name.trim()
  if (!t) return "Name the detail."
  if (t.length > NAME_MAX) return `Use ${NAME_MAX} characters or fewer.`
  if (detailsOf(s).some((d) => d.id !== exceptId && key(d.name) === key(t))) return `A detail called "${t}" already exists.`
  return null
}

type Write = { ok: true; state: V2State } | { ok: false; error: string }

const withRows = (s: V2State, rows: ProgramDetail[]): V2State => {
  const o = (s.methodEdits && typeof s.methodEdits === "object" ? s.methodEdits : { methods: [] }) as Record<string, unknown>
  return { ...s, methodEdits: { ...o, methods: Array.isArray(o.methods) ? o.methods : [], details: rows } }
}
const programRows = (s: V2State) => storedOf(s) ?? seededRows(s)

let seq = 0
export function addDetail(s: V2State, d: Omit<ProgramDetail, "id" | "builtIn" | "added" | "stopped">, id = `d-${Date.now().toString(36)}-${(seq++).toString(36)}`): Write & { id?: string } {
  const issue = detailNameIssue(s, d.name)
  if (issue) return { ok: false, error: issue }
  return { ok: true, state: withRows(s, [...programRows(s), { ...d, name: d.name.trim(), id, added: true }]), id }
}

export function editDetail(s: V2State, id: string, patch: Partial<Pick<ProgramDetail, "name" | "type" | "by" | "required" | "choices">>): Write {
  const rows = programRows(s)
  if (!rows.some((d) => d.id === id)) return { ok: false, error: "This detail is no longer here." }
  if (patch.name !== undefined) {
    const issue = detailNameIssue(s, patch.name, id)
    if (issue) return { ok: false, error: issue }
  }
  return { ok: true, state: withRows(s, rows.map((d) => (d.id === id ? { ...d, ...patch, ...(patch.name !== undefined ? { name: patch.name.trim() } : {}) } : d))) }
}

/** Move a program row up (-1) or down (+1) among the program rows; built-ins stay first. */
export function moveDetail(s: V2State, id: string, by: -1 | 1): Write {
  const rows = [...programRows(s)]
  const i = rows.findIndex((d) => d.id === id)
  const j = i + by
  if (i < 0 || j < 0 || j >= rows.length) return { ok: false, error: "It cannot move further." }
  ;[rows[i], rows[j]] = [rows[j]!, rows[i]!]
  return { ok: true, state: withRows(s, rows) }
}

export function setDetailStopped(s: V2State, id: string, stopped: boolean): Write {
  const rows = programRows(s)
  if (!rows.some((d) => d.id === id)) return { ok: false, error: "This detail is no longer here." }
  return { ok: true, state: withRows(s, rows.map((d) => (d.id === id ? { ...d, stopped } : d))) }
}

export function deleteDetail(s: V2State, id: string): Write {
  const rows = programRows(s)
  const d = rows.find((x) => x.id === id)
  if (!d) return { ok: false, error: "This detail is no longer here." }
  const blocked = detailDeleteBlocked(s, d)
  if (blocked) return { ok: false, error: `${blocked}.` }
  return { ok: true, state: withRows(s, rows.filter((x) => x.id !== id)) }
}
