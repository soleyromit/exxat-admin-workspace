/**
 * Admin information architecture (Romit 2026-10-27, "yes, apply it"; ledger D-L20): four sidebar rows (Dashboard, Skills,
 * Approvals, Reports) and a Settings link in the sidebar footer. The Skills row opens a secondary panel with the four places
 * a program sets its skills up (Sankalp's admin steps, docs/knowledge/design/thursday-flows-sankalp.md): Library, Groups of
 * skills, Categories and tags, Course mapping. Settings holds the program settings: Clinical settings, Evaluators (the former
 * evaluator directory and Lab instructors list, D-L24) (the noun has no UI, D-L25). Categories and tags is its own page under Skills only (Romit
 * 2026-10-27, "why are categories and tags at Settings? When I click on them, it switches to the Skills navigation"; ledger
 * D-L21). Old URLs redirect (legacySettingsHref, legacyDirectoryHref).
 *
 * One source for the sidebar (components/lab/lab-frame.tsx), the panel, the breadcrumb and the tests. Slugs never change.
 */
import { capitalize, skillNounPlural } from "./terms"
import { isVocabularySection, scopeSection, sectionLabel, type SettingsSection } from "./settings"
import { labHref, navHref, type LinkContext } from "./links"

export const SKILLS_PANEL_ID = "lab-skills"

export type SkillsPanelKey = "library" | "groups" | "categories" | "mapping"

export interface SkillsPanelItem {
  key: SkillsPanelKey
  label: () => string
  /** "persona/slug" */
  screen: string
  /** Font Awesome class. */
  icon: string
}

export const SKILLS_PANEL: SkillsPanelItem[] = [
  { key: "library", label: () => "Library", screen: "admin/skills-library", icon: "fa-book" },
  { key: "groups", label: () => `Groups of ${skillNounPlural()}`, screen: "admin/lists-cohorts", icon: "fa-layer-group" },
  { key: "categories", label: () => "Categories and tags", screen: "admin/categories-tags", icon: "fa-tags" },
  { key: "mapping", label: () => "Course mapping", screen: "admin/course-mapping", icon: "fa-sitemap" },
]

/** The panel's title and the Skills crumb: the program's noun ("Skills", "Competencies"). */
export const skillsLabel = (): string => capitalize(skillNounPlural())

interface Params { get(k: string): string | null }

/** The Settings page section in the URL (variant A reads ?tab=, variant B ?list=, either works on both): Settings' own only. */
export function settingsSectionOf(params: Params | null | undefined): SettingsSection {
  return scopeSection("program", params?.get("tab") ?? params?.get("list"))
}

/** The Skills panel item the page is on, if any. Settings is never one (D-L21). */
export function skillsPanelItemFor(screen: string | undefined, _params?: Params | null): SkillsPanelItem | undefined {
  if (!screen) return undefined
  return SKILLS_PANEL.find((i) => i.screen === screen)
}

/** Pages under the Settings link: Settings (clinical settings, evaluators). */
export function isSettingsArea(screen: string | undefined, _params?: Params | null): boolean {
  return screen === "admin/settings"
}

export const VOCABULARY_SCREEN = "admin/categories-tags"

/**
 * Where an evaluator name awaiting verification is decided: Approvals, "New evaluators" (Romit 2026-10-27, D-L23 and D-X36; the Approvals
 * page owns the tab). The Settings Evaluators list links each unverified row here.
 */
export const NEW_EVALUATORS_HREF = "/lab/admin/approvals?tab=new-evaluators"

const withQuery = (path: string, q: URLSearchParams) => {
  const s = q.toString()
  return s ? `${path}?${s}` : path
}

/**
 * Old Settings URLs whose section moved, or null when the URL is a Settings section:
 * - Categories or Tags (`?tab=categories|tags`, or variant B's `?list=`) live on their own page (D-L21). Categories is that
 *   page's landing, so it needs no param; Tags keeps the param name it came with.
 * - Lab instructors (`?tab=instructors`) is the Evaluators section with the role filter on Lab instructor (D-L24).
 * Every other param (variant, set, scope, entry) is kept.
 */
export function legacySettingsHref(query: URLSearchParams): string | null {
  const key = query.has("tab") ? "tab" : "list"
  const raw = query.get(key)
  const q = new URLSearchParams(query)
  if (raw === "instructors") {
    q.set(key, "evaluators")
    if (!q.get("role")) q.set("role", "lab-instructor")
    return withQuery("/lab/admin/settings", q)
  }
  if (!isVocabularySection(raw)) return null
  q.delete("tab")
  q.delete("list")
  if (raw === "tags") q.set(key, "tags")
  return withQuery(`/lab/${VOCABULARY_SCREEN}`, q)
}

/**
 * The former evaluator directory page (`/lab/admin/evaluator-directory`, any variant) is the Settings section Evaluators (D-L24):
 * its filters (q, role, site, setting, filter) and variant ride along.
 */
export function legacyDirectoryHref(query: URLSearchParams): string {
  const q = new URLSearchParams(query)
  q.delete("list")
  q.set("tab", "evaluators")
  return withQuery("/lab/admin/settings", q)
}

/** Where a Skills panel item goes, keeping the option set and the scope. */
export function skillsPanelHref(item: SkillsPanelItem, ctx: LinkContext): string {
  if (item.key === "library") return navHref(item.screen, ctx)
  return labHref(item.screen, item.key === "categories" ? { tab: null, list: null, entry: null } : {}, ctx)
}

/** The Settings footer link: the Settings page on its first program section (clinical settings), set-aware. */
export function settingsHref(ctx: LinkContext): string {
  return labHref("admin/settings", { tab: "settings" }, ctx)
}

/** The leaf crumb under "Settings": the section's own name (the H1), "Evaluators" included. */
export function settingsLeaf(screen: string | undefined, params: Params | null | undefined): string | undefined {
  if (screen === "admin/settings") return sectionLabel(settingsSectionOf(params))
  return undefined
}
