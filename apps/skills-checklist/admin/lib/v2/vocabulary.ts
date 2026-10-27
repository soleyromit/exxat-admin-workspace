/**
 * The program's categories and tags, one shared list in the v2 store (`state.vocabulary`), persisted with the store's delta.
 *
 * REQ SL-03: "Categories are program-defined. A skill belongs to at most one category; a category is optional."
 * REQ SL-04: "Tags are program-defined and cross-cutting. A skill may carry any number, and a tag may span categories."
 * REQ SL-05: "A category or tag can be created at the point it is needed while defining a skill, without a separate setup exercise."
 * REQ SL-06: "Only active categories and tags are available for assignment. One already assigned but since deactivated remains on
 * the skill, identifiable as inactive, so it can be removed deliberately rather than disappearing."
 *
 * Shape (agreed with the Configure worker, who reads it in the Add a skill pickers): `{ categories: {id,name,active}[], tags:
 * {id,name,active}[] }`. Skills keep referencing names (`Skill.category`, `Skill.tags`), so the seed needs no change: until a
 * write, the list is derived from the skills' own categories and tags, all active, and every figure stays as it was. A rename
 * renames the name on every skill that carries it; deactivating changes no skill; delete exists only while nothing uses it.
 */
import type { V2State, VocabEntry, Vocabulary } from "./types"
import { appendAudit } from "./store"

export type { VocabEntry, Vocabulary }
export type VocabKind = "categories" | "tags"
export type VocabResult = { ok: true; state: V2State; entry?: VocabEntry } | { ok: false; error: string }

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const key = (s: string) => s.trim().toLowerCase()
const PREFIX: Record<VocabKind, string> = { categories: "cat", tags: "tag" }
const WORD: Record<VocabKind, string> = { categories: "category", tags: "tag" }

const derived = new WeakMap<V2State, Vocabulary>()

/** The shared categories and tags: the stored list, or (before any write) the skills' own, sorted by name, all active. */
export function getVocabulary(state: V2State): Vocabulary {
  if (state.vocabulary) return state.vocabulary
  let hit = derived.get(state)
  if (!hit) {
    const cats = new Set<string>()
    const tags = new Set<string>()
    for (const k of state.skills) {
      if (k.category?.trim()) cats.add(k.category)
      for (const t of k.tags ?? []) if (t.trim()) tags.add(t)
    }
    const make = (kind: VocabKind, names: Set<string>): VocabEntry[] => [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ id: `${PREFIX[kind]}-${slug(name)}`, name, active: true }))
    hit = { categories: make("categories", cats), tags: make("tags", tags) }
    derived.set(state, hit)
  }
  return hit
}

/** Names offered for new assignment (SL-06): active entries only. */
export function activeNames(state: V2State, kind: VocabKind): string[] {
  return getVocabulary(state)[kind].filter((e) => e.active).map((e) => e.name)
}

/** True when this name is a deactivated entry, so a skill carrying it shows it marked "Inactive" (SL-06). */
export function isInactiveName(state: V2State, kind: VocabKind, name: string): boolean {
  const e = getVocabulary(state)[kind].find((x) => key(x.name) === key(name))
  return !!e && !e.active
}

/** How many skills carry an entry (by name). */
export function usesOfName(state: V2State, kind: VocabKind, name: string): number {
  const n = key(name)
  return state.skills.filter((k) => (kind === "categories" ? key(k.category ?? "") === n : (k.tags ?? []).some((t) => key(t) === n))).length
}

function write(state: V2State, kind: VocabKind, list: VocabEntry[], actorId: string, action: string, label: string, at: string, skills = state.skills): V2State {
  const vocab = getVocabulary(state)
  return appendAudit({ ...state, skills, vocabulary: { ...vocab, [kind]: list } }, actorId, action, label, at)
}

export function validateVocabName(state: V2State, kind: VocabKind, name: string, exceptId?: string): string | null {
  const n = name.trim()
  if (!n) return "Enter a name."
  if (n.length > 80) return "Use 80 characters or fewer."
  if (getVocabulary(state)[kind].some((e) => e.id !== exceptId && key(e.name) === key(n))) return `"${n}" is already in the list.`
  return null
}

