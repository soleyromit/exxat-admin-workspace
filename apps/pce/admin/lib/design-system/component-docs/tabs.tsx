"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"

/** Component-focused UX: peer panels via Radix tablist. Live previews: design-system-previews.tsx */
export const tabsComponentDoc: ComponentDocSpec = {
  slug: "tabs",
  summary:
    "Radix tablist primitive: Tabs, TabsList, TabsTrigger, and TabsContent for one visible panel at a time.",
  sections: [],
  anatomy: [
    { part: "Tabs", description: "Root context; set orientation horizontal or vertical." },
    { part: "TabsList", description: "Tablist chrome; variant default (pill) or line (underline)." },
    { part: "TabsListScrollRegion", description: "Wraps TabsList when triggers overflow horizontally." },
    { part: "TabsTrigger", description: "Selectable tab control; supports icon and TabsCountBadge." },
    { part: "TabsContent", description: "Panel mounted for the active value only." },
    { part: "TabsCountBadge", description: "Optional numeric chip on a trigger." },
  ],
  api: [
    { prop: "orientation", type: "horizontal | vertical", defaultValue: "horizontal", description: "On Tabs root." },
    { prop: "variant", type: "default | line", defaultValue: "default", description: "On TabsList. Pill vs underline." },
    { prop: "ariaLabel", type: "string", defaultValue: "Tabs", description: "On TabsListScrollRegion for scroll control labels." },
  ],
  ux: {
    job: "Let users switch between peer content regions on one surface without changing route or losing parent context.",
    budgets: [
      { label: "Visible triggers", value: "≤7", rationale: "Beyond seven, group content or wrap with TabsListScrollRegion." },
      { label: "Trigger labels", value: "≤3 words", rationale: "Short parallel names; long labels truncate on narrow viewports." },
    ],
    principles: ["P1", "P2", "P3", "P6", "P13"],
    modernReferences: [
      "Height view tabs (M1, M4)",
      "Linear issue detail sections (M1, M4)",
      "Stripe customer record tabs (M4, M11)",
    ],
    patternDoc: "apps/web/docs/tabs-pattern.md",
    rulePath: ".cursor/rules/exxat-tabs-chrome.mdc",
    whenToUse: [
      "Peer sections on one record or card (not sequential steps).",
      "Two to seven named panels where only one body is visible at a time.",
      "In-card panel pairs such as chart vs trend (line variant).",
    ],
    whenNotToUse: [
      "Hub view switching (table / board / dashboard). ViewSegmentedControl on ListPageTemplate.",
      "Sequential create flows with completed steps. Wizard.",
      "Theme, chart type, or toolbar mode pickers. FilterChipGroup (muted) or ButtonSegmentedControl.",
      "Destructive confirmations. AlertDialog.",
    ],
  },
  guidelines: {
    do: [
      "Compose Tabs → TabsList (inline-flex w-fit) → TabsTrigger → TabsContent.",
      "Set variant=\"default\" on TabsList for pill chrome; variant=\"line\" for underline panels.",
      "Wrap overflowing TabsList in TabsListScrollRegion (controls at group end).",
      "Keep TabsCountBadge counts honest and tabular-nums.",
    ],
    dont: [
      "Pass w-full or flex-1 on TabsList. Default w-fit must stay.",
      "Use Radix Tabs for hub saved views. ViewSegmentedControl is radiogroup, not tablist.",
      "Nest Tabs inside Tabs. Flatten IA or split routes.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.3.1",
      criterionTitle: "Info and Relationships",
      level: "A",
      guidance:
        "TabsList exposes role=tablist; each TabsTrigger is role=tab; each TabsContent is role=tabpanel linked with aria-labelledby.",
    },
    {
      principle: "perceivable",
      criterion: "1.4.1",
      criterionTitle: "Use of Color",
      level: "A",
      guidance:
        "Selected state must not rely on color alone. Pair active chrome with text weight, underline, or pill fill.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance:
        "Arrow keys move focus between TabsTrigger; Home and End jump to first and last tab when orientation is horizontal.",
    },
    {
      principle: "operable",
      criterion: "2.4.7",
      criterionTitle: "Focus Visible",
      level: "AA",
      guidance: "TabsTrigger shows a visible focus ring; do not remove focus-visible styles.",
    },
    {
      principle: "operable",
      criterion: "2.5.8",
      criterionTitle: "Target Size (Minimum)",
      level: "AA",
      guidance: "Triggers meet the 24×24 CSS px floor or have 24px spacing between adjacent targets.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance:
        "Every trigger has visible text or aria-label; icon-only triggers need Tip + aria-label with matching copy.",
    },
    {
      principle: "understandable",
      criterion: "3.2.4",
      criterionTitle: "Consistent Identification",
      level: "AA",
      guidance: "Tab labels stay stable across visits; do not rename tabs between sessions for the same panel.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance:
        "Radix sets aria-selected and roving tabindex on triggers; preserve primitive markup when extending styles.",
    },
  ],
  relatedSlugs: ["horizontal-scroll-region", "view-segmented-control", "wizard", "button-segmented-control", "filter-chip-group", "alert-dialog"],
}
