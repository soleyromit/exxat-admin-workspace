"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  ViewSegmentedControlIconPreview,
  ViewSegmentedControlPreview,
  ViewSegmentedHubToolbarPreview,
} from "@/components/design-system/navigation-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const viewSegmentedControlComponentDoc: ComponentDocSpec = {
  slug: "view-segmented-control",
  summary:
    "Views segment — hub saved views with icon, label, count badge, chevron settings menu, and Add view. Composed on ListPageTemplate; compact pickers use the ViewSegmentedControl primitive.",
  sections: [
    ex({ id: "hub-toolbar", title: "Hub views toolbar" }, <ViewSegmentedHubToolbarPreview />),
    ex({ id: "labeled", title: "Simple labeled segments" }, <ViewSegmentedControlPreview />),
    ex({ id: "icon-only", title: "Icon only" }, <ViewSegmentedControlIconPreview />),
  ],
  anatomy: [
    {
      part: "ListPageTemplate views toolbar",
      description: "role=toolbar; per-view icon, label, count; active view gets chevron DropdownMenu.",
    },
    {
      part: "ViewSegmentedControl",
      description: "Lightweight radiogroup primitive for ≤5 modes without saved views or Add view.",
    },
    {
      part: "viewSegmentedToolbarClass / viewSegmentedButtonClass",
      description: "Shared pill chrome for hub toolbar and ViewSegmentedControl.",
    },
  ],
  guidelines: {
    do: [
      "Use the full hub toolbar (icon, count, chevron, Add view) on ListPageTemplate hubs.",
      "Use ViewSegmentedControl only for simple mode pickers without saved views.",
      "Use ButtonSegmentedControl for theme preview on doc pages.",
      "Use primary Tabs (pill) for record sections; secondary Tabs (line) for in-card panels.",
    ],
    dont: [
      "Do not use Radix Tabs for hub view switching or Add view.",
      "Do not omit the chevron menu on active saved views in product hubs.",
      "Do not stretch view segments or tab lists full width.",
    ],
  },
  accessibility: [
    "Views toolbar uses role=toolbar — not tablist (settings chevron and Add view are not tabs).",
    "ViewSegmentedControl uses role=radiogroup with arrow-key navigation.",
    "Icon-only segments require aria-label or Tip per segment.",
  ],
  relatedSlugs: ["tabs", "button", "data-table"],
}
