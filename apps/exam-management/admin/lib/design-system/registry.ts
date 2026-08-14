/**
 * Design System registry — query helpers for docs routes and agents.
 */

import { DESIGN_SYSTEM_REGISTRY_ENTRIES } from "@/lib/design-system/registry-entries"
import type {
  DesignSystemDocStatus,
  DesignSystemRegistryEntry,
  DesignSystemTier,
} from "@/lib/design-system/registry-types"
import { DESIGN_SYSTEM_TIER_LABEL } from "@/lib/design-system/registry-types"

export type { DesignSystemDocStatus, DesignSystemRegistryEntry, DesignSystemTier }
export { DESIGN_SYSTEM_TIER_LABEL, DESIGN_SYSTEM_REGISTRY_ENTRIES }

const SORTED_ENTRIES = [...DESIGN_SYSTEM_REGISTRY_ENTRIES].sort((a, b) =>
  a.name.localeCompare(b.name),
)

const BY_SLUG = new Map(SORTED_ENTRIES.map((entry) => [entry.slug, entry]))

export function getDesignSystemEntry(slug: string | undefined): DesignSystemRegistryEntry | undefined {
  if (!slug) return undefined
  return BY_SLUG.get(slug)
}

/** Registry children folded under a parent doc page (e.g. status-badge → badge). */
export function getDesignSystemChildEntries(parentSlug: string): DesignSystemRegistryEntry[] {
  return SORTED_ENTRIES.filter((entry) => entry.parentSlug === parentSlug)
}

export function listDesignSystemEntries(tier?: DesignSystemTier): DesignSystemRegistryEntry[] {
  const base = tier
    ? SORTED_ENTRIES.filter((entry) => entry.tier === tier)
    : SORTED_ENTRIES
  return base.filter((entry) => !entry.parentSlug)
}

export interface DesignSystemNavSection {
  tier: DesignSystemTier
  tierLabel: string
  groups: {
    group: string
    items: DesignSystemRegistryEntry[]
  }[]
}

/** @deprecated Catalog drill-in uses inline collapsible tiers — kept for URL sync helpers if needed. */
export type DesignSystemNavDrill =
  | { level: "root" }
  | { level: "tier"; tier: DesignSystemTier }

export function designSystemNavDrillFromEntry(
  entry: DesignSystemRegistryEntry,
): DesignSystemNavDrill {
  return { level: "tier", tier: entry.tier }
}

export const DESIGN_SYSTEM_TIER_ICONS: Record<DesignSystemTier, string> = {
  token: "fa-light fa-droplet",
  component: "fa-light fa-cube",
  pattern: "fa-light fa-layer-group",
  template: "fa-light fa-browser",
  example: "fa-light fa-compass",
  rule: "fa-light fa-scale-balanced",
  skill: "fa-light fa-book",
  agent: "fa-light fa-robot",
}

export function getDesignSystemNavSection(
  tier: DesignSystemTier,
): DesignSystemNavSection | undefined {
  return buildDesignSystemNavSections().find((section) => section.tier === tier)
}

/** Sidebar nav — tier → group → items (stable section order). Omits `parentSlug` children. */
export function buildDesignSystemNavSections(): DesignSystemNavSection[] {
  const navEntries = SORTED_ENTRIES.filter((e) => !e.parentSlug)
  const tiers: DesignSystemTier[] = [
    "token",
    "component",
    "pattern",
    "template",
    "example",
    "rule",
    "skill",
    "agent",
  ]
  return tiers.map((tier) => {
    const tierItems = navEntries.filter((e) => e.tier === tier)
    const groupNames = [...new Set(tierItems.map((e) => e.group))].sort((a, b) =>
      a.localeCompare(b),
    )
    return {
      tier,
      tierLabel: DESIGN_SYSTEM_TIER_LABEL[tier],
      groups: groupNames.map((group) => ({
        group,
        items: tierItems
          .filter((e) => e.group === group)
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
    }
  }).filter((section) => section.groups.some((g) => g.items.length > 0))
}

export interface DesignSystemRegistryStats {
  total: number
  byTier: Record<DesignSystemTier, number>
  byStatus: Record<DesignSystemDocStatus, number>
  catalogLinked: number
  notInCatalog: number
}

export function getDesignSystemRegistryStats(): DesignSystemRegistryStats {
  const byTier = {
    token: 0,
    component: 0,
    pattern: 0,
    template: 0,
    example: 0,
    rule: 0,
    skill: 0,
    agent: 0,
  } satisfies Record<DesignSystemTier, number>
  const byStatus = {
    live: 0,
    skeleton: 0,
    catalog: 0,
    planned: 0,
  } satisfies Record<DesignSystemDocStatus, number>
  let catalogLinked = 0

  for (const entry of SORTED_ENTRIES) {
    byTier[entry.tier] += 1
    byStatus[entry.status] += 1
    if (entry.catalogId) catalogLinked += 1
  }

  return {
    total: SORTED_ENTRIES.length,
    byTier,
    byStatus,
    catalogLinked,
    notInCatalog: SORTED_ENTRIES.length - catalogLinked,
  }
}