/** Creates an entry (from Settings, or inline while defining a skill, SL-05). */
export function addVocab(state: V2State, kind: VocabKind, name: string, actorId: string, at: string): VocabResult {
  const error = validateVocabName(state, kind, name)
  if (error) return { ok: false, error }
  const list = getVocabulary(state)[kind]
  const base = `${PREFIX[kind]}-${slug(name) || "entry"}`
  let id = base
  for (let i = 2; list.some((e) => e.id === id); i++) id = `${base}-${i}`
  const entry: VocabEntry = { id, name: name.trim(), active: true }
  return { ok: true, state: write(state, kind, [...list, entry].sort((a, b) => a.name.localeCompare(b.name)), actorId, `Added ${WORD[kind]}`, entry.name, at), entry }
}

/** Renames an entry and the name on every skill that carries it, so nothing is orphaned. */
export function renameVocab(state: V2State, kind: VocabKind, id: string, name: string, actorId: string, at: string): VocabResult {
  const list = getVocabulary(state)[kind]
  const old = list.find((e) => e.id === id)
  if (!old) return { ok: false, error: `That ${WORD[kind]} is no longer in the list.` }
  const error = validateVocabName(state, kind, name, id)
  if (error) return { ok: false, error }
  const next = name.trim()
  if (next === old.name) return { ok: true, state, entry: old }
  const was = key(old.name)
  const skills = state.skills.map((k) => {
    if (kind === "categories") return key(k.category ?? "") === was ? { ...k, category: next } : k
    return (k.tags ?? []).some((t) => key(t) === was) ? { ...k, tags: (k.tags ?? []).map((t) => (key(t) === was ? next : t)) } : k
  })
  const entry = { ...old, name: next }
  return { ok: true, state: write(state, kind, list.map((e) => (e.id === id ? entry : e)).sort((a, b) => a.name.localeCompare(b.name)), actorId, `Renamed ${WORD[kind]}`, `${old.name} to ${next}`, at, skills), entry }
}

/** Deactivates or reactivates. Skills keep the name either way (SL-06); only new assignment changes. */
export function setVocabActive(state: V2State, kind: VocabKind, id: string, active: boolean, actorId: string, at: string): VocabResult {
  const list = getVocabulary(state)[kind]
  const old = list.find((e) => e.id === id)
  if (!old) return { ok: false, error: `That ${WORD[kind]} is no longer in the list.` }
  if (old.active === active) return { ok: true, state, entry: old }
  const entry = { ...old, active }
  return { ok: true, state: write(state, kind, list.map((e) => (e.id === id ? entry : e)), actorId, active ? `Reactivated ${WORD[kind]}` : `Deactivated ${WORD[kind]}`, old.name, at), entry }
}

/**
 * SL-05: a category or tag typed while defining a skill joins the shared list when the skill is saved, so Settings and every
 * picker show it. Names already in the list (any case, active or not) are left as they are; nothing to add returns the same
 * state object, so a save that creates nothing writes no vocabulary.
 */
export function ensureVocab(state: V2State, kind: VocabKind, names: readonly string[], actorId: string, at: string): V2State {
  let s = state
  for (const raw of names) {
    const n = raw.trim()
    if (!n || getVocabulary(s)[kind].some((e) => key(e.name) === key(n))) continue
    const r = addVocab(s, kind, n, actorId, at)
    if (r.ok) s = r.state
  }
  return s
}

/** Deletes an entry nothing uses; otherwise says why and points to Deactivate. */
export function deleteVocab(state: V2State, kind: VocabKind, id: string, actorId: string, at: string): VocabResult {
  const list = getVocabulary(state)[kind]
  const old = list.find((e) => e.id === id)
  if (!old) return { ok: false, error: `That ${WORD[kind]} is no longer in the list.` }
  const n = usesOfName(state, kind, old.name)
  if (n > 0) return { ok: false, error: `"${old.name}" cannot be deleted: ${n} ${n === 1 ? "skill uses" : "skills use"} it. Deactivate it instead.` }
  return { ok: true, state: write(state, kind, list.filter((e) => e.id !== id), actorId, `Deleted ${WORD[kind]}`, old.name, at) }
}
