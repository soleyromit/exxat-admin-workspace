"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  ToggleSwitchGroupPreview,
  ToggleSwitchLabelLeftPreview,
  ToggleSwitchLabelRightPreview,
} from "@/components/design-system/data-display-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const toggleSwitchComponentDoc: ComponentDocSpec = {
  slug: "toggle-switch",
  summary:
    'Binary on/off control for settings rows with role="switch" and brand on-state token. Compose inside Field for label placement.',
  sections: [
    ex({ id: "label-left", title: "Label left" }, <ToggleSwitchLabelLeftPreview />),
    ex({ id: "label-right", title: "Switch left" }, <ToggleSwitchLabelRightPreview />),
    ex({ id: "group", title: "Grouped settings" }, <ToggleSwitchGroupPreview />),
  ],
  anatomy: [
    { part: "ToggleSwitch", description: "Native button with role=switch; checked state drives thumb position." },
    { part: "Field + FieldLabel", description: "Preferred wrapper; wires label to control id." },
    { part: "FieldGroup", description: "Stacks related settings rows with consistent gap." },
    { part: "FieldDescription", description: "Optional helper copy under or beside the row." },
  ],
  api: [
    { prop: "checked", type: "boolean", description: "Current on/off value (controlled)." },
    { prop: "onChange", type: "(value: boolean) => void", description: "Called when the user toggles." },
    { prop: "id", type: "string", description: "Pairs with FieldLabel htmlFor for accessible name." },
  ],
  ux: {
    job: "Let users flip a persistent on/off preference immediately, with a visible label that names what is being enabled or disabled.",
    budgets: [
      { label: "Decisions per row", value: "1", rationale: "One switch per Field row; split compound settings into separate rows." },
      { label: "Settings label column", value: "~9rem min", rationale: "Fixed label width on sm+ keeps switches aligned in FieldGroup grids." },
      { label: "Save feedback", value: "inline", rationale: "Auto-save rows show saving or saved on the row. No toast." },
    ],
    principles: ["P3", "P6", "P8", "P13"],
    modernReferences: [
      "Notion settings toggles (M1, M4)",
      "Linear notification preferences (M1, M4)",
      "Stripe dashboard feature flags (M4, M11)",
    ],
    patternDoc: "apps/web/docs/toggle-switch-pattern.md",
    rulePath: ".cursor/rules/exxat-accessibility.mdc",
    whenToUse: [
      "Settings and preferences that take effect immediately (notifications, visibility, feature flags).",
      "Binary choices where the result is a persisted on/off state, not a one-shot action.",
      "Field rows on workspace or personal settings with FieldLabel + FieldGroup.",
      "Hub table boolean columns when inline edit is required. Prefer BooleanToggleCell wrapper.",
    ],
    whenNotToUse: [
      "One-shot actions (Save, Submit, Delete). Button.",
      "Destructive or irreversible toggles without confirmation. Dialog first.",
      "Toolbar icon pressed modes. Toggle or ToggleGroup.",
      "Hub view or layout mode picking. ViewSegmentedControl or ButtonSegmentedControl.",
    ],
  },
  guidelines: {
    do: [
      "Wrap in Field orientation=\"horizontal\"; share id between ToggleSwitch and FieldLabel htmlFor.",
      "Use FieldDescription for helper text (what changes when on).",
      "Stack related rows in FieldGroup with justify-between label and switch.",
      "Use BooleanToggleCell in HubTable when the switch lives inside a data row.",
      "Show inline saving or saved state on auto-save settings rows.",
    ],
    dont: [
      "Ship a switch without a visible FieldLabel. The label is the accessible name.",
      "Nest inside Button, Link, or icon Toggle primitives.",
      "Use ToggleSwitch for delete or archive. Confirm in Dialog.",
      "Toast on toggle. Use inline row status per exxat-no-toast.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.3.1",
      criterionTitle: "Info and Relationships",
      level: "A",
      guidance:
        "FieldLabel htmlFor matches ToggleSwitch id so the visible label names the switch.",
    },
    {
      principle: "perceivable",
      criterion: "1.4.1",
      criterionTitle: "Use of Color",
      level: "A",
      guidance:
        "On state uses brand token plus thumb position; off state is not communicated by color alone.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance: "Native button; Space activates the switch when focused.",
    },
    {
      principle: "operable",
      criterion: "2.4.7",
      criterionTitle: "Focus Visible",
      level: "AA",
      guidance: "focus-visible ring on the switch; do not remove ring utilities from the primitive.",
    },
    {
      principle: "operable",
      criterion: "2.5.8",
      criterionTitle: "Target Size (Minimum)",
      level: "AA",
      guidance:
        "Hit target is the full switch track; add row padding so the 24px floor is met in dense settings lists.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance:
        "Each switch in a FieldGroup has its own FieldLabel; use FieldSet legend only for named sections.",
    },
    {
      principle: "understandable",
      criterion: "3.2.2",
      criterionTitle: "On Input",
      level: "A",
      guidance: "Toggle applies on click; show inline saving state instead of blocking the whole page.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance:
        "role=switch and aria-checked reflect state; thumb span stays aria-hidden as decorative.",
    },
  ],
  relatedSlugs: ["field", "toggle", "toggle-group", "boolean-toggle-cell", "button"],
}
