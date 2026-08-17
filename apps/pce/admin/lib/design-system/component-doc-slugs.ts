/**
 * Slug inventory for component-doc specs — no React, no preview modules.
 *
 * Keep in sync with `component-docs/*.tsx` exports and `TOKEN_DOC_FILTER_BY_SLUG`.
 * `design-system-preview-meta.ts` uses this set so index badges do not import
 * the eager docs graph.
 */

export const TOKEN_COMPONENT_DOC_SLUGS = [
  "tokens-colors",
  "tokens-gradients",
  "tokens-radius",
  "tokens-size",
  "tokens-shadow",
  "tokens-typography",
  "tokens-motion",
  "tokens-aliases",
  "tokens-data-table",
  "tokens-interactive",
] as const

/** Spec slugs from `component-docs/*.tsx` (not token pages). */
export const PRIMITIVE_COMPONENT_DOC_SLUGS = [
  "accordion",
  "ask-leo-button",
  "attachment",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "card",
  "chart",
  "checkbox",
  "coach-mark",
  "command",
  "date-picker",
  "dialog",
  "dropdown-menu",
  "fab",
  "filter-bar",
  "filter-button",
  "filter-chip-group",
  "floating-sheet-panel",
  "floating-window",
  "form",
  "input",
  "kbd",
  "key-metrics",
  "leo-assist-bar",
  "leo-icon",
  "marketing-banner",
  "marker",
  "message",
  "mode-switch-search",
  "popover",
  "radio-group",
  "select",
  "separator",
  "skeleton",
  "table",
  "tabs",
  "tip",
  "toggle-switch",
  "utility-bar",
  "view-segmented-control",
  "wizard",
] as const

export const COMPONENT_DOC_SLUGS: ReadonlySet<string> = new Set<string>([
  ...PRIMITIVE_COMPONENT_DOC_SLUGS,
  ...TOKEN_COMPONENT_DOC_SLUGS,
])

export function hasComponentDocSpec(slug: string): boolean {
  return COMPONENT_DOC_SLUGS.has(slug)
}

export function listComponentDocSlugs(): string[] {
  return [...COMPONENT_DOC_SLUGS]
}
