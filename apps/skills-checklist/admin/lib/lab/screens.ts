import registry from "./screens.json"

export type PersonaId = "admin" | "student" | "evaluator" | "reviewer" | "director" | "course-faculty"
export type Tier = 1 | 2 | 3

export interface VariantDef {
  id: string
  /** The one question this variant tests. */
  question: string
  /** App-relative path of the component that renders it. Present means built. */
  file?: string
  /** Page template (01-layout-patterns.md), read by the density script and `data-page-type`. */
  pageType?: PageType
  /** URL params this variant accepts beyond the screen's own (configure C takes `skills` for several at once). */
  accepts?: string[]
}

export type PageType = "list" | "wizard" | "form" | "detail" | "split" | "dashboard" | "evaluator" | "student"

/** A named demo state chosen from the lab bar's Scenario menu (03-lab-architecture.md section 5.2). */
export interface ScenarioDef {
  group: "States" | "Data"
  label: string
  params?: Record<string, string>
  event?: "lab:reset"
}

export interface ScreenDef {
  persona: PersonaId
  slug: string
  title: string
  tier: Tier
  recommended: string
  variants: VariantDef[]
  /** DS components this screen must use (docs/knowledge/ds-usage-map.md). The gate enforces it on built variants. */
  requiredDsComponents: string[]
  /** Demo states for the lab bar's Scenario menu. */
  scenarios?: ScenarioDef[]
  /** Lab-only notes (open decisions) shown in the lab bar's question tooltip, never in the page. */
  labNotes?: string[]
}

export const SCREENS = registry.screens as ScreenDef[]

/**
 * One screen in one explicit variant, for the lab index's "By persona" browser and the persona landing. Links between
 * screens never use it: they go through lib/lab/links.ts so they follow the active option set.
 */
export const screenHref = (persona: string, slug: string, variant?: string): string => `/lab/${persona}/${slug}${variant ? `?variant=${variant}` : ""}`

export const findScreen = (persona: string, slug: string): ScreenDef | undefined => SCREENS.find((s) => s.persona === persona && s.slug === slug)
export const screensFor = (persona: PersonaId): ScreenDef[] => SCREENS.filter((s) => s.persona === persona)
export const builtVariants = (s: ScreenDef): VariantDef[] => s.variants.filter((v) => !!v.file)
export const screenStatus = (s: ScreenDef): "built" | "planned" => (builtVariants(s).length > 0 ? "built" : "planned")
export const screenKey = (s: Pick<ScreenDef, "persona" | "slug">): string => `${s.persona}/${s.slug}`

/** The variant to show: the requested one when it exists, else the recommended one. */
export function resolveVariant(s: ScreenDef, requested?: string | null): VariantDef {
  return s.variants.find((v) => v.id === requested) ?? s.variants.find((v) => v.id === s.recommended) ?? s.variants[0]
}
