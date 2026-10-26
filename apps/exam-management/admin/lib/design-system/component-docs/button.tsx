"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  ButtonAsChildPreview,
  ButtonGhostIconToolbarPreview,
  ButtonGroupPreview,
  ButtonGroupSegmentedPreview,
  ButtonIconPreview,
  ButtonLoadingPreview,
  ButtonSizesPreview,
  ButtonVariantsPreview,
  ButtonWithIconPreview,
  ToggleGroupPreview,
  TogglePreview,
} from "@/components/design-system/button-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const buttonComponentDoc: ComponentDocSpec = {
  slug: "button",
  summary:
    "Primary action control: variants, sizes, icon-only, loading, grouped actions, and co-located Toggle / ToggleGroup primitives on one reference page.",
  sections: [
    ex({ id: "variants", title: "Variants" }, <ButtonVariantsPreview />),
    ex({ id: "sizes", title: "Size" }, <ButtonSizesPreview />),
    ex({ id: "icon", title: "Icon" }, <ButtonIconPreview />),
    ex(
      { id: "ghost-icon-toolbar", title: "Ghost icon (toolbar)" },
      <ButtonGhostIconToolbarPreview />,
    ),
    ex({ id: "with-icon", title: "With icon" }, <ButtonWithIconPreview />),
    ex({ id: "loading", title: "Loading" }, <ButtonLoadingPreview />),
    ex({ id: "button-group", title: "Button group" }, <ButtonGroupPreview />),
    ex({ id: "button-group-segmented", title: "Segmented control" }, <ButtonGroupSegmentedPreview />),
    ex({ id: "toggle", title: "Toggle" }, <TogglePreview />),
    ex({ id: "toggle-group", title: "Toggle group" }, <ToggleGroupPreview />),
    ex({ id: "as-child", title: "As child" }, <ButtonAsChildPreview />),
  ],
  anatomy: [
    { part: "Button", description: "Root action: variant, size, asChild, loading." },
    { part: "ButtonGroup", description: "Horizontal cluster for related actions." },
    { part: "ButtonSegmentedControl", description: "Exclusive mode picker on muted pill chrome (theme, filters)." },
    { part: "Toggle", description: "Icon toggle with aria-pressed / data-state=on." },
    { part: "ToggleGroup + ToggleGroupItem", description: "Radio-like or multi toggle set with shared spacing." },
  ],
  api: [
    { prop: "variant", type: "default | outline | secondary | ghost | destructive | link", defaultValue: "default", description: "Visual style." },
    { prop: "size", type: "xs | sm | default | lg | icon-*", defaultValue: "default", description: "Height and padding tier." },
    { prop: "asChild", type: "boolean", defaultValue: "false", description: "Merge props onto child (e.g. React-router Link)." },
    { prop: "disabled", type: "boolean", description: "Blocks interaction; use for loading states too." },
  ],
  ux: {
    job: "Trigger one intentional action with clear hierarchy so users know what will happen when they click.",
    budgets: [
      { label: "Primary CTA per surface", value: "1", rationale: "One default-filled button per header, footer, or dialog (P3)." },
      { label: "Icon-only target", value: "≥24px", rationale: "Use size icon-sm (size-6) or larger for sole click targets." },
      { label: "Action labels", value: "verb + object", rationale: "Use Save placement or Delete student. Not Submit or OK." },
    ],
    principles: ["P3", "P6", "P8", "P13"],
    modernReferences: [
      "Linear primary action bar (M3, M4)",
      "Stripe checkout CTA hierarchy (M4, M6)",
      "Notion toolbar ghost actions (M1, M4)",
    ],
    patternDoc: "apps/web/docs/button-pattern.md",
    rulePath: ".cursor/rules/exxat-accessibility.mdc",
    whenToUse: [
      "Primary CTA on PageHeader, wizard footer, or dialog footer.",
      "Secondary cancel or back path (outline / secondary).",
      "Destructive trigger that opens a confirmation dialog.",
      "Toolbar tertiary actions (ghost) and inline text actions (link).",
      "Icon-only triggers for close, overflow, or compact toolbars (with Tip).",
      "Filter / search / breadcrumb utility menus: variant ghost + size icon-sm.",
    ],
    whenNotToUse: [
      "Persistent on/off settings. ToggleSwitch.",
      "Hub view or mode switching. ViewSegmentedControl or ButtonSegmentedControl.",
      "Navigation that only changes route with no submit semantics. Link or nav row.",
      "Success feedback after click. LocalBanner with undo, not a follow-up button toast.",
    ],
  },
  guidelines: {
    do: [
      "Map hierarchy: default = primary, outline/secondary = secondary, ghost = tertiary, destructive = irreversible.",
      "Ghost + label sizes keep a subtle resting surface; ghost + icon sizes are transparent until hover/focus.",
      "Use asChild to render Button chrome on react-router Link when navigation looks like a button.",
      "Icon + label: set data-icon=\"inline-start\" or inline-end on the FA icon; decorative icon is aria-hidden.",
      "Loading: disable the control and show spinner; do not leave an active duplicate primary.",
      "Cluster related secondaries in ButtonGroup; use ToggleGroup only for pressed toggle sets.",
    ],
    dont: [
      "Ship two or more default-filled primaries on the same row.",
      "Remove ghost resting bg-interactive-hover-subtle from labeled ghost buttons — that surface is intentional for text CTAs.",
      "Give icon-only ghost buttons a resting fill — icon ghost stays transparent until hover/focus.",
      "Use Button for boolean settings. ToggleSwitch owns on/off.",
      "Rely on icon shape alone without aria-label on icon-only sizes.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.4.11",
      criterionTitle: "Non-text Contrast",
      level: "AA",
      guidance:
        "Ghost variant keeps a resting bg-interactive-hover-subtle fill so controls read as clickable, not plain text.",
    },
    {
      principle: "perceivable",
      criterion: "1.4.1",
      criterionTitle: "Use of Color",
      level: "A",
      guidance:
        "Destructive actions pair danger tint with explicit label text; do not signal delete by color alone.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance: "Native button or asChild on focusable child; Space and Enter activate.",
    },
    {
      principle: "operable",
      criterion: "2.4.7",
      criterionTitle: "Focus Visible",
      level: "AA",
      guidance: "focus-visible ring on all variants; do not remove ring utilities from buttonVariants.",
    },
    {
      principle: "operable",
      criterion: "2.5.8",
      criterionTitle: "Target Size (Minimum)",
      level: "AA",
      guidance: "Icon-only sizes (icon-sm, icon) meet 24×24 CSS px or have 24px spacing between targets.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance:
        "Visible text labels on text buttons; icon-only buttons need aria-label matching Tip content (Case C).",
    },
    {
      principle: "understandable",
      criterion: "3.2.2",
      criterionTitle: "On Input",
      level: "A",
      guidance: "Loading and disabled states block double-submit; set aria-busy when a spinner is shown.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance:
        "Toggle and ToggleGroupItem expose aria-pressed; ToggleGroup type=single needs aria-label on the group.",
    },
  ],
  relatedSlugs: ["toggle-switch", "button-group", "field", "tip"],
}
