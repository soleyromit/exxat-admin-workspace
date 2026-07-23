/**
 * WCAG 2.1 accessibility checklist shape for component catalog pages.
 * Group items by POUR: Perceivable, Operable, Understandable, Robust.
 */

export type ComponentDocA11yPrinciple =
  | "perceivable"
  | "operable"
  | "understandable"
  | "robust"

export interface ComponentDocAccessibilityItem {
  principle: ComponentDocA11yPrinciple
  /** WCAG 2.1 success criterion number, e.g. "1.3.1", "2.1.1" */
  criterion: string
  /** Short SC title from WCAG, e.g. "Info and Relationships" */
  criterionTitle?: string
  /** WCAG conformance level for this success criterion */
  level?: "A" | "AA" | "AAA"
  guidance: string
}

export const A11Y_PRINCIPLE_ORDER: ComponentDocA11yPrinciple[] = [
  "perceivable",
  "operable",
  "understandable",
  "robust",
]

export const A11Y_PRINCIPLE_LABEL: Record<ComponentDocA11yPrinciple, string> = {
  perceivable: "Perceivable",
  operable: "Operable",
  understandable: "Understandable",
  robust: "Robust",
}

export const A11Y_PRINCIPLE_SUMMARY: Record<ComponentDocA11yPrinciple, string> = {
  perceivable: "Information and UI components must be presentable in ways users can perceive.",
  operable: "UI components and navigation must be operable by keyboard and assistive tech.",
  understandable: "Information and operation must be understandable.",
  robust: "Content must be robust enough for reliable interpretation across AT.",
}

export function isStructuredAccessibility(
  items: ComponentDocSpecAccessibility,
): items is ComponentDocAccessibilityItem[] {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    typeof items[0] === "object" &&
    items[0] !== null &&
    "principle" in items[0]
  )
}

export type ComponentDocSpecAccessibility =
  | ComponentDocAccessibilityItem[]
  | string[]
