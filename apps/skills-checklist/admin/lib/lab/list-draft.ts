/**
 * A list's unsaved additions (Add skills, variant H; D-ADD1117, Decided). The panel's "Add N skills" puts skills on the list as a draft; nothing reaches the store until
 * Save changes, and a skill created in the panel is written to the library only then (decision 1): Discard leaves nothing behind.
 *
 * One pure function turns the draft into a store state, so the page's preview (the Unsaved rows, their times and method) and the save are the same computation.
 * Evaluation method belongs to the skill, the same on every list; times needed is the skill's own number in this lab (D-X44); Required or optional belongs to the list
 * (`requiredIds`).
 */
import type { V2State } from "@/lib/v2/types"
import { ensureVocab } from "@/lib/v2/vocabulary"
import { addSkillsToStore, NO_CATEGORY, normName, setSkillDetailsInStore, type AddedSkill } from "./library"
import { setTimesNeededMany, timesCellOf } from "./program-settings"
import { methodOfSkill, setSkillMethod } from "./methods"
import type { SkillList } from "./list-core"

export interface DraftEntry {
  /** The library skill's id, or the id a new skill will get on Save. */
  id: string
  /** Created in the panel: not in the library until Save. */
  isNew: boolean
  /** The name; for a library skill a different name renames it on Save (D-ADD1117-r). */
  name: string
  /** The category ("" for none); for a library skill a different one moves it on Save (D-ADD1117-r). */
  category: string
  /** A new skill's evaluation method, set silently to the program's (not chosen in Review, D-ADD1117-r); null when the program has none (Not configured, REQ SC-02). Ignored for a library skill. */
  methodId: string | null
  description?: string
  /** Times needed; null when there is no number to show (no method yet). */
  times: number | null
  required: boolean
}

export interface DraftOpts {
  actorId: string
  at: string
  /** The batch the new skills arrive in [REQ IM-11]. */
  batch?: { id: string; label: string; listId?: string }
}

/** The store as it will be after Save: new skills created, their method and categories set, times needed written where they differ. Lists are not in the store. */
export function applyDraft(s: V2State, entries: readonly DraftEntry[], opts: DraftOpts): V2State {
  if (!entries.length) return s
  const fresh = entries.filter((e) => e.isNew)
  let state = s
  if (fresh.length) {
    const categories = fresh.map((e) => e.category.trim()).filter((c) => c && c !== NO_CATEGORY)
    state = ensureVocab(state, "categories", categories, opts.actorId, opts.at)
    const added: AddedSkill[] = fresh.map((e) => ({ id: e.id, name: e.name.trim().replace(/\s+/g, " "), ...(e.description ? { description: e.description } : {}), section: e.category.trim(), group: "", category: e.category.trim(), tags: [], model: null, mandatoryDefault: null }))
    state = addSkillsToStore(state, added, opts.actorId, opts.at, opts.batch ? { id: opts.batch.id, kind: "add-several", label: opts.batch.label, ...(opts.batch.listId ? { listId: opts.batch.listId } : {}) } : undefined)
    for (const e of fresh) {
      if (!e.methodId || methodOfSkill(state, e.id)?.id === e.methodId) continue
      const r = setSkillMethod(state, e.id, e.methodId, { at: opts.at, byId: opts.actorId })
      if (r.ok) state = r.state
    }
  }
  // Library skills: Review edits their name and category too, and Save writes them to the skill (D-ADD1117-r, as times needed per D-ADD1117-t).
  for (const e of entries) {
    if (e.isNew) continue
    const k = state.skills.find((x) => x.id === e.id)
    if (!k) continue
    const name = e.name.trim().replace(/\s+/g, " ")
    const was = k.category === NO_CATEGORY ? "" : k.category
    // Replace [REQ IM-06]: the file's description overwrites the library skill's, on Save only.
    const description = e.description?.trim()
    const patch = { ...(name && name !== k.name ? { name } : {}), ...(normName(e.category) !== normName(was) ? { category: e.category } : {}), ...(description && description !== (k.description ?? "") ? { description } : {}) }
    if (patch.category) state = ensureVocab(state, "categories", [patch.category], opts.actorId, opts.at)
    if (Object.keys(patch).length) state = setSkillDetailsInStore(state, [e.id], patch, opts.actorId, opts.at)
  }
  for (const e of entries) {
    if (e.times === null) continue
    if (timesCellOf(state, e.id).value === e.times) continue
    state = setTimesNeededMany(state, [e.id], e.times, { at: opts.at, byId: opts.actorId }).state
  }
  return state
}

/** The list's skills and required set after Save. Nothing repeats; a skill marked optional leaves the required set. */
export function draftListChange(list: Pick<SkillList, "skillIds" | "requiredIds">, entries: readonly DraftEntry[]): { skillIds: string[]; requiredIds: string[] } {
  const on = new Set(list.skillIds)
  const skillIds = [...list.skillIds, ...entries.map((e) => e.id).filter((id) => !on.has(id))]
  const req = new Set(list.requiredIds)
  for (const e of entries) {
    if (e.required) req.add(e.id)
    else req.delete(e.id)
  }
  return { skillIds, requiredIds: skillIds.filter((id) => req.has(id)) }
}

/** "{name}, new intake", the spec's prefill for A new list (3.7). */
export const newIntakeName = (name: string): string => `${name}, new intake`
