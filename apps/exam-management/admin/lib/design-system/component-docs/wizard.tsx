"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  WIZARD_RECOMMENDED_MAX_STEPS,
  WIZARD_SCROLL_THRESHOLD,
} from "@exxatdesignux/ui/components/wizard"
import {
  WizardErrorStatePreview,
  WizardHorizontalCompactPreview,
  WizardHorizontalIconsPreview,
  WizardHorizontalNumberedPreview,
  WizardManyStepsPreview,
  WizardVerticalIconsPreview,
  WizardVerticalNumberedPreview,
} from "@/components/design-system/wizard-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const wizardComponentDoc: ComponentDocSpec = {
  slug: "wizard",
  summary:
    "Sequential stepper for focus-workflow create flows — not Tabs. Prefer ≤6 top-level steps; horizontal overflow uses grouped scroll controls and auto-scrolls the active step.",
  sections: [
    ex({ id: "horizontal-numbered", title: "Horizontal numbered" }, <WizardHorizontalNumberedPreview />),
    ex({ id: "horizontal-icons", title: "Horizontal icons" }, <WizardHorizontalIconsPreview />),
    ex({ id: "horizontal-compact", title: "Horizontal compact" }, <WizardHorizontalCompactPreview />),
    ex({ id: "vertical-numbered", title: "Vertical numbered" }, <WizardVerticalNumberedPreview />),
    ex({ id: "vertical-icons", title: "Vertical icons" }, <WizardVerticalIconsPreview />),
    ex({ id: "error", title: "Error state" }, <WizardErrorStatePreview />),
    ex({ id: "overflow-edge-case", title: "Edge case: overflow (8 steps)" }, <WizardManyStepsPreview />),
  ],
  anatomy: [
    { part: "Wizard", description: "Root context: steps, current index, orientation, variant, linear gating." },
    { part: "WizardProgress", description: "Step N of M — aria-live polite." },
    { part: "WizardStepGuidance", description: `Renders when steps > ${WIZARD_RECOMMENDED_MAX_STEPS}.` },
    { part: "WizardNav", description: "Horizontal (scroll + controls) or vertical rail." },
    { part: "WizardContent", description: "Panel column — min-w-0 flex-1." },
    { part: "WizardStepHeading", description: "H2 per panel; id matches step id." },
    { part: "WizardPanel", description: "Shows children when step index/id is active." },
    { part: "WizardFooter", description: "Back / Next / Submit — one primary action." },
  ],
  api: [
    {
      prop: "steps",
      type: "WizardStep[]",
      description: "id, label, optional description, icon, error.",
    },
    {
      prop: "current",
      type: "number",
      description: "Zero-based active step index.",
    },
    {
      prop: "orientation",
      type: "horizontal | vertical",
      defaultValue: "horizontal",
      description: "Vertical for 6+ named chapters.",
    },
    {
      prop: "variant",
      type: "numbered | icons | compact",
      defaultValue: "numbered",
      description: "Visual marker style — not tabs.",
    },
    {
      prop: "linear",
      type: "boolean",
      defaultValue: "true",
      description: "When true, future steps are disabled until reached.",
    },
    {
      prop: "onStepClick",
      type: "(index) => void",
      description: "Optional — enables back-navigation to completed steps only.",
    },
  ],
  ux: {
    job: "Advance a sequential multi-step task with visible progress and linear gating.",
    budgets: [
      { label: "Ideal", value: "3–4 steps", rationale: "Full rail visible without scroll." },
      {
        label: "Max horizontal",
        value: `≤${WIZARD_RECOMMENDED_MAX_STEPS}`,
        rationale: "Show WizardStepGuidance above this count.",
      },
      {
        label: "Scroll threshold",
        value: `>${WIZARD_SCROLL_THRESHOLD}`,
        rationale: "Horizontal scroll controls + auto-scroll active step.",
      },
    ],
    principles: ["P1", "P2", "P3", "P5", "P6", "P13", "P19"],
    modernReferences: ["Stripe Connect onboarding (M4, M7)", "Linear project setup (M1, M4)"],
    patternDoc: "apps/web/docs/wizard-pattern.md",
    rulePath: ".cursor/rules/exxat-wizard.mdc",
    whenToUse: [
      "Focus-workflow create routes with named chapters.",
      "Linear gating with optional return to completed steps.",
    ],
    whenNotToUse: [
      "Peer view switching — use Tabs.",
      "Seven or more top-level steps without grouping or vertical/routing split.",
    ],
  },
  guidelines: {
    do: [
      "Keep ≤6 top-level steps; group fields inside WizardPanel sections.",
      "Use HorizontalScrollControls when the rail overflows; active step auto-scrolls.",
      "Pair with FocusWorkflowTemplate — one H1, hidden hub sidebars.",
      "Completed = bg-brand + check; current = brand tint.",
    ],
    dont: [
      "Use Wizard for non-sequential view switching.",
      "Ship catalog 8-step demo as a product IA.",
      "Toast on validation — set step.error and inline copy.",
      "Omit keyboard scroll buttons on overflowing horizontal rails.",
    ],
  },
  accessibility: [
    "ol/li step list; aria-current=step on active marker.",
    "aria-disabled on linear future steps; completed clickable only with onStepClick.",
    "WizardProgress aria-live=polite.",
    "HorizontalScrollControls: Button + Tip + descriptive aria-label.",
    "Wizard footer: Kbd variant=bare on primary/secondary.",
  ],
  relatedSlugs: [
    "horizontal-scroll-controls",
    "button",
    "field",
    "tabs",
    "focus-workflow-template",
  ],
}
