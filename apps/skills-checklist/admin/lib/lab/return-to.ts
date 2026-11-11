/**
 * Where a page reached from another page goes back to (Romit 2026-10-27: "there is no proper back menu when I go in the context
 * menu to another page, it doesn't feel connected"). The origin rides in the URL as `?from=<key>`, so the breadcrumb shows the
 * way back and Cancel returns where the user came from rather than to a fixed route. Product words only; never a lab label.
 */
import { toShort } from "../short-urls"
import { capitalize, skillListsNoun, skillNoun, skillNounPlural } from "./terms"

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

/** The Skill lists page, short form; `?list=<id>` reopens that list's panel (lists-frame). */
const LISTS_HREF = toShort("/lab/admin/lists-cohorts")

export const RETURN_TARGETS: Record<string, ReturnTarget> = {
  lists: { label: () => capitalize(skillListsNoun()), href: LISTS_HREF, hrefFor: (id) => toShort(`/lab/admin/lists-cohorts?list=${encodeURIComponent(id)}`), carryKey: "list" },
  skills: { label: () => capitalize(skillNounPlural()), href: toShort("/lab/admin/skills-library") },
  // Configure one skill, left for Evaluation settings: `?from=configure&skill=<id>` leads back to that skill's page. With no id
  // the way back is the Library, since Configure has no page without a skill.
  configure: { label: () => capitalize(skillNoun()), href: toShort("/lab/admin/skills-library"), hrefFor: (id) => toShort(`/lab/admin/configure-skill?skill=${encodeURIComponent(id)}`), carryKey: "skill" },
}

/** The page's own title for its leaf crumb, so the breadcrumb and the H1 say one thing ("Skills > Bulk upload"). */
export const LEAF_TITLE: Record<string, () => string> = {
  "admin/evaluation-settings": () => "Evaluation settings",
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

/** `href` with `?from=<key>` appended, keeping its own query. */
export function withFrom(href: string, from: keyof typeof RETURN_TARGETS & string): string {
  return `${href}${href.includes("?") ? "&" : "?"}${FROM_PARAM}=${from}`
}

/** Where Cancel or Back goes: the origin in the URL when there is one, else `fallback`. */
export function returnHref(from: string | null | undefined, fallback: string, carry?: string | null): string {
  return returnTarget(from, carry)?.href ?? fallback
}
