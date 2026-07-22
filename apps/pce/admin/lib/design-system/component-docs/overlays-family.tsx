"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  DropdownMenuPreview,
  PopoverPreview,
  TipPreview,
} from "@/components/design-system/overlay-previews"
import { CommandPreview } from "@/components/design-system/data-display-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

const overlayGuidelines: ComponentDocSpec["guidelines"] = {
  do: [
    "Prefer Tip over raw Tooltip in product code.",
    "Use DropdownMenu for row actions and overflow menus.",
    "Use Popover for lightweight contextual panels — not blocking dialogs.",
  ],
  dont: [
    "Do not use Vaul drawers — Sheet / FloatingSheetPanel only.",
    "Do not use toast for overlay feedback (exxat-no-toast).",
  ],
}

export const popoverComponentDoc: ComponentDocSpec = {
  slug: "popover",
  summary: "Popover and HoverCard surfaces — lightweight contextual panels.",
  sections: [ex({ id: "default", title: "Popover" }, <PopoverPreview />)],
  guidelines: overlayGuidelines,
  relatedSlugs: ["dialog", "tip", "hover-card"],
}

export const dropdownMenuComponentDoc: ComponentDocSpec = {
  slug: "dropdown-menu",
  summary: "Dropdown and context menus — row actions, overflow, view settings.",
  sections: [ex({ id: "default", title: "Dropdown menu" }, <DropdownMenuPreview />)],
  guidelines: overlayGuidelines,
  relatedSlugs: ["popover", "command"],
}

export const commandComponentDoc: ComponentDocSpec = {
  slug: "command",
  summary: "⌘K palette list primitive — composed in CommandMenu for global search.",
  sections: [
    ex({ id: "default", title: "Command list" }, <CommandPreview />, "See command-menu-pattern.md for shell wiring."),
  ],
  ux: { patternDoc: "apps/web/docs/command-menu-pattern.md" },
  relatedSlugs: ["dialog", "dropdown-menu"],
}

export const tipComponentDoc: ComponentDocSpec = {
  slug: "tip",
  summary: "Product tooltip wrapper with DS delay — default for icon-only controls.",
  sections: [ex({ id: "default", title: "Tip on icon button" }, <TipPreview />)],
  guidelines: {
    do: ["Wrap every icon-only control in Tip or aria-label.", "Use side=right on secondary nav rows."],
    dont: ["Do not import Tooltip directly in product surfaces."],
  },
  relatedSlugs: ["button", "popover"],
}
