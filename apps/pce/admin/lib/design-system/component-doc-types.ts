/**
 * Component doc framework — data shape for design-system pages (`/design-system/:slug`).
 *
 * ## Research basis (shadcn / Radix / DS rules)
 *
 * | Block | Purpose | Typical content |
 * |-------|---------|-----------------|
 * | **Registry** | Inventory row | slug, tier, group, one-line description, import path |
 * | **Examples** | Live previews (shadcn “Examples”) | One section per variant/state; title + optional caption |
 * | **Anatomy** | Compound parts (shadcn “Anatomy”) | Sub-component names + role (`AvatarImage`, `AvatarFallback`, …) |
 * | **Features** | Grouped capabilities | Optional for complex primitives (DataTable sort, pin, filters, …) |
 * | **API** | Props consumers touch | name, type, default, when to set |
 * | **UX** | Product intent | Job, when to use / not, P-codes, modern refs |
 * | **Implementation** | Technical composition | `guidelines` do/dont — variants, structure, overflow |
 * | **Constraints** | Design limits | `ux.budgets` — counts, label length, density (not WCAG) |
 * | **Accessibility** | WCAG 2.1 AA gate | POUR groups + SC numbers (1.3.1, 2.1.1, …) |
 * | **Related** | Cross-links | Other registry slugs, patterns, table cells |
 * | **Import** | Copy paths | Primary + satellite exports |
 *
 * Add one component at a time in `component-docs/*.tsx` — each file exports a
 * `ComponentDocSpec` with `sections` wired to preview components. Slugs are
 * auto-registered via `import.meta.glob` in `component-docs/index.ts`.
 *
 * **UX automation:** `component-doc-ux-manifest.ts` supplies tier/group defaults
 * and slug overrides so skeleton pages show UX guidelines without hand-copying.
 * Run `pnpm ds:catalog:audit` to list components missing full doc + UX coverage.
 *
 * Typography: example descriptions use `text-sm` (see `doc-typography.ts`).
 * Layout: `component-doc-shell.ts` + `component-doc-shell.tsx` (centered article + example canvas).
 * Copy: no em dashes in user-visible strings (`apps/web/docs/voice-and-tone.md`).
 */

import type * as React from "react"
import type { ComponentDocSpecAccessibility } from "@/lib/design-system/component-doc-a11y"

export type {
  ComponentDocAccessibilityItem,
  ComponentDocA11yPrinciple,
  ComponentDocSpecAccessibility,
} from "@/lib/design-system/component-doc-a11y"

export interface ComponentDocExampleSection {
  id: string
  title: string
  description?: string
  /** When true, render children only — no section H2 (token index pages). */
  bare?: boolean
  children: React.ReactNode
}

export interface ComponentDocAnatomyPart {
  /** Sub-component or slot name — monospace in UI */
  part: string
  description: string
  /** Font Awesome class without prefix (e.g. `fa-table`) for feature tiles */
  icon?: string
}

/** Grouped capability list — for primitives with many behaviors (e.g. DataTable). */
export interface ComponentDocFeatureGroup {
  group: string
  /** Font Awesome class for the group heading */
  icon?: string
  items: ComponentDocAnatomyPart[]
}

export interface ComponentDocApiRow {
  prop: string
  type: string
  defaultValue?: string
  description: string
}

export interface ComponentDocGuidelines {
  /** Technical composition and configuration */
  do: string[]
  /** Anti-patterns and rule violations */
  dont: string[]
}

/** Product UX — when to pick this primitive and what job it serves. */
export interface ComponentDocUx {
  /** One sentence — the user decision this primitive enables */
  job?: string
  /** Quantitative design limits (step counts, max tabs, label length). Rendered as Constraints, not UX. */
  budgets?: { label: string; value: string; rationale: string }[]
  /** Principle codes from exxat-ux-principles (P1–P20) */
  principles?: string[]
  /** Modern SaaS pattern references (product + M-codes) */
  modernReferences?: string[]
  /** Repo path to narrative pattern doc */
  patternDoc?: string
  /** Repo path to binding Cursor rule */
  rulePath?: string
  whenToUse?: string[]
  whenNotToUse?: string[]
}

export interface ComponentDocSpec {
  slug: string
  /** Optional longer intro — falls back to registry `description` */
  summary?: string
  /** Live example blocks (rendered top-to-bottom) */
  sections: ComponentDocExampleSection[]
  anatomy?: ComponentDocAnatomyPart[]
  /** Grouped feature lists — rendered between anatomy and API when present */
  features?: ComponentDocFeatureGroup[]
  api?: ComponentDocApiRow[]
  accessibility?: ComponentDocSpecAccessibility
  /** UX ship intent — merged from `component-doc-ux-manifest.ts` when omitted */
  ux?: ComponentDocUx
  guidelines?: ComponentDocGuidelines
  /** Extra import rows beyond registry `importPath` */
  extraImports?: { label: string; path: string }[]
  relatedSlugs?: string[]
}
