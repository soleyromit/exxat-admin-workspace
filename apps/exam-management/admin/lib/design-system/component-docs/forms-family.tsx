"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  FieldLayoutsPreview,
  FormRhfPreview,
  RadioGroupChoiceCardPreview,
  RadioGroupDefaultPreview,
} from "@/components/design-system/form-previews"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

const fieldAnatomy: ComponentDocSpec["anatomy"] = [
  { part: "Field", description: "Label + control + description — vertical or horizontal orientation." },
  { part: "FieldSet / FieldLegend", description: "Grouped radios or checkboxes with shared legend." },
  { part: "FieldDescription", description: "Help text below the control." },
]

const formGuidelines: ComponentDocSpec["guidelines"] = {
  do: [
    "Prefer Field + native control for simple settings and hub filters.",
    "Use Form + FormField + react-hook-form for multi-field submit flows.",
    "Wire errors to FormMessage or Field invalid state — inline, not toast.",
  ],
  dont: [
    "Do not use raw Label without Field in product forms.",
    "Do not skip visible labels on required fields.",
  ],
}

export const fieldComponentDoc: ComponentDocSpec = {
  slug: "field",
  summary: "Label + control + help text — top or left layout. Base building block for settings rows and hub filters.",
  sections: [
    ex({ id: "layouts", title: "Top and left layouts" }, <FieldLayoutsPreview />, "Toggle orientation; includes select, date, checkbox, and radio in context."),
  ],
  anatomy: fieldAnatomy,
  guidelines: formGuidelines,
  relatedSlugs: ["input", "select", "checkbox", "radio-group", "form"],
}

export const formComponentDoc: ComponentDocSpec = {
  slug: "form",
  summary: "react-hook-form shell — FormField, FormControl, FormMessage, and FormDescription.",
  sections: [
    ex({ id: "rhf", title: "React Hook Form" }, <FormRhfPreview />, "Validation on blur; FormMessage for errors."),
  ],
  anatomy: [
    { part: "Form", description: "Provider wrapper from react-hook-form." },
    { part: "FormField", description: "Connects name to control + message." },
    { part: "FormMessage", description: "Inline validation copy." },
  ],
  guidelines: formGuidelines,
  relatedSlugs: ["field", "input"],
}

export const inputComponentDoc: ComponentDocSpec = {
  slug: "input",
  summary: "Text input, textarea, input group, label, and slider — one reference family.",
  sections: [
    ex(
      { id: "text", title: "Input and textarea" },
      <div className="flex max-w-sm flex-col gap-3">
        <Input placeholder="Search students…" aria-label="Search students" />
        <Textarea rows={2} placeholder="Notes…" aria-label="Notes" />
      </div>,
    ),
    ex({ id: "in-field", title: "Inside Field" }, <FieldLayoutsPreview className="max-w-md" />),
  ],
  guidelines: formGuidelines,
  relatedSlugs: ["field", "form", "select"],
}

export const selectComponentDoc: ComponentDocSpec = {
  slug: "select",
  summary: "Dropdown select with DS trigger chrome — use inside Field.",
  sections: [
    ex({ id: "in-field", title: "Program picker" }, <FieldLayoutsPreview className="max-w-md" />, "SelectTrigger + SelectContent in a Field block."),
  ],
  relatedSlugs: ["field", "input"],
}

export const radioGroupComponentDoc: ComponentDocSpec = {
  slug: "radio-group",
  summary: "Radio set, choice cards, and selection tiles for exclusive picks.",
  sections: [
    ex({ id: "default", title: "Horizontal rows" }, <RadioGroupDefaultPreview />),
    ex({ id: "choice-card", title: "Choice cards" }, <RadioGroupChoiceCardPreview />),
  ],
  guidelines: {
    do: ["Use Field + RadioGroupItem for simple lists.", "Use choice cards when options need descriptions."],
    dont: ["Do not use Tabs for exclusive single-select — use RadioGroup or segmented control."],
  },
  relatedSlugs: ["field", "checkbox"],
}

export const datePickerComponentDoc: ComponentDocSpec = {
  slug: "date-picker",
  summary: "DatePickerField, DateRangePickerField, and DateTextInputField.",
  sections: [
    ex({ id: "single", title: "Single date in Field" }, <FieldLayoutsPreview className="max-w-md" />),
  ],
  relatedSlugs: ["field", "input"],
}
