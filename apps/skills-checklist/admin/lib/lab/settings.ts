import type { V2State } from "@/lib/v2/types"
import { getVocabulary } from "@/lib/v2/vocabulary"
import { inSentence } from "./terms"

/**
 * Program settings (REQ SL-03 to SL-08; AUDIT T1: no settings screen exists, `GET /v2/admin/settings` 404).
 *
 * Four program-defined lists: categories (SL-03), tags (SL-04), clinical settings (SL-07) and lab instructors (SL-08).
 * Pure functions over the read-only seed plus a lab-local overlay (entries added, deactivated or deleted in this session).
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
export type SettingsSection = SettingsTab | "evaluators"
export const SETTINGS_SECTIONS: SettingsSection[] = [...SETTINGS_TABS, "evaluators"]
export const isSettingsSection = (v: string | null | undefined): v is SettingsSection => SETTINGS_SECTIONS.includes(v as SettingsSection)
/**
 * Evaluators (Romit 2026-10-27, "sure"; ledger D-L24): the full list of people who sign (preceptors, clinical faculty, lab
 * instructors) is a Settings section, for lookup and edits. Lab instructors are the same records (people of kind
 * "lab-instructor" in the directory), so the former Lab instructors list is this section with the role filter set to Lab
 * instructor; adding one is "Add an evaluator" with that role (name and email, REQ SL-08).
 */
export const EVALUATORS_LABEL = "Evaluators"
export const sectionLabel = (s: SettingsSection): string => (s === "evaluators" ? EVALUATORS_LABEL : SETTINGS_TAB_LABEL[s])

/**
 * Two pages share these lists (Romit 2026-10-27, "why are categories and tags at Settings? When I click on them, it switches to
 * the Skills navigation"; ledger D-L21): "Categories and tags" is its own page under Skills (admin/categories-tags) and Settings
 * (admin/settings) keeps clinical settings and evaluators. Each page shows only its own sections; the first is its landing.
 */
export type SettingsScope = "vocabulary" | "program"
export const SCOPE_SECTIONS: Record<SettingsScope, SettingsSection[]> = {
  vocabulary: ["categories", "tags"],
  program: ["settings", "evaluators"],
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

export function clinicalSettingRows(s: V2State, overlay: SettingsOverlay = EMPTY_SETTINGS, noun = "skill", nouns = "skills"): ClinicalSettingRow[] {
  const sites = s.sites ?? []
  const courses = s.courses ?? [s.course, ...(s.otherCourses ?? [])]
  const rows: ClinicalSettingRow[] = s.program.clinicalSettings.map((name) => {
    const siteN = sites.filter((x) => x.clinicalSetting === name && x.active).length
    const evidence = s.evaluations.filter((e) => e.clinicalSetting === name).length
    const rules = s.skills.filter((k) => k.config?.achievement.settingMinimums.some((m) => m.setting === name)).length
    const courseN = courses.filter((c) => c.clinicalSettings.includes(name)).length
    const uses = siteN + evidence + rules + courseN
    const parts = [siteN ? plural(siteN, "site", "sites") : "", evidence ? plural(evidence, "evaluation", "evaluations") : "", rules ? `${plural(rules, noun, nouns)}' rules` : "", courseN ? plural(courseN, "course", "courses") : ""].filter(Boolean)
    return { id: settingId("settings", name), name, active: true, uses, sites: siteN, evidence, rules, courses: courseN, blocked: uses ? `Used by ${parts.join(", ")}` : null, isNew: false }
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
  if (tab === "categories") return s.skills.filter((k) => k.category === name).sort((a, b) => a.name.localeCompare(b.name)).map((k) => ({ key: k.id, primary: k.name, secondary: k.configured ? "Configured" : "Not configured" }))
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
  if (tab === "instructors") {
    const e = (email ?? "").trim()
    if (!e) return "Enter an email. Evaluation requests go to it."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Enter an email like name@example.org."
  }
  return null
}
