import type { V2State } from "@/lib/v2/types"
import { appendAudit } from "@/lib/v2/store"
import { aliasesAfterRename, currentSettingName } from "@/lib/v2/setting-names"
import { getVocabulary } from "@/lib/v2/vocabulary"
import { CONFIGURATION_META } from "./library"
import { configurationOf } from "./program-settings"
import { inSentence } from "./terms"

/**
 * Program settings (REQ SL-03 to SL-08; AUDIT T1: no settings screen exists, `GET /v2/admin/settings` 404).
 *
 * Four program-defined lists: categories (SL-03), tags (SL-04), clinical settings (SL-07) and lab instructors (SL-08).
 * Pure functions over the v2 store: categories and tags in `state.vocabulary`, clinical settings in `state.program` (both persisted
 * with the store's delta). The lab-local overlay now only reaches the lab instructors list, which no page opens any more (D-L24).
 *
 * Rules every list obeys:
 * - Delete exists only while an entry is unused (nothing references it). Otherwise the count that blocks it is the reason.
 * - Deactivate keeps the entry where it is already used and marks it inactive there, so it can be removed deliberately; it
 *   stops being offered for new use (SL-06).
 * - Names are unique per list, ignoring case and surrounding spaces.
 */

export type SettingsTab = "categories" | "tags" | "settings" | "instructors"
export const SETTINGS_TABS: SettingsTab[] = ["categories", "tags", "settings", "instructors"]
export const isSettingsTab = (v: string | null | undefined): v is SettingsTab => SETTINGS_TABS.includes(v as SettingsTab)
export const SETTINGS_TAB_LABEL: Record<SettingsTab, string> = { categories: "Categories", tags: "Tags", settings: "Clinical settings", instructors: "Lab instructors" }

/**
 * Naming has no Settings UI (Romit 2026-10-27: "naming can be changed in the backend, so we need to remove this tab for now";
 * ledger D-L25): the program's noun is set in data (lib/lab/terms.ts keeps it and every screen follows it); an old
 * `?tab=naming` link lands on the Settings landing.
 */
export type SettingsSection = SettingsTab | "evaluators" | "student-groups"
export const SETTINGS_SECTIONS: SettingsSection[] = [...SETTINGS_TABS, "evaluators", "student-groups"]
export const isSettingsSection = (v: string | null | undefined): v is SettingsSection => SETTINGS_SECTIONS.includes(v as SettingsSection)
/**
 * Evaluators (Romit 2026-10-27, "sure"; ledger D-L24): the full list of people who sign (preceptors, clinical faculty, lab
 * instructors) is a Settings section, for lookup and edits. Lab instructors are the same records (people of kind
 * "lab-instructor" in the directory), so the former Lab instructors list is this section with the role filter set to Lab
 * instructor; adding one is "Add an evaluator" with that role (name and email, REQ SL-08).
 */
export const EVALUATORS_LABEL = "Evaluators"
/** Student groups (D-L79): created, renamed and removed here, since they do not belong on Assign. A stand-in until Prism's student area has them (655e2cbd ch 2). */
export const STUDENT_GROUPS_LABEL = "Student groups"
export const sectionLabel = (s: SettingsSection): string => (s === "evaluators" ? EVALUATORS_LABEL : s === "student-groups" ? STUDENT_GROUPS_LABEL : SETTINGS_TAB_LABEL[s])

/**
 * Two pages share these lists (Romit 2026-10-27, "why are categories and tags at Settings? When I click on them, it switches to
 * the Skills navigation"; ledger D-L21): "Categories and tags" is its own page under Skills (admin/categories-tags) and Settings
 * (admin/settings) keeps clinical settings and evaluators. Each page shows only its own sections; the first is its landing.
 */
export type SettingsScope = "vocabulary" | "program"
export const SCOPE_SECTIONS: Record<SettingsScope, SettingsSection[]> = {
  vocabulary: ["categories", "tags"],
  program: ["settings", "evaluators", "student-groups"],
}
export const VOCABULARY_TITLE = "Categories and tags"
export const isVocabularySection = (s: string | null | undefined): s is "categories" | "tags" => s === "categories" || s === "tags"
/** The section a page of this scope shows for a raw ?tab= / ?list= value: its own section, else its first. "instructors" (the
 *  former Lab instructors list) is the Evaluators section. */
