/**
 * design-system-preview-meta — zero-React metadata for live-preview presence checks.
 *
 * Callers that only need to know *whether* a slug has a live preview (e.g. the
 * design-system index page badge, the doc-page toggle) can import from here and
 * avoid pulling in the full PREVIEW_SECTIONS registry or component-doc modules.
 *
 * Keep `PREVIEW_SECTIONS_SLUGS` in sync with the keys of `PREVIEW_SECTIONS` in
 * `design-system-previews.tsx`. Component-doc slugs live in `component-doc-slugs.ts`.
 */

import { COMPONENT_DOC_SLUGS } from "@/lib/design-system/component-doc-slugs"

/**
 * Slugs that have sections defined in the `PREVIEW_SECTIONS` registry inside
 * `design-system-previews.tsx` (fallback when there is no component-doc spec).
 */
const PREVIEW_SECTIONS_SLUGS = new Set<string>([
  "accordion",
  "breadcrumb",
  "chart-card",
  "command",
  "data-table",
  "date-picker",
  "dialog",
  "dropdown-menu",
  "form",
  "input",
  "key-metrics",
  "page-header",
  "popover",
  "radio-group",
  "select",
  "separator",
  "table-cells",
  "tabs",
  "tip",
  "wizard",
])

/**
 * Returns `true` if the given design-system slug has at least one live preview
 * section (either from `component-docs/*.tsx` or from the PREVIEW_SECTIONS registry).
 */
export function designSystemHasLivePreview(slug: string): boolean {
  return COMPONENT_DOC_SLUGS.has(slug) || PREVIEW_SECTIONS_SLUGS.has(slug)
}
