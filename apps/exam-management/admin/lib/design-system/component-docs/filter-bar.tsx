"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { FilterBarPreview } from "@/components/design-system/filter-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const filterBarComponentDoc: ComponentDocSpec = {
  slug: "filter-bar",
  summary:
    "Inline active-filter row on hub toolbars — wraps FilterPill chips, Add filter, and Clear all. Composed inside DataTableToolbar when filterBarVisible.",
  sections: [
    ex(
      { id: "toolbar", title: "Toolbar composition" },
      <FilterBarPreview />,
      "FilterBar grows in the toolbar leading edge; FilterButton sits trailing after the divider.",
    ),
  ],
  anatomy: [
    { part: "FilterBar", description: "role=group flex wrap row for active filter chips." },
    { part: "FilterBarAddButton", description: "Dashed Add filter trigger — opens field picker menu." },
    { part: "FilterBarClearButton", description: "Text Clear all when one or more chips are active." },
    { part: "FilterPill", description: "Per-field chip with popover editor — lives in data-table (not exported separately)." },
  ],
  guidelines: {
    do: [
      "Show only when filterBarVisible and the table has filterable columns.",
      "Keep Add filter and Clear all at the end of the chip row.",
    ],
    dont: [
      "Do not use on catalog browse surfaces — FilterChipGroup is for tier pickers.",
      "Do not hide the FilterButton when the bar is visible — users still need Properties / compact toggle.",
    ],
  },
  relatedSlugs: ["filter-button", "data-table", "hub-table", "table-properties-drawer"],
}