export function scopeSection(scope: SettingsScope, raw: string | null | undefined): SettingsSection {
  const own = SCOPE_SECTIONS[scope]
  const s = raw === "instructors" && own.includes("evaluators") ? "evaluators" : raw
  return isSettingsSection(s) && own.includes(s) ? s : own[0]!
}

export interface SettingsRow extends Record<string, unknown> {
  id: string
  name: string
  active: boolean
  /** How many things reference it; 0 means delete is allowed. */
  uses: number
  /** The reason delete is blocked, in words ("Used by 4 skills"), or null when it can be deleted. */
  blocked: string | null
  /** Added in this session. */
  isNew: boolean
}

export interface CategoryRow extends SettingsRow {
  skills: number
}
export interface TagRow extends SettingsRow {
  skills: number
  categories: number
}
export interface ClinicalSettingRow extends SettingsRow {
  sites: number
  evidence: number
  /** Skills whose rule sets a minimum in this setting. */
  rules: number
  courses: number
}
export interface InstructorRow extends SettingsRow {
  email: string
  evaluations: number
  verified: boolean
}

export interface SettingsOverlay {
  added: Array<{ tab: SettingsTab; name: string; email?: string }>
  inactive: string[]
  reactivated: string[]
  deleted: string[]
}
export const EMPTY_SETTINGS: SettingsOverlay = { added: [], inactive: [], reactivated: [], deleted: [] }

const fmt = (n: number) => n.toLocaleString("en-US")
const plural = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`
export const settingId = (tab: SettingsTab, name: string) => `${tab}:${name.trim().toLowerCase()}`

function finish<T extends SettingsRow>(rows: T[], tab: SettingsTab, overlay: SettingsOverlay, make: (name: string, email?: string) => T): T[] {
  const added = overlay.added.filter((a) => a.tab === tab).map((a) => ({ ...make(a.name, a.email), isNew: true }))
  return [...added, ...rows]
    .filter((r) => !overlay.deleted.includes(r.id))
    .map((r) => {
      const inactive = (overlay.inactive.includes(r.id) || !r.active) && !overlay.reactivated.includes(r.id)
      return { ...r, active: !inactive }
    })
}

/**
 * Categories and tags come from the SHARED vocabulary (lib/v2/vocabulary.ts, `state.vocabulary`), never a page-local list, so a
 * category made here is offered in Add a skill and an inactive one is marked on the skills that keep it (REQ SL-03 to SL-06).
 * Counts are by name over the skills. The overlay no longer applies to these two lists; it stays for clinical settings and
 * lab instructors.
 */
export function categoryRows(s: V2State, _overlay: SettingsOverlay = EMPTY_SETTINGS, noun = "skill", nouns = "skills"): CategoryRow[] {
  const by = new Map<string, number>()
  for (const k of s.skills) if (k.category) by.set(k.category.trim().toLowerCase(), (by.get(k.category.trim().toLowerCase()) ?? 0) + 1)
  return getVocabulary(s).categories.map((e) => {
    const n = by.get(e.name.trim().toLowerCase()) ?? 0
    return { id: e.id, name: e.name, active: e.active, uses: n, skills: n, blocked: n ? `Used by ${plural(n, noun, nouns)}` : null, isNew: !s.vocabulary ? false : !SEEDED.has(e.id) && n === 0 }
  })
}

export function tagRows(s: V2State, _overlay: SettingsOverlay = EMPTY_SETTINGS, noun = "skill", nouns = "skills"): TagRow[] {
  const by = new Map<string, { skills: number; cats: Set<string> }>()
  for (const k of s.skills) for (const t of k.tags ?? []) {
    const id = t.trim().toLowerCase()
    const x = by.get(id) ?? { skills: 0, cats: new Set<string>() }
    x.skills++
    x.cats.add(k.category)
    by.set(id, x)
  }
  return getVocabulary(s).tags.map((e) => {
    const x = by.get(e.name.trim().toLowerCase())
    const n = x?.skills ?? 0
    return { id: e.id, name: e.name, active: e.active, uses: n, skills: n, categories: x?.cats.size ?? 0, blocked: n ? `Used by ${plural(n, noun, nouns)}` : null, isNew: !s.vocabulary ? false : !SEEDED.has(e.id) && n === 0 }
  })
}

/** Ids the derived list starts with; an entry outside it, still unused, reads "New". Filled once from the first state seen. */
const SEEDED = new Set<string>()
export function rememberSeededVocabulary(s: V2State): void {
  if (SEEDED.size || s.vocabulary) return
  const v = getVocabulary(s)
  for (const e of [...v.categories, ...v.tags]) SEEDED.add(e.id)
}

/**
 * Inactive rows sort last (map D5), keeping their order otherwise. `held`: ids switched during this visit, which stay where they
 * were until the list is next opened, so a row does not jump away from the switch just pressed [INFER].
 */
export function inactiveLast<T extends SettingsRow>(rows: readonly T[], held: ReadonlySet<string> = new Set()): T[] {
  const settled = (r: T) => (held.has(r.id) ? !r.active : r.active)
  return [...rows.filter(settled), ...rows.filter((r) => !settled(r))]
}

export function clinicalSettingRows(s: V2State, overlay: SettingsOverlay = EMPTY_SETTINGS, noun = "skill", nouns = "skills"): ClinicalSettingRow[] {
  const sites = s.sites ?? []
  const courses = s.courses ?? [s.course, ...(s.otherCourses ?? [])]
  const off = s.program.inactiveClinicalSettings ?? []
  const rows: ClinicalSettingRow[] = [...s.program.clinicalSettings, ...off].map((name) => {
    const siteN = sites.filter((x) => x.clinicalSetting === name && x.active).length
    const evidence = s.evaluations.filter((e) => e.clinicalSetting && currentSettingName(s.program, e.clinicalSetting) === name).length
    const rules = s.skills.filter((k) => k.config?.achievement.settingMinimums.some((m) => m.setting === name)).length
    const courseN = courses.filter((c) => c.clinicalSettings.includes(name)).length
    const uses = siteN + evidence + rules + courseN
    const parts = [siteN ? plural(siteN, "site", "sites") : "", evidence ? plural(evidence, "evaluation", "evaluations") : "", rules ? `${plural(rules, noun, nouns)}' rules` : "", courseN ? plural(courseN, "course", "courses") : ""].filter(Boolean)
    return { id: settingId("settings", name), name, active: !off.includes(name), uses, sites: siteN, evidence, rules, courses: courseN, blocked: uses ? `Used by ${parts.join(", ")}` : null, isNew: false }
  })
  return finish(rows, "settings", overlay, (name) => ({ id: settingId("settings", name), name, active: true, uses: 0, sites: 0, evidence: 0, rules: 0, courses: 0, blocked: null, isNew: true }))
}

