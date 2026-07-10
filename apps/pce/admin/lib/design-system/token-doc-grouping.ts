/**
 * Groups tokens for design-reference doc pages.
 * Color + alias pages follow `apps/web/docs/token-taxonomy.md` §2 families.
 */

import type { TokenRecord } from "@/components/tokens-themes-section"

export type TokenDocEntry = { name: string; record: TokenRecord }

export type TokenDocGroup = {
  id: string
  label: string
  tokens: TokenDocEntry[]
}

/** Friendly labels for hooks-index `namespace` values. */
export const TOKEN_NAMESPACE_LABELS: Record<string, string> = {
  semantic: "Semantic",
  brand: "Brand",
  sidebar: "Sidebar",
  "icon-disc": "Icon discs",
  datatable: "Data table",
  "interactive-hover": "Interactive hover",
  chip: "Chips",
  "conditional-rule": "Conditional format",
  chart: "Charts",
  "insight-severity": "Insight severity",
  "border-control": "Border control",
  avatar: "Avatar",
  exxat: "Exxat L0",
  "exxat-focus": "Exxat focus",
  "exxat-overlay": "Exxat overlay",
  "exxat-surface": "Exxat surface",
  "exxat-ink": "Exxat ink",
  "exxat-brand": "Exxat brand",
  "exxat-action": "Exxat action",
  "exxat-border": "Exxat border",
  "exxat-chip": "Exxat chips",
  "exxat-chart": "Exxat charts",
  leo: "Leo",
  banner: "Banner",
  "key-metrics": "Key metrics",
  overlay: "Overlay",
  "secondary-panel": "Secondary panel",
  sticky: "Sticky edge",
  "theme-color": "Theme color",
  other: "Other",
  font: "Font",
  text: "Text size",
  radius: "Radius",
  size: "Size",
  shadow: "Shadow",
  transition: "Motion",
  alias: "Alias",
  gradient: "Gradient",
}

/** token-taxonomy.md §2 — color families (doc tab order). */
const COLOR_TAXONOMY_FAMILIES: Array<{ id: string; label: string; namespaces: readonly string[] }> = [
  { id: "semantic", label: "Semantic surfaces", namespaces: ["semantic"] },
  { id: "brand", label: "Brand & washes", namespaces: ["brand", "leo"] },
  { id: "sidebar-chrome", label: "Sidebar & panels", namespaces: ["sidebar", "secondary-panel"] },
  { id: "chip", label: "Chips", namespaces: ["chip"] },
  { id: "chart", label: "Charts", namespaces: ["chart"] },
  { id: "interactive", label: "Interactive hover", namespaces: ["interactive-hover"] },
  { id: "datatable", label: "Data table", namespaces: ["datatable"] },
  { id: "kpi", label: "KPI & insights", namespaces: ["key-metrics", "insight-severity"] },
  { id: "conditional", label: "Conditional format", namespaces: ["conditional-rule"] },
  { id: "icon-disc", label: "Icon discs", namespaces: ["icon-disc"] },
  { id: "avatar", label: "Avatar", namespaces: ["avatar"] },
  { id: "exxat-l0", label: "Exxat L0", namespaces: ["exxat", "exxat-focus", "exxat-overlay"] },
  {
    id: "chrome-misc",
    label: "Chrome & misc",
    namespaces: ["border-control", "overlay", "banner", "sticky", "theme-color", "other"],
  },
]

/** L0 alias families — matches hooks-index `namespace` on alias category. */
const ALIAS_FAMILY_ORDER = [
  "exxat-surface",
  "exxat-ink",
  "exxat-brand",
  "exxat-action",
  "exxat-border",
  "exxat-chip",
  "exxat-chart",
  "exxat",
  "semantic",
  "brand",
  "datatable",
  "sidebar",
  "other",
] as const

const TAB_THRESHOLD = 14
const MERGE_SMALL_GROUPS_BELOW = 2

function labelForNamespace(namespace: string): string {
  return (
    TOKEN_NAMESPACE_LABELS[namespace] ??
    namespace
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}

function sortEntries(entries: TokenDocEntry[]): TokenDocEntry[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name))
}

function namespaceToColorFamily(namespace: string): string {
  for (const family of COLOR_TAXONOMY_FAMILIES) {
    if ((family.namespaces as readonly string[]).includes(namespace)) return family.id
  }
  return "chrome-misc"
}

