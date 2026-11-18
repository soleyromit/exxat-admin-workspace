/**
 * Where a page reached from another page goes back to (Romit 2026-10-27: "there is no proper back menu when I go in the context
 * menu to another page, it doesn't feel connected"). The origin rides in the URL as `?from=<key>`, so the breadcrumb shows the
 * way back and Cancel returns where the user came from rather than to a fixed route. Product words only; never a lab label.
 */
import { toShort } from "../short-urls"
import { capitalize, skillListsNoun, skillNoun } from "./terms"

export const FROM_PARAM = "from"

interface ReturnTarget {
  /** The crumb label: the destination's nav row word. */
  label: () => string
  href: string
  /** The same page opened on one record: the origin carries the id of what the user left (`?list=`), so Back lands where they were. */
  hrefFor?: (id: string) => string
  /** The URL param that holds that id on the page reached (`list` for lists, `skill` for configure). */
  carryKey?: string
}

/** On Skill lists, `?list=<id>&setup=configure` reopens New skill list on that list's Configure step (step 3 of 4). */
export const SETUP_PARAM = "setup"
export const SETUP_CONFIGURE = "configure"

/** A link out of the Configure step that offers the way back to it: `?from=setup&list=<id>`. */
export function fromSetup(href: string, listId: string): string {
  return `${withFrom(href, "setup")}&list=${encodeURIComponent(listId)}`
}

/** The Skill lists page, short form; `?list=<id>` reopens that list's panel (lists-frame). */
const LISTS_HREF = toShort("/lab/admin/lists-cohorts")

export const RETURN_TARGETS: Record<string, ReturnTarget> = {
  lists: { label: () => capitalize(skillListsNoun()), href: LISTS_HREF, hrefFor: (id) => toShort(`/lab/admin/lists-cohorts?list=${encodeURIComponent(id)}`), carryKey: "list" },
  // Step 3 of New skill list (Configure skills), left for Evaluation settings or one skill: `?from=setup&list=<id>` leads back to that
  // list's Configure step (lists-frame reads `?setup=configure`), so the wizard is not lost (Sankalp point 7). The crumb reads the list's name.
  setup: { label: () => capitalize(skillListsNoun()), href: LISTS_HREF, hrefFor: (id) => toShort(`/lab/admin/lists-cohorts?list=${encodeURIComponent(id)}&${SETUP_PARAM}=${SETUP_CONFIGURE}`), carryKey: "list" },
  // A list's skills page (the Library row is gone, Romit 2026-11-16): `?from=skills&list=<id>` leads back to that list's skills; the breadcrumb
  // reads the list's name (components/lab/lab-frame.tsx). With no id, the page shows the default list.
  skills: { label: () => capitalize(skillListsNoun()), href: toShort("/lab/admin/skills-library"), hrefFor: (id) => toShort(`/lab/admin/skills-library?list=${encodeURIComponent(id)}`), carryKey: "list" },
  // Configure one skill, left for Evaluation settings: `?from=configure&skill=<id>` leads back to that skill's page. With no id
  // the way back is the Library, since Configure has no page without a skill.
  // Evaluation settings, left by "31 use their own number" for the Library filtered to those skills: the crumb leads back to the settings page.
  settings: { label: () => "Evaluation methods", href: toShort("/lab/admin/evaluation-settings") },
  configure: { label: () => capitalize(skillNoun()), href: toShort("/lab/admin/skills-library"), hrefFor: (id) => toShort(`/lab/admin/configure-skill?skill=${encodeURIComponent(id)}`), carryKey: "skill" },
}

/** The page's own title for its leaf crumb, so the breadcrumb and the H1 say one thing ("Skills > Bulk upload"). */
export const LEAF_TITLE: Record<string, () => string> = {
  "admin/evaluation-settings": () => "Evaluation methods",
  "admin/import-ai-review": () => "Bulk upload",
  "admin/lists-cohorts": () => capitalize(skillListsNoun()),
  "admin/starter-library": () => "Starting points",
}

/** The target `from` names; with `carry` (the record id in the URL) and a target that takes one, its href reopens that record. */
export function returnTarget(from: string | null | undefined, carry?: string | null): ReturnTarget | undefined {
  const t = from && Object.hasOwn(RETURN_TARGETS, from) ? RETURN_TARGETS[from] : undefined
  return t && carry && t.hrefFor ? { ...t, href: t.hrefFor(carry) } : t
}

/** The record id a `from` target reopens, read from the page's params under the target's own key. */
export function returnCarry(from: string | null | undefined, params: { get(name: string): string | null } | null | undefined): string | null {
  const key = from && Object.hasOwn(RETURN_TARGETS, from) ? RETURN_TARGETS[from]!.carryKey : undefined
  return key ? params?.get(key) ?? null : null
}

/**
 * The origins that earn an in-page "Back to ..." control (walk 3, D13; amends D-L42): a page opened from a skill list's panel or from
 * step 3 of New skill list. A page opened plainly has only its breadcrumb and the Skills panel.
 */
export const IN_PAGE_RETURN = ["setup", "lists"] as const

/** The in-page return origin in these params, if any: its key and the list it reopens. */
export function inPageReturn(params: { get(name: string): string | null } | null | undefined): { from: (typeof IN_PAGE_RETURN)[number]; list: string } | null {
  const from = params?.get(FROM_PARAM)
  const list = params?.get("list")
  return from && list && (IN_PAGE_RETURN as readonly string[]).includes(from) ? { from: from as (typeof IN_PAGE_RETURN)[number], list } : null
}

/**
 * `href` carrying the way back the current page holds (`?from=setup&list=`, `?from=lists&list=`), so a link onward (the Library panel's
 * Configure) still returns to the list that started it. Unchanged when the page holds none, or when `href` names its own origin.
 */
export function carryReturn(href: string, params: { get(name: string): string | null } | null | undefined): string {
  const r = inPageReturn(params)
  if (!r || /[?&]from=/.test(href)) return href
  return `${withFrom(href, r.from)}&list=${encodeURIComponent(r.list)}`
}

/** `href` with `?from=<key>` appended, keeping its own query. */
export function withFrom(href: string, from: keyof typeof RETURN_TARGETS & string): string {
  return `${href}${href.includes("?") ? "&" : "?"}${FROM_PARAM}=${from}`
}

/** Where Cancel or Back goes: the origin in the URL when there is one, else `fallback`. */
export function returnHref(from: string | null | undefined, fallback: string, carry?: string | null): string {
  return returnTarget(from, carry)?.href ?? fallback
}