export function instructorRows(s: V2State, overlay: SettingsOverlay = EMPTY_SETTINGS): InstructorRow[] {
  const count = new Map<string, number>()
  for (const e of s.evaluations) count.set(e.evaluatorId, (count.get(e.evaluatorId) ?? 0) + 1)
  const rows: InstructorRow[] = s.people
    .filter((p) => p.kind === "lab-instructor")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => {
      const n = count.get(p.id) ?? 0
      return { id: `instructors:${p.id}`, name: p.name, email: p.email, active: true, uses: n, evaluations: n, verified: p.verified !== false, blocked: n ? `Signed ${plural(n, "evaluation", "evaluations")}` : null, isNew: false }
    })
  return finish(rows, "instructors", overlay, (name, email) => ({ id: settingId("instructors", name), name, email: email ?? "", active: true, uses: 0, evaluations: 0, verified: true, blocked: null, isNew: true }))
}

export interface UseLine {
  key: string
  primary: string
  secondary: string
}

/** What references one entry: the list a count opens. Its length equals the count shown (`uses` minus nothing). */
export type SettingUse = "sites" | "rules" | "courses"

export function usesOf(s: V2State, tab: SettingsTab, name: string, id?: string, what: SettingUse = "sites"): UseLine[] {
  if (tab === "settings" && what === "rules") return s.skills.filter((k) => k.config?.achievement.settingMinimums.some((m) => m.setting === name)).sort((a, b) => a.name.localeCompare(b.name)).map((k) => ({ key: k.id, primary: k.name, secondary: `At least ${k.config!.achievement.settingMinimums.find((m) => m.setting === name)!.min} in ${inSentence(name)}` }))
  if (tab === "settings" && what === "courses") return (s.courses ?? [s.course, ...(s.otherCourses ?? [])]).filter((c) => c.clinicalSettings.includes(name)).map((c) => ({ key: c.id, primary: `${c.code} ${c.name}`, secondary: c.cohort }))
  if (tab === "categories") return s.skills.filter((k) => k.category === name).sort((a, b) => a.name.localeCompare(b.name)).map((k) => ({ key: k.id, primary: k.name, secondary: CONFIGURATION_META[configurationOf(s, k)].label }))
  if (tab === "tags") return s.skills.filter((k) => (k.tags ?? []).includes(name)).sort((a, b) => a.name.localeCompare(b.name)).map((k) => ({ key: k.id, primary: k.name, secondary: k.category }))
  if (tab === "settings") return (s.sites ?? []).filter((x) => x.clinicalSetting === name && x.active).sort((a, b) => a.facility.localeCompare(b.facility) || a.unit.localeCompare(b.unit)).map((x) => {
    const primary = `${x.facility}, ${x.unit}`
    // Say it once: the seed's location often repeats the facility and unit, so it shows only when it adds something.
    return { key: x.id, primary, secondary: x.location && x.location !== primary ? x.location : "" }
  })
  const pid = (id ?? "").replace(/^instructors:/, "")
  const names = new Map(s.people.map((p) => [p.id, p.name]))
  const skill = new Map(s.skills.map((k) => [k.id, k.name]))
  return s.evaluations.filter((e) => e.evaluatorId === pid).sort((a, b) => (a.date < b.date ? 1 : -1)).map((e) => ({ key: e.id, primary: `${names.get(e.studentId) ?? "Student"}, ${skill.get(e.skillId) ?? e.skillId}`, secondary: e.date.slice(0, 10) }))
}

