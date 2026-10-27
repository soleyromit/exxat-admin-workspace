/**
 * Where a page reached from another page goes back to (Romit 2026-10-27: "there is no proper back menu when I go in the context
 * menu to another page, it doesn't feel connected"). The origin rides in the URL as `?from=<key>`, so the breadcrumb shows the
 * way back and Cancel returns where the user came from rather than to a fixed route. Product words only; never a lab label.
 */
import { capitalize, skillNounPlural } from "./terms"

export const FROM_PARAM = "from"

interface ReturnTarget {
  /** The crumb label: the destination's nav row word. */
  label: () => string
  href: string
}

export const RETURN_TARGETS: Record<string, ReturnTarget> = {
  skills: { label: () => capitalize(skillNounPlural()), href: "/lab/admin/skills-library" },
}

/** The page's own title for its leaf crumb, so the breadcrumb and the H1 say one thing ("Skills > Bulk upload"). */
export const LEAF_TITLE: Record<string, () => string> = {
  "admin/import-ai-review": () => "Bulk upload",
  "admin/lists-cohorts": () => `Groups of ${skillNounPlural()}`,
  "admin/starter-library": () => "Starting points",
}

export function returnTarget(from: string | null | undefined): ReturnTarget | undefined {
  return from ? RETURN_TARGETS[from] : undefined
}

/** `href` with `?from=<key>` appended, keeping its own query. */
export function withFrom(href: string, from: keyof typeof RETURN_TARGETS & string): string {
  return `${href}${href.includes("?") ? "&" : "?"}${FROM_PARAM}=${from}`
}

/** Where Cancel or Back goes: the origin in the URL when there is one, else `fallback`. */
export function returnHref(from: string | null | undefined, fallback: string): string {
  return returnTarget(from)?.href ?? fallback
}
