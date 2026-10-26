import type { V2State } from "@/lib/v2/types"

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
 * Naming (CALL 10-26 item 7): what the program calls the things students get signed off on. Not a list, so it is a page
 * section beside the four lists (a tab in A, a row in B), placed last so Categories stays the default landing. The value
 * lives in lib/lab/terms.ts; every screen that calls skillNoun() or skillNounPlural() follows it.
 */
export type SettingsSection = SettingsTab | "naming"
export const SETTINGS_SECTIONS: SettingsSection[] = [...SETTINGS_TABS, "naming"]
export const isSettingsSection = (v: string | null | undefined): v is SettingsSection => SETTINGS_SECTIONS.includes(v as SettingsSection)
export const NAMING_LABEL = "Naming"
export const sectionLabel = (s: SettingsSection): string => (s === "naming" ? NAMING_LABEL : SETTINGS_TAB_LABEL[s])
/** Helper chips under the fields: one click fills both. "Skill" is the default and the way back. */
export const NAMING_EXAMPLES: ReadonlyArray<{ one: string; many: string }> = [
  { one: "skill", many: "skills" },
  { one: "competency", many: "competencies" },
  { one: "EPA", many: "EPAs" },
]

export interface NamingErrors {
  one?: string
  many?: string
}

/** Both words are required and short. Returns no keys when the pair is valid. */
export function validateNaming(one: string, many: string): NamingErrors {
  const a = one.trim()
  const b = many.trim()
  const e: NamingErrors = {}
  if (!a) e.one = "Enter the word for one."
  else if (a.length > 40) e.one = "Use 40 characters or fewer."
  if (!b) e.many = "Enter the word for more than one."
  else if (b.length > 40) e.many = "Use 40 characters or fewer."
  return e
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

export function categoryRows(s: V2State, overlay: SettingsOverlay = EMPTY_SETTINGS, noun = "skill", nouns = "skills"): CategoryRow[] {
  const by = new Map<string, number>()
  for (const k of s.skills) by.set(k.category, (by.get(k.category) ?? 0) + 1)
  const rows: CategoryRow[] = [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([name, n]) => ({ id: settingId("categories", name), name, active: true, uses: n, skills: n, blocked: n ? `Used by ${plural(n, noun, nouns)}` : null, isNew: false }))
  return finish(rows, "categories", overlay, (name) => ({ id: settingId("categories", name), name, active: true, uses: 0, skills: 0, blocked: null, isNew: true }))
}

export function tagRows(s: V2State, overlay: SettingsOverlay = EMPTY_SETTINGS, noun = "skill", nouns = "skills"): TagRow[] {
  const by = new Map<string, { skills: number; cats: Set<string> }>()
  for (const k of s.skills) for (const t of k.tags ?? []) {
    const x = by.get(t) ?? { skills: 0, cats: new Set<string>() }
    x.skills++
    x.cats.add(k.category)
    by.set(t, x)
  }
  const rows: TagRow[] = [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([name, x]) => ({ id: settingId("tags", name), name, active: true, uses: x.skills, skills: x.skills, categories: x.cats.size, blocked: x.skills ? `Used by ${plural(x.skills, noun, nouns)}` : null, isNew: false }))
  return finish(rows, "tags", overlay, (name) => ({ id: settingId("tags", name), name, active: true, uses: 0, skills: 0, categories: 0, blocked: null, isNew: true }))
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
  if (tab === "settings" && what === "rules") return s.skills.filter((k) => k.config?.achievement.settingMinimums.some((m) => m.setting === name)).sort((a, b) => a.name.localeCompare(b.name)).map((k) => ({ key: k.id, primary: k.name, secondary: `At least ${k.config!.achievement.settingMinimums.find((m) => m.setting === name)!.min} in ${name}` }))
  if (tab === "settings" && what === "courses") return (s.courses ?? [s.course, ...(s.otherCourses ?? [])]).filter((c) => c.clinicalSettings.includes(name)).map((c) => ({ key: c.id, primary: `${c.code} ${c.name}`, secondary: c.cohort }))
  if (tab === "categories") return s.skills.filter((k) => k.category === name).sort((a, b) => a.name.localeCompare(b.name)).map((k) => ({ key: k.id, primary: k.name, secondary: k.configured ? "Configured" : "Not configured" }))
  if (tab === "tags") return s.skills.filter((k) => (k.tags ?? []).includes(name)).sort((a, b) => a.name.localeCompare(b.name)).map((k) => ({ key: k.id, primary: k.name, secondary: k.category }))
  if (tab === "settings") return (s.sites ?? []).filter((x) => x.clinicalSetting === name && x.active).sort((a, b) => a.facility.localeCompare(b.facility) || a.unit.localeCompare(b.unit)).map((x) => ({ key: x.id, primary: `${x.facility}, ${x.unit}`, secondary: x.location }))
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
