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
import { capitalize, skillListsNoun, skillNounPlural } from "./terms"
import { isVocabularySection, scopeSection, sectionLabel, type SettingsSection } from "./settings"
import { labHref, navHref, type LinkContext } from "./links"
import { findFlow } from "./flows"
import { WALKTHROUGH_ID, walkthroughFlow } from "./walkthrough"

export const SKILLS_PANEL_ID = "lab-skills"

/** Add a skill: every variant renders the library with the add surface open. */
export const ADD_SKILL_SCREEN = "admin/add-skill"

/** Configure the skill. Variant B (the default, D-L47) is a Skills panel page, below Library or below Evaluation settings. */
export const CONFIGURE_SKILL_SCREEN = "admin/configure-skill"
const CONFIGURE_PANEL_VARIANT = "B"
/** `?from=settings` on Configure the skill: opened from Evaluation settings, so that row and crumb hold, and Close returns there. */
export const FROM_EVALUATION_SETTINGS = "settings"
export const EVALUATION_SETTINGS_HREF = "/lab/admin/evaluation-settings"

export type SkillsPanelKey = "library" | "groups" | "categories" | "settings" | "mapping"

export interface SkillsPanelItem {
  key: SkillsPanelKey
  label: () => string
  /** "persona/slug" */
  screen: string
  /** Font Awesome class. */
  icon: string
}

/**
 * Panel rows in Sankalp's order of the admin's work [CALL 11-02] (Proposed 2026-11-02, contract V2-06). Evaluation settings
 * (program level, times needed included) sits after Categories and tags. No checklist page (Romit 2026-11-02).
 */
export const SKILLS_PANEL: SkillsPanelItem[] = [
  { key: "groups", label: () => capitalize(skillListsNoun()), screen: "admin/lists-cohorts", icon: "fa-layer-group" },
  { key: "library", label: () => "Library", screen: "admin/skills-library", icon: "fa-book" },
  { key: "categories", label: () => "Categories and tags", screen: "admin/categories-tags", icon: "fa-tags" },
  { key: "settings", label: () => "Evaluation settings", screen: "admin/evaluation-settings", icon: "fa-sliders" },
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
export function skillsPanelItemFor(screen: string | undefined, params?: Params | null, variant?: string): SkillsPanelItem | undefined {
  if (!screen) return undefined
  if (screen === CONFIGURE_SKILL_SCREEN) {
    if (variant !== CONFIGURE_PANEL_VARIANT) return undefined
    const key: SkillsPanelKey = params?.get("from") === FROM_EVALUATION_SETTINGS ? "settings" : "library"
    return SKILLS_PANEL.find((i) => i.key === key)
  }
  // Add a skill is the library with its add sheet (or inline row) open, so it is a Library page: Skills row lit, panel open,
  // Library selected, crumb "Skills" (D-X33 extended 2026-11-03, D-L41), the same sidebar as the steps around it.
  // Starting points and Bulk upload are ways to add to the Library too, reached from its Add menu.
  if (screen === ADD_SKILL_SCREEN || screen === "admin/starter-library" || screen === "admin/import-ai-review") return SKILLS_PANEL.find((i) => i.key === "library")
  return SKILLS_PANEL.find((i) => i.screen === screen)
}

/** The panel row to select. */
export function selectedSkillsPanelKey(screen: string | undefined, params?: Params | null, variant?: string): SkillsPanelKey | undefined {
  return skillsPanelItemFor(screen, params, variant)?.key
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

const LIBRARY_SCREEN = "admin/skills-library"

/**
 * The link context a Skills nav link (the Skills row, a panel row, the "Skills" crumb) is built from (Romit 2026-11-13, "when i click
 * on skills nav, it needs to go through skills checklist nav walkthrough"). The Skills nav opens the admin walkthrough's page for that
 * row, without the lab strip, unless the page is itself a Skills page of a lab flow that holds the row's screen (a designer comparing
 * an option set of the Skills pages stays in it). Before, a page outside the walkthrough (Dashboard, Approvals, Reports or Settings,
 * all design flows, or a /as/ screen URL) sent the Skills rows to the design flows or to /as/admin/evaluation-settings, which carry
 * the strip. The lab view stays one deliberate step away: the lab index (/all), the lab strip's flow menu, and /flow/... or /as/...
 * URLs.
 */
export function skillsNavContext(screen: string, ctx: LinkContext): LinkContext {
  const page = findFlow(ctx.flowId)
  if (page?.walkthrough) return ctx
  const onLabSkillsPage = !!skillsPanelItemFor(ctx.screen, ctx.carry, ctx.variant)
  if (onLabSkillsPage && page?.steps.some((s) => s.screen === screen)) return ctx
  if (!walkthroughFlow(WALKTHROUGH_ID)?.steps.some((s) => s.screen === screen)) return ctx
  return { flowId: WALKTHROUGH_ID, carry: ctx.carry }
}

/** The Skills row and the "Skills" crumb: the Library, in the walkthrough unless the page's lab flow holds it (skillsNavContext). */
export function skillsNavHref(ctx: LinkContext): string {
  return navHref(LIBRARY_SCREEN, skillsNavContext(LIBRARY_SCREEN, ctx))
}

/** Where a Skills panel item goes, keeping the option set and the scope (in the walkthrough, skillsNavContext). */
export function skillsPanelHref(item: SkillsPanelItem, ctx: LinkContext): string {
  const nav = skillsNavContext(item.screen, ctx)
  if (item.key === "library") return navHref(item.screen, nav)
  return labHref(item.screen, item.key === "categories" ? { tab: null, list: null, entry: null } : {}, nav)
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
