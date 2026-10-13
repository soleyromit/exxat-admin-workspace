// Pure logic for the S-13 send form (docs/ux/08 P-09, contract S-13 §9). No React, no DOM: the reducer owns the reset
// rules (DEFECT-01) and `validate` owns the disabled-with-reason rules (ST-08, ST-10, ST-11), so both are unit tested.
import type { Db, Id, StudentValues, Submission } from "@/lib/domain/types"
import { isConfigured, type Responses } from "@/lib/engine"
import { responseErrors } from "@/lib/store/responses"
import { computeSendOptions, type PerformedIn, type SendOptions } from "@/lib/store/sendRules"
import { isEmail } from "@/lib/store/actions/library"

export interface SkillDraft {
  values: StudentValues
  note: string
  selfEval: Responses | null
}

export interface FormState {
  performedIn: PerformedIn
  /** `${settingId}|${locationId}`; "" = none chosen. */
  settingKey: string
  roleId: string
  personId: string
  /** ST-09: the student is naming a lab instructor who is not on the roster. */
  namedOpen: boolean
  named: { name: string; email: string }
  skillIds: Id[]
  drafts: Record<Id, SkillDraft>
}

export type Action =
  | { type: "performedIn"; value: PerformedIn }
  | { type: "setting"; key: string }
  | { type: "role"; roleId: string }
  | { type: "person"; personId: string }
  | { type: "namedOpen"; open: boolean }
  | { type: "named"; field: "name" | "email"; value: string }
  | { type: "value"; skillId: Id; fieldId: Id; value: string | number }
  | { type: "note"; skillId: Id; value: string }
  | { type: "selfEval"; skillId: Id; value: Responses | null }
  | { type: "onlyFirstSkill" }

export const settingKey = (settingId: Id, locationId: Id | null) => `${settingId}|${locationId ?? ""}`
export const parseSettingKey = (k: string): { settingId: Id; locationId: Id | null } | null => {
  if (!k) return null
  const [settingId, loc] = k.split("|")
  return { settingId, locationId: loc ? loc : null }
}

export function emptyDraft(): SkillDraft {
  return { values: {}, note: "", selfEval: null }
}

export function initialForm(skillIds: Id[]): FormState {
  return { performedIn: "clinical", settingKey: "", roleId: "", personId: "", namedOpen: false, named: { name: "", email: "" }, skillIds, drafts: Object.fromEntries(skillIds.map((id) => [id, emptyDraft()])) }
}

/**
 * Reset rules (contract S-13 §9, fixes DEFECT-01): changing performed-in, setting or role clears the person and the
 * dependent fields. Entered details (values, notes, self-evaluation) are kept.
 */
export function reduce(state: FormState, a: Action): FormState {
  const clearPerson = { personId: "", namedOpen: false, named: { name: "", email: "" } }
  switch (a.type) {
    case "performedIn":
      if (a.value === state.performedIn) return state
      return { ...state, performedIn: a.value, settingKey: "", roleId: "", ...clearPerson }
    case "setting":
      return { ...state, settingKey: a.key, ...clearPerson }
    case "role":
      if (a.roleId === state.roleId) return state
      return { ...state, roleId: a.roleId, ...clearPerson }
    case "person":
      return { ...state, personId: a.personId, namedOpen: false }
    case "namedOpen":
      return { ...state, namedOpen: a.open, personId: a.open ? "" : state.personId }
    case "named":
      return { ...state, named: { ...state.named, [a.field]: a.value } }
    case "value":
      return patchDraft(state, a.skillId, (d) => ({ ...d, values: { ...d.values, [a.fieldId]: a.value } }))
    case "note":
      return patchDraft(state, a.skillId, (d) => ({ ...d, note: a.value }))
    case "selfEval":
      return patchDraft(state, a.skillId, (d) => ({ ...d, selfEval: a.value }))
    case "onlyFirstSkill":
      return { ...state, skillIds: state.skillIds.slice(0, 1), roleId: "", ...clearPerson }
  }
}

function patchDraft(state: FormState, skillId: Id, fn: (d: SkillDraft) => SkillDraft): FormState {
  return { ...state, drafts: { ...state.drafts, [skillId]: fn(state.drafts[skillId] ?? emptyDraft()) } }
}

