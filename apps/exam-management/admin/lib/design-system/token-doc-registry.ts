/**
 * Maps design-system token doc slugs → token index filters.
 */

import {
  CATEGORY_TABS,
  TOKENS_INDEX,
  type TokenCategory,
  type TokenRecord,
} from "@/components/tokens-themes-section"

export type TokenDocFilter =
  | { kind: "category"; categoryId: TokenCategory }
  | { kind: "prefix"; prefixes: readonly string[] }

export const TOKEN_DOC_FILTER_BY_SLUG: Record<string, TokenDocFilter> = {
  "tokens-colors": { kind: "category", categoryId: "color" },
  "tokens-gradients": { kind: "category", categoryId: "gradient" },
  "tokens-radius": { kind: "category", categoryId: "radius" },
  "tokens-size": { kind: "category", categoryId: "size" },
  "tokens-shadow": { kind: "category", categoryId: "shadow" },
  "tokens-typography": { kind: "category", categoryId: "typography" },
  "tokens-motion": { kind: "category", categoryId: "transition" },
  "tokens-aliases": { kind: "category", categoryId: "alias" },
  "tokens-data-table": { kind: "prefix", prefixes: ["--dt-"] },
  "tokens-interactive": { kind: "prefix", prefixes: ["--interactive-", "--icon-button-"] },
}

export function getTokenDocFilter(slug: string): TokenDocFilter | undefined {
  return TOKEN_DOC_FILTER_BY_SLUG[slug]
}

export function listDocTokens(filter: TokenDocFilter): Array<{ name: string; record: TokenRecord }> {
  const out: Array<{ name: string; record: TokenRecord }> = []
  for (const [name, record] of Object.entries(TOKENS_INDEX.tokens)) {
    if (matchesTokenDocFilter(name, record, filter)) {
      out.push({ name, record })
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

function matchesTokenDocFilter(name: string, record: TokenRecord, filter: TokenDocFilter): boolean {
  if (filter.kind === "prefix") {
    return filter.prefixes.some((prefix) => name.startsWith(prefix))
  }
  const tab = CATEGORY_TABS.find((t) => t.id === filter.categoryId)
  return tab ? tab.matches(String(record.category)) : false
}

export function listTokenDocSlugs(): string[] {
  return Object.keys(TOKEN_DOC_FILTER_BY_SLUG)
}

/** Categories whose token values differ by light / dark / contrast — show theme preview control. */
const THEME_PREVIEW_CATEGORIES = new Set<TokenCategory>([
  "color",
  "gradient",
  "shadow",
  "alias",
])

export function tokenDocFilterNeedsThemePreview(filter: TokenDocFilter): boolean {
  if (filter.kind === "prefix") return true
  return THEME_PREVIEW_CATEGORIES.has(filter.categoryId)
}
