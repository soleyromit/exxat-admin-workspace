"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  KbdBareInButtonPreview,
  KbdGroupPreview,
  KbdSymbolsPreview,
  KbdTilePreview,
} from "@/components/design-system/feedback-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const kbdComponentDoc: ComponentDocSpec = {
  slug: "kbd",
  summary:
    "Keyboard shortcut glyphs for tooltips, helper text, and workflow buttons. Tile on neutral surfaces; bare inside buttons so hints inherit button color.",
  extraImports: [
    { label: "KbdGroup", path: "@exxatdesignux/ui/components/kbd" },
    { label: "Shortcut", path: "@exxatdesignux/ui/components/dropdown-menu" },
    { label: "useModKeyLabel", path: "@/hooks/use-mod-key-label" },
  ],
  sections: [
    ex({ id: "tile", title: "Tile" }, <KbdTilePreview />),
    ex({ id: "bare", title: "Bare in button" }, <KbdBareInButtonPreview />),
    ex({ id: "group", title: "KbdGroup" }, <KbdGroupPreview />),
    ex({ id: "symbols", title: "Symbols" }, <KbdSymbolsPreview />),
  ],
  anatomy: [
    { part: "Kbd", description: "Single key or chord segment; tile (default) or bare variant." },
    { part: "KbdGroup", description: "Inline flex row with consistent gap between keys in a chord." },
    { part: "Shortcut", description: "Global keybinding helper from dropdown-menu; pair hints with behavior." },
  ],
  features: [
    {
      group: "Variants",
      icon: "fa-keyboard",
      items: [
        { part: "tile", description: "Muted fill + border on neutral surfaces, tooltips, and docs." },
        { part: "bare", description: "No chrome; currentColor at 70%. Required inside Button." },
      ],
    },
    {
      group: "Composition",
      icon: "fa-grip",
      items: [
        { part: "KbdGroup", description: "Multi-key chords with even spacing (⌘ ⇧ P)." },
        { part: "bare chord", description: "Glue multi-key workflow hints in one bare Kbd (⌘⏎, ⌘⌥←)." },
        { part: "aria-hidden", description: "Bare defaults to aria-hidden; button carries the accessible name." },
      ],
    },
  ],
  api: [
    { prop: "variant", type: "tile | bare", defaultValue: "tile", description: "Visual chrome. bare inside buttons." },
    { prop: "aria-hidden", type: "boolean", description: "Bare defaults true; set false only when Kbd is the sole label." },
    { prop: "KbdGroup", type: "div props", description: "Wrapper for chord spacing; no extra semantics." },
  ],
  ux: {
    job: "Make keyboard shortcuts discoverable on primary actions, search, and global affordances without duplicating screen reader noise.",
    budgets: [
      { label: "Bare in buttons", value: "required", rationale: "Tile Kbd on filled buttons looks like a pasted patch." },
      { label: "Chord in button", value: "one Kbd", rationale: "Combine ⌘⏎ in a single bare glyph, not one tile per key." },
      { label: "Reserved chords", value: "avoid", rationale: "Skip browser defaults (⌘⇧N, ⌘L). Prefer ⌘⌥ + letter for app actions." },
    ],
    principles: ["P8", "P13", "P19"],
    modernReferences: [
      "Linear command hints (M1, M4)",
      "Notion shortcut tiles (M1, M4)",
      "Figma tooltips with keys (M4, M7)",
    ],
    rulePath: "apps/web/.cursor/rules/exxat-kbd-shortcuts.mdc",
    whenToUse: [
      "Primary and secondary workflow buttons (Save, Export, Submit).",
      "Global search (⌘K) and Ask Leo (⌘⌥K) affordances.",
      "Tooltip and menu shortcut columns paired with Shortcut binding.",
      "Helper text on neutral surfaces (tile variant).",
    ],
    whenNotToUse: [
      "Icon-only row actions that already have aria-label.",
      "Dense table cells where every control would show a chord.",
      "Hints without a matching Shortcut or key handler.",
    ],
  },
  guidelines: {
    do: [
      "Use variant=\"bare\" inside every Button shortcut hint.",
      "Mount <Shortcut keys=\"…\" onInvoke={…} /> while the surface is open.",
      "Use useModKeyLabel() for ⌘ vs Ctrl in user-facing copy.",
      "Wrap multi-key tooltips in KbdGroup with tile variant.",
      "Pair Enter (⏎) on workflow primary actions with a Shortcut binding.",
    ],
    dont: [
      "Put tile Kbd on primary or secondary button fills.",
      "Show a chord that is not implemented.",
      "Use browser-reserved combinations for in-app actions.",
      "Rely on Kbd alone for the accessible name on bare-in-button hints.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.3.1",
      criterionTitle: "Info and Relationships",
      level: "A",
      guidance: "Bare Kbd inside buttons is aria-hidden; the button label names the action.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance: "Every visible chord should match a Shortcut or native behavior.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance: "Tile Kbd in tooltips supplements visible label text; do not replace it.",
    },
  ],
  relatedSlugs: ["button", "tip", "command", "dropdown-menu"],
}