/** Validation for an inline create. Returns the error to show, or null. */
export function validateEntry(tab: SettingsTab, name: string, existing: readonly string[], email?: string): string | null {
  const n = name.trim()
  if (!n) return tab === "instructors" ? "Enter the instructor's name." : "Enter a name."
  if (n.length > 80) return "Use 80 characters or fewer."
  if (existing.some((x) => x.trim().toLowerCase() === n.toLowerCase())) return `"${n}" is already in the list.`
  if (tab === "settings" && LAB_OR_SIMULATION.test(n)) return NOT_A_CLINICAL_SETTING
  if (tab === "instructors") {
    const e = (email ?? "").trim()
    if (!e) return "Enter an email. Evaluation requests go to it."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Enter an email like name@example.org."
  }
  return null
}

// ---------------------------------------------------------------------------------------------------------------------
// Clinical settings: the program's list [REQ SL-07], in the store, so an edit survives a reload and reaches Add minimum.

/** Lab and simulation evidence never satisfies a clinical setting requirement [REQ SC-12], so neither can be named as a setting [INFER on refusing the name]. */
const LAB_OR_SIMULATION = /\b(labs?|simulations?)\b/i
const NOT_A_CLINICAL_SETTING = "Lab and simulation are recorded separately, so they cannot be clinical settings."

export type ClinicalSettingResult = { ok: true; state: V2State } | { ok: false; error: string }

const clinicalNames = (s: V2State) => [...s.program.clinicalSettings, ...(s.program.inactiveClinicalSettings ?? [])]

/** Errors for a new or changed name, also refusing the program's simulation settings. `except`: the name being changed. */
export function validateClinicalSetting(s: V2State, name: string, except?: string): string | null {
  const taken = clinicalNames(s).filter((x) => x !== except)
  const error = validateEntry("settings", name, taken)
  if (error) return error
  // Records still hold a former name, so it cannot become a second setting. Going back to this setting's own former name is fine.
  const former = Object.entries(s.program.clinicalSettingAliases ?? {}).find(([old]) => old.trim().toLowerCase() === name.trim().toLowerCase())
  if (former && former[1] !== except) return `"${name.trim()}" is the former name of ${former[1]}, and evaluations still hold it. Choose another name.`
  return s.program.simulationSettings.some((x) => x.trim().toLowerCase() === name.trim().toLowerCase()) ? NOT_A_CLINICAL_SETTING : null
}

export function addClinicalSetting(s: V2State, name: string, actorId: string, at: string): ClinicalSettingResult {
  const error = validateClinicalSetting(s, name)
  if (error) return { ok: false, error }
  return { ok: true, state: appendAudit({ ...s, program: { ...s.program, clinicalSettings: [...s.program.clinicalSettings, name.trim()] } }, actorId, "Added clinical setting", name.trim(), at) }
}

