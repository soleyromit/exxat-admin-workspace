import type { DesignSystemRegistryEntry } from "@/lib/design-system/registry-types"
import { DESIGN_SYSTEM_TIER_LABEL } from "@/lib/design-system/registry-types"

/** Inline filter for catalog registry rows (drill-in search + home grid). */
export function catalogEntryMatchesQuery(
  entry: DesignSystemRegistryEntry,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    entry.name,
    entry.description,
    entry.group,
    entry.slug,
    entry.keywords ?? "",
    DESIGN_SYSTEM_TIER_LABEL[entry.tier],
  ]
    .join(" ")
    .toLowerCase()
  return haystack.includes(q)
}