export interface Validation {
  /** Per skill: required field ids still missing or invalid, and whether the self-evaluation is incomplete. */
  skills: Record<Id, { fieldErrors: Record<Id, "required" | "number" | "choice">; selfEvalIncomplete: boolean; complete: boolean }>
  requiredMissing: number
  settingMissing: boolean
  personMissing: boolean
  namedInvalid: { name: boolean; email: boolean }
  selfEvalMissing: boolean
  /** The single reason Send is disabled, or null when it can be sent (never silent: contract §9). */
  reason: "blocked" | "setting" | "person" | "selfEval" | "fields" | null
  canSend: boolean
}

export function validate(db: Db, opts: SendOptions, state: FormState): Validation {
  const skills: Validation["skills"] = {}
  let requiredMissing = 0
  let selfEvalMissing = false
  for (const id of state.skillIds) {
    const skill = db.skills.find((s) => s.id === id)
    const d = state.drafts[id] ?? emptyDraft()
    const fieldErrors: Record<Id, "required" | "number" | "choice"> = {}
    if (skill) {
      for (const f of skill.submissionFields) {
        const v = d.values[f.id]
        const empty = v === undefined || v === null || (typeof v === "string" && !v.trim())
        if (f.required && empty) {
          fieldErrors[f.id] = "required"
          requiredMissing += 1
        } else if (!empty && f.type === "number" && Number.isNaN(Number(v))) {
          fieldErrors[f.id] = "number"
          requiredMissing += 1
        } else if (!empty && f.type === "choice" && f.options && !f.options.includes(String(v))) {
          fieldErrors[f.id] = "choice"
          requiredMissing += 1
        }
      }
    }
    const selfEvalIncomplete = !!(skill && skill.selfEvaluation && isConfigured(skill) && Object.keys(responseErrors(skill.model, d.selfEval)).length > 0)
    if (selfEvalIncomplete) selfEvalMissing = true
    skills[id] = { fieldErrors, selfEvalIncomplete, complete: Object.keys(fieldErrors).length === 0 && !selfEvalIncomplete }
  }
  const settingMissing = state.performedIn === "clinical" && opts.settingMode !== "inferred" && !state.settingKey
  const named = state.namedOpen
  const namedInvalid = { name: named && !state.named.name.trim(), email: named && !isEmail(state.named.email) }
  const personMissing = !state.roleId || (named ? namedInvalid.name || namedInvalid.email : !state.personId)
  const blocked = !!opts.blocked
  const reason: Validation["reason"] = blocked ? "blocked" : settingMissing ? "setting" : personMissing ? "person" : requiredMissing > 0 ? "fields" : selfEvalMissing ? "selfEval" : null
  return { skills, requiredMissing, settingMissing, personMissing, namedInvalid, selfEvalMissing, reason, canSend: reason === null && state.skillIds.length > 0 }
}

/** Options for the form, from the engine-backed decision table (P-09). */
export function optionsFor(db: Db, studentId: Id, offeringId: Id, state: FormState): SendOptions {
  return computeSendOptions(db, { studentId, offeringId, skillIds: state.skillIds, performedIn: state.performedIn })
}

/** Prefill from an existing submission (revise mode, RV-01) or its copied context (further attempt, RV-03). */
export function formFromSubmission(sub: Submission, db: Db, mode: "revise" | "further"): FormState {
  const base = initialForm([sub.skillId])
  const key = sub.performedIn === "clinical" && sub.clinicalSettingId ? settingKey(sub.clinicalSettingId, sub.locationId) : ""
  return {
    ...base,
    performedIn: sub.performedIn,
    settingKey: key,
    roleId: sub.evaluator.roleId,
    personId: sub.evaluator.source === "studentNamed" ? "" : sub.evaluator.personId,
    namedOpen: sub.evaluator.source === "studentNamed",
    named: sub.evaluator.source === "studentNamed" ? { name: sub.evaluator.name, email: sub.evaluator.email } : { name: "", email: "" },
    drafts: {
      [sub.skillId]:
        mode === "revise"
          ? { values: { ...sub.values }, note: sub.studentNote, selfEval: sub.selfEvaluation }
          : // A further attempt copies the context, not the answers: it is a new performance (RV-03).
            { values: {}, note: "", selfEval: null },
    },
  }
}
