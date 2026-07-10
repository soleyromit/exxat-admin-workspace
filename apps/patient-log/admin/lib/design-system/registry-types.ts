/**
 * Design System registry — canonical inventory for docs routes.
 * Superset of `catalog-entries.ts`; drives `/design-system` skeleton pages.
 */

export type DesignSystemTier =
  | "token"
  | "component"
  | "pattern"
  | "template"
  | "example"
  | "rule"
  | "skill"
  | "agent"

export type DesignSystemDocStatus =
  /** Working preview on design-system or catalog page */
  | "live"
  /** Registry + skeleton doc route only */
  | "skeleton"
  /** Covered by legacy catalog split-pane only */
  | "catalog"
  /** Listed for inventory; no doc surface yet */
  | "planned"

export interface DesignSystemRegistryEntry {
  /** URL segment — `/{product}/design-system/:slug` */
  slug: string
  name: string
  tier: DesignSystemTier
  /** Sidebar group within the tier (e.g. Forms, Overlays). */
  group: string
  description: string
  importPath: string
  /** Repo path for maintainers. */
  sourcePath?: string
  /** Legacy catalog row id when linked. */
  catalogId?: string
  /** Live dogfood route under Design OS, e.g. `/columns`. */
  routeSuffix?: string
  status: DesignSystemDocStatus
  /** When set, doc route redirects to parent slug; hidden from sidebar nav. */
  parentSlug?: string
  keywords?: string
}

export const DESIGN_SYSTEM_TIER_LABEL: Record<DesignSystemTier, string> = {
  token: "Design tokens",
  component: "UI primitives",
  pattern: "Patterns",
  template: "Templates",
  example: "Live examples",
  rule: "Cursor rules",
  skill: "Agent skills",
  agent: "Agent guides",
}