function groupColorsByTaxonomy(tokens: TokenDocEntry[]): TokenDocGroup[] {
  const buckets = new Map<string, TokenDocEntry[]>()
  for (const family of COLOR_TAXONOMY_FAMILIES) {
    buckets.set(family.id, [])
  }

  for (const entry of tokens) {
    const familyId = namespaceToColorFamily(entry.record.namespace || "other")
    buckets.get(familyId)?.push(entry)
  }

  return COLOR_TAXONOMY_FAMILIES.map((family) => ({
    id: family.id,
    label: family.label,
    tokens: sortEntries(buckets.get(family.id) ?? []),
  })).filter((g) => g.tokens.length > 0)
}

function groupAliasesByL0Namespace(tokens: TokenDocEntry[]): TokenDocGroup[] {
  const buckets = new Map<string, TokenDocEntry[]>()
  const misc: TokenDocEntry[] = []

  for (const entry of tokens) {
    const ns = entry.record.namespace || "other"
    if ((ALIAS_FAMILY_ORDER as readonly string[]).includes(ns)) {
      const list = buckets.get(ns) ?? []
      list.push(entry)
      buckets.set(ns, list)
    } else {
      misc.push(entry)
    }
  }

  if (misc.length > 0) {
    const list = buckets.get("other") ?? []
    list.push(...misc)
    buckets.set("other", list)
  }

  const groups: TokenDocGroup[] = []
  for (const id of ALIAS_FAMILY_ORDER) {
    const groupTokens = buckets.get(id)
    if (groupTokens?.length) {
      groups.push({
        id,
        label: labelForNamespace(id),
        tokens: sortEntries(groupTokens),
      })
    }
  }
  return groups
}

function groupByNamespace(tokens: TokenDocEntry[]): TokenDocGroup[] {
  const buckets = new Map<string, TokenDocEntry[]>()
  for (const entry of tokens) {
    const ns = entry.record.namespace || "other"
    const list = buckets.get(ns) ?? []
    list.push(entry)
    buckets.set(ns, list)
  }

  const large: TokenDocGroup[] = []
  const merged: TokenDocEntry[] = []

  for (const [namespace, groupTokens] of buckets.entries()) {
    const sorted = sortEntries(groupTokens)
    if (sorted.length >= MERGE_SMALL_GROUPS_BELOW) {
      large.push({
        id: namespace,
        label: labelForNamespace(namespace),
        tokens: sorted,
      })
    } else {
      merged.push(...sorted)
    }
  }

  if (merged.length > 0) {
    large.push({
      id: "other",
      label: TOKEN_NAMESPACE_LABELS.other,
      tokens: sortEntries(merged),
    })
  }

  return large.sort((a, b) => {
    if (b.tokens.length !== a.tokens.length) return b.tokens.length - a.tokens.length
    return a.label.localeCompare(b.label)
  })
}

function groupByPrefixSegment(
  tokens: TokenDocEntry[],
  prefixes: readonly string[],
): TokenDocGroup[] {
  const buckets = new Map<string, TokenDocEntry[]>()

  for (const entry of tokens) {
    const prefix = prefixes.find((p) => entry.name.startsWith(p)) ?? ""
    const rest = entry.name.slice(prefix.length)
    const segment = rest.split("-").filter(Boolean)[0] ?? "core"
    const list = buckets.get(segment) ?? []
    list.push(entry)
    buckets.set(segment, list)
  }

  return [...buckets.entries()]
    .map(([id, groupTokens]) => ({
      id,
      label: labelForNamespace(id),
      tokens: sortEntries(groupTokens),
    }))
    .sort((a, b) => {
      if (b.tokens.length !== a.tokens.length) return b.tokens.length - a.tokens.length
      return a.label.localeCompare(b.label)
    })
}

function resolveGroups(tokens: TokenDocEntry[], slug?: string, prefixFilter?: readonly string[]): TokenDocGroup[] {
  if (slug === "tokens-colors") return groupColorsByTaxonomy(tokens)
  if (slug === "tokens-aliases") return groupAliasesByL0Namespace(tokens)
  if (prefixFilter?.length) return groupByPrefixSegment(tokens, prefixFilter)
  return groupByNamespace(tokens)
}

