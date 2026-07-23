"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  FilterChipGroupBrandPreview,
  FilterChipGroupMutedPreview,
  FilterChipGroupSizesPreview,
} from "@/components/design-system/navigation-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const filterChipGroupComponentDoc: ComponentDocSpec = {
  slug: "filter-chip-group",
  summary:
    "Wrapping pill filter chips for single-select category browsing — brand fill with optional icons and counts (catalog tiers), or muted tint for in-content family pickers (chart types).",
  sections: [
    ex(
      { id: "brand", title: "Brand variant" },
      <FilterChipGroupBrandPreview />,
      "Design OS Catalog tier filter — solid brand on the active chip; optional icon + count per option.",
    ),
    ex(
      { id: "muted", title: "Muted variant" },
      <FilterChipGroupMutedPreview />,
      "In-content pickers — chart families, doc filters. Active chip uses brand-tint wash, not solid fill.",
    ),
    ex(
      { id: "sizes", title: "Sizes" },
      <FilterChipGroupSizesPreview />,
      "default (h-8) for catalog index; sm (h-7) for compact toolbars and chart pickers.",
    ),
  ],
  anatomy: [
    { part: "FilterChipGroup", description: "role=radiogroup; arrow-key navigation between chips." },
    { part: "FilterChipOption", description: "value, label, optional icon (FA class), optional count." },
  ],
  api: [
    { prop: "variant", type: '"brand" | "muted"', defaultValue: "brand", description: "Active chip chrome." },
    { prop: "size", type: '"default" | "sm"', defaultValue: "default", description: "Chip height and type scale." },
    { prop: "value", type: "T", defaultValue: "none", description: "Selected option value." },
    { prop: "onValueChange", type: "(value: T) => void", defaultValue: "none", description: "Called when a chip is selected." },
    { prop: "options", type: "FilterChipOption<T>[]", defaultValue: "none", description: "Chip definitions." },
  ],
  guidelines: {
    do: [
      "Use variant=\"brand\" size=\"default\" for catalog tier filters with counts (Design OS Catalog index).",
      "Use variant=\"muted\" size=\"sm\" for in-preview family pickers (chart types, filterable doc examples).",
      "Pair optional icons with tier labels when scanning by category type.",
      "Every chip — selected or not — keeps a bordered pill surface so options read as buttons, not body copy.",
    ],
    dont: [
      "Do not use for hub view switching — ViewSegmentedControl on ListPageTemplate.",
      "Do not use for toolbar mode rows without wrap — ButtonSegmentedControl.",
      "Do not use for tile pickers with large preview wells — SelectionTileGrid.",
      "Do not strip inactive chip borders/backgrounds — unselected options must still look clickable (WCAG 3.3.2).",
    ],
  },
  relatedSlugs: ["button-segmented-control", "view-segmented-control", "tabs", "selection-tile-grid"],
}