/** Active ones stay in `program.clinicalSettings`, the list every Add minimum and report filter reads; inactive ones move out of it. */
export function setClinicalSettingActive(s: V2State, name: string, active: boolean, actorId: string, at: string): ClinicalSettingResult {
  if (!clinicalNames(s).includes(name)) return { ok: false, error: "That clinical setting is no longer in the list." }
  const off = s.program.inactiveClinicalSettings ?? []
  if (off.includes(name) === !active) return { ok: true, state: s }
  const program = active
    ? { ...s.program, clinicalSettings: [...s.program.clinicalSettings, name], inactiveClinicalSettings: off.filter((x) => x !== name) }
    : { ...s.program, clinicalSettings: s.program.clinicalSettings.filter((x) => x !== name), inactiveClinicalSettings: [...off, name] }
  return { ok: true, state: appendAudit({ ...s, program }, actorId, active ? "Reactivated clinical setting" : "Deactivated clinical setting", name, at) }
}

export function deleteClinicalSetting(s: V2State, name: string, actorId: string, at: string): ClinicalSettingResult {
  const row = clinicalSettingRows(s).find((r) => r.name === name)
  if (!row) return { ok: false, error: "That clinical setting is no longer in the list." }
  if (row.blocked) return { ok: false, error: `${row.blocked}, so it cannot be deleted.` }
  const clinicalSettingAliases = Object.fromEntries(Object.entries(s.program.clinicalSettingAliases ?? {}).filter(([, now]) => now !== name))
  const program = { ...s.program, clinicalSettings: s.program.clinicalSettings.filter((x) => x !== name), inactiveClinicalSettings: (s.program.inactiveClinicalSettings ?? []).filter((x) => x !== name), clinicalSettingAliases }
  return { ok: true, state: appendAudit({ ...s, program }, actorId, "Deleted clinical setting", name, at) }
}

/**
 * The program's own lists that hold a clinical setting's name (sites, courses, locations, skill rules, drafts), keeping the same
 * object when nothing in it changes, so the saved delta holds only the rows that carry the name. Records are not in this walk.
 */
function withSettingRenamed<T>(value: T, from: string, to: string): T {
  if (Array.isArray(value)) {
    let changed = false
    const next = value.map((v) => {
      const w = withSettingRenamed(v, from, to)
      if (w !== v) changed = true
      return w
    })
    return changed ? (next as unknown as T) : value
  }
  if (!value || typeof value !== "object") return value
  let out: Record<string, unknown> | null = null
  const put = (k: string, v: unknown) => { (out ??= { ...(value as Record<string, unknown>) })[k] = v }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k === "clinicalSetting" && v === from) put(k, to)
    else if ((k === "clinicalSettings" || k === "inactiveClinicalSettings") && Array.isArray(v) && v.includes(from)) put(k, v.map((x) => (x === from ? to : x)))
    else if (k === "settingMinimums" && Array.isArray(v) && v.some((m) => m?.setting === from)) put(k, v.map((m) => (m?.setting === from ? { ...m, setting: to } : m)))
    else if (v && typeof v === "object") {
      const w = withSettingRenamed(v, from, to)
      if (w !== v) put(k, w)
    }
  }
  return (out ?? value) as T
}

/** Lists that are records, which keep what they were written with [REQ RV-03, RV-05] and read through the program's aliases (lib/v2/setting-names.ts). */
const KEEP_STORED = ["audit", "evaluations", "logEntries", "placements"] as const

/** The new name reaches the program's own lists; records keep their stored value and show the current name, so no count changes. */
export function renameClinicalSetting(s: V2State, from: string, name: string, actorId: string, at: string): ClinicalSettingResult {
  if (!clinicalNames(s).includes(from)) return { ok: false, error: "That clinical setting is no longer in the list." }
  const error = validateClinicalSetting(s, name, from)
  if (error) return { ok: false, error }
  const to = name.trim()
  if (to === from) return { ok: true, state: s }
  const rest: Partial<V2State> = { ...s }
  for (const k of KEEP_STORED) delete rest[k]
  const renamed = withSettingRenamed(rest, from, to)
  const program = { ...(renamed.program ?? s.program), clinicalSettingAliases: aliasesAfterRename(s.program.clinicalSettingAliases, from, to) }
  return { ok: true, state: appendAudit({ ...s, ...renamed, program }, actorId, "Renamed clinical setting", `${from} to ${to}`, at) }
}