export function groupDocTokens(
  tokens: TokenDocEntry[],
  opts?: { slug?: string; prefixFilter?: readonly string[] },
): { groups: TokenDocGroup[]; useCategoryTabs: boolean } {
  if (tokens.length === 0) {
    return { groups: [], useCategoryTabs: false }
  }

  const groups = resolveGroups(tokens, opts?.slug, opts?.prefixFilter)
  const nonEmpty = groups.filter((g) => g.tokens.length > 0)
  const useCategoryTabs = tokens.length >= TAB_THRESHOLD && nonEmpty.length > 1

  if (!useCategoryTabs) {
    return {
      groups: [{ id: "all", label: "All", tokens: sortEntries(tokens) }],
      useCategoryTabs: false,
    }
  }

  return {
    groups: [{ id: "all", label: "All", tokens: sortEntries(tokens) }, ...nonEmpty],
    useCategoryTabs: true,
  }
}

export function prefixFilterForSlug(slug: string): readonly string[] | undefined {
  if (slug === "tokens-data-table") return ["--dt-"]
  if (slug === "tokens-interactive") return ["--interactive-", "--icon-button-"]
  return undefined
}

/** Badge copy for derived color tokens (color-mix / brand cascade). */
export function tokenDocDerivedLabel(record: TokenRecord, name: string): string | null {
  const raw = record.values.light ?? Object.values(record.values)[0] ?? ""
  if (name.startsWith("--leo-") || raw.includes("var(--brand-color)")) {
    return "Brand mix"
  }
  if (raw.includes("color-mix(")) return "Derived"
  if (record.category === "alias") return "Alias"
  return null
}

/** Human role for numbered L0 slots — see token-taxonomy.md §2.0. */
export function l0TokenRole(name: string): string | null {
  const roles: Record<string, string> = {
    "--exxat-color-surface-1": "Page canvas",
    "--exxat-color-surface-2": "Raised card surface",
    "--exxat-color-surface-3": "Floating popover surface",
    "--exxat-color-surface-muted": "Muted fill",
    "--exxat-color-surface-accent": "Hover / accent fill",
    "--exxat-color-surface-secondary": "Secondary button fill",
    "--exxat-color-surface-sidebar": "Primary sidebar fill",
    "--exxat-color-surface-input": "Input field fill",
    "--exxat-color-ink-1": "Primary body text",
    "--exxat-color-ink-2": "Secondary / meta text",
    "--exxat-color-ink-on-surface-2": "Text on card surfaces",
    "--exxat-color-ink-on-surface-3": "Text on popover surfaces",
    "--exxat-color-ink-on-brand": "Text on solid brand fill",
    "--exxat-color-ink-on-primary": "Text on primary button",
    "--exxat-color-ink-on-secondary": "Text on secondary button",
    "--exxat-color-ink-on-accent": "Text on accent fill",
    "--exxat-color-ink-on-destructive": "Text on destructive button",
    "--exxat-color-brand-1": "Solid brand accent",
    "--exxat-color-brand-2": "Brand dark step",
    "--exxat-color-brand-3": "Brand light step",
    "--exxat-color-brand-deep": "Brand deepest step",
    "--exxat-color-brand-tint-1": "Brand wash (sidebar)",
    "--exxat-color-brand-tint-2": "Subtle brand wash",
    "--exxat-color-brand-tint-3": "Light brand wash",
    "--exxat-color-action-primary": "Primary CTA fill",
    "--exxat-color-action-secondary": "Secondary CTA fill",
    "--exxat-color-action-destructive": "Destructive CTA fill",
    "--exxat-color-border-1": "Decorative divider",
    "--exxat-color-focus-ring": "Focus ring",
    "--exxat-color-overlay": "Modal / sheet scrim",
  }
  return roles[name] ?? null
}

export function tokenDocIntroForSlug(slug: string): string | null {
  if (slug === "tokens-colors") {
    return "Step 1 — L1 semantic colors hold the OKLCH literals and brand-derived washes. Tabs follow token-taxonomy.md §2 (semantic, brand, sidebar, chips, …). Leo tints use color-mix(in oklch, var(--brand-color) …) and follow your active product theme. Scroll to step 2 for L0 --exxat-* alias slots."
  }
  if (slug === "tokens-aliases") {
    return "Step 2 — L0 aliases are var(...) pointers to the L1 rows above. They are not a second palette. Prefer --exxat-* in new product code; legacy semantic names (--background, --foreground, …) remain for existing primitives."
  }
  return null
}
