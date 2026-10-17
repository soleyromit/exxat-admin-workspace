"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  CheckboxFieldPreview,
  CheckboxChoiceCardPreview,
  CheckboxInvalidPreview,
  CheckboxLabelPreview,
  CheckboxMotionPreview,
  CheckboxSizesPreview,
  CheckboxStatesPreview,
  CheckboxTableBulkPreview,
  CheckboxVariantsPreview,
  CheckboxWithDescriptionPreview,
} from "@/components/design-system/form-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const checkboxComponentDoc: ComponentDocSpec = {
  slug: "checkbox",
  summary:
    "Radix tri-state checkbox with seven color variants, three sizes, optional motion, and Field composition for export options, acknowledgements, and bulk-select parents.",
  extraImports: [
    { label: "CheckboxLabel", path: "@exxatdesignux/ui/components/checkbox" },
    { label: "Field", path: "@exxatdesignux/ui/components/field" },
  ],
  sections: [
    ex({ id: "variants", title: "Variants" }, <CheckboxVariantsPreview />),
    ex({ id: "sizes", title: "Size" }, <CheckboxSizesPreview />),
    ex({ id: "motion", title: "Motion" }, <CheckboxMotionPreview />),
    ex({ id: "states", title: "States" }, <CheckboxStatesPreview />),
    ex({ id: "table-bulk", title: "Table bulk select" }, <CheckboxTableBulkPreview />),
    ex({ id: "field", title: "Group" }, <CheckboxFieldPreview />),
    ex({ id: "checkbox-label", title: "CheckboxLabel" }, <CheckboxLabelPreview />),
    ex({ id: "with-description", title: "With description" }, <CheckboxWithDescriptionPreview />),
    ex({ id: "choice-card", title: "Choice card" }, <CheckboxChoiceCardPreview />),
    ex({ id: "invalid", title: "Invalid" }, <CheckboxInvalidPreview />),
  ],
  anatomy: [
    { part: "Checkbox", description: "Radix Root + Indicator; check or minus icon for indeterminate." },
    { part: "CheckboxLabel", description: "Label with min-h-11 tap target; pairs with checkbox id." },
    { part: "Field + FieldLabel", description: "Preferred form row wrapper with horizontal orientation." },
    { part: "FieldSet + checkbox-group", description: "Legend, optional set description, stacked Field rows — multi-select." },
    { part: "FieldContent + FieldDescription", description: "Per-option label with helper copy below; checkbox aligns to title." },
    { part: "Choice card", description: "FieldLabel wraps bordered Field; title + description left, checkbox right." },
  ],
  features: [
    {
      group: "Visual",
      icon: "fa-square-check",
      items: [
        { part: "variant", description: "default, outline, secondary, success, destructive, warning, muted." },
        { part: "size", description: "sm (14px) for hub tables; default (16px) for forms; lg (20px) for onboarding checklists." },
        { part: "motion", description: "none, pop, glow, pop-glow — motion-safe / motion-reduce aware." },
      ],
    },
    {
      group: "Behavior",
      icon: "fa-toggle-on",
      items: [
        { part: "checked", description: "true | false | \"indeterminate\" for parent select-some rows." },
        { part: "disabled", description: "Dims control; pair with peer-disabled on label." },
        { part: "aria-invalid", description: "Destructive ring from Field validation." },
        { part: "hit slop", description: "after: pseudo expands tap target without changing visual size." },
      ],
    },
  ],
  api: [
    {
      prop: "variant",
      type: "default | outline | secondary | success | destructive | warning | muted",
      defaultValue: "default",
      description: "Checked-state color chrome.",
    },
    { prop: "size", type: "sm | default | lg", defaultValue: "default", description: "Visual scale: 14px, 16px, 20px. Hit slop from base after: pseudo." },
    { prop: "motion", type: "none | pop | glow | pop-glow", defaultValue: "none", description: "Check animation and focus glow." },
    { prop: "checked", type: "boolean | \"indeterminate\"", description: "Tri-state value." },
    { prop: "onCheckedChange", type: "(checked: boolean | \"indeterminate\") => void", description: "Controlled updates." },
    { prop: "aria-invalid", type: "boolean", description: "From Field validation; shows destructive ring." },
    { prop: "disabled", type: "boolean", description: "Non-interactive; label inherits peer-disabled styles." },
  ],
  ux: {
    job: "Let users opt in to a secondary option, acknowledge a requirement, or select some rows in a bulk list.",
    budgets: [
      { label: "Options per FieldSet", value: "≤ 6", rationale: "More choices → radio group or multi-select." },
      { label: "Label target", value: "44px min", rationale: "CheckboxLabel or FieldLabel htmlFor + id." },
      { label: "Table bulk select", value: "indeterminate parent", rationale: "Header checkbox reflects partial selection." },
    ],
    principles: ["P3", "P5", "P8", "P13"],
    modernReferences: [
      "Notion export checkboxes (M1, M4)",
      "Linear bulk select (M1, M4)",
      "Stripe acknowledgement fields (M4, M11)",
    ],
    whenToUse: [
      "Export or filter FieldSet with data-slot=\"checkbox-group\" — users can pick multiple options.",
      "Per-option FieldContent + FieldDescription when each row needs helper copy.",
      "Choice card rows for plan or tier pickers when multiple selections are allowed.",
      "Hub table header checkbox with indeterminate when some rows selected.",
      "Onboarding step completion (success variant + lg).",
    ],
    whenNotToUse: [
      "Mutually exclusive choices — RadioGroup.",
      "Immediate on/off settings — ToggleSwitch.",
      "Single primary submit — Button.",
    ],
  },
  guidelines: {
    do: [
      "Stack related rows in a FieldSet with data-slot=\"checkbox-group\" on the list wrapper.",
      "Use FieldContent + FieldDescription for per-option helper copy; let Field handle checkbox alignment.",
      "Choice card: FieldLabel wraps Field; Checkbox on the right, FieldTitle + FieldDescription on the left.",
      "Use checked=\"indeterminate\" on parent row when selection is partial.",
      "Use CheckboxLabel for a single-line label with a larger tap target.",
      "Set aria-invalid on Field + Checkbox when validation fails.",
    ],
    dont: [
      "Ship a checkbox without a visible label or aria-label.",
      "Use destructive variant for neutral optional flags.",
      "Toast on checkbox validation — inline Field error.",
      "Replace ToggleSwitch for persisted on/off settings rows.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.4.1",
      criterionTitle: "Use of Color",
      level: "A",
      guidance: "Checked state pairs color with check or minus icon; indeterminate uses minus glyph.",
    },
    {
      principle: "operable",
      criterion: "2.5.5",
      criterionTitle: "Target Size",
      level: "AAA",
      guidance: "CheckboxLabel min-h-11 and after: hit slop meet touch target guidance.",
    },
    {
      principle: "understandable",
      criterion: "3.3.1",
      criterionTitle: "Error Identification",
      level: "A",
      guidance: "aria-invalid + Field data-invalid; describe error in legend or adjacent copy.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance: "Radix checkbox exposes checked and indeterminate to assistive tech.",
    },
  ],
  relatedSlugs: ["field", "radio-group", "toggle-switch", "selection-tile-grid"],
}
