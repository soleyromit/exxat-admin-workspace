"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  FilterButtonCountOverlayPreview,
  FilterButtonPreview,
} from "@/components/design-system/filter-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const filterButtonComponentDoc: ComponentDocSpec = {
  slug: "filter-button",
  summary:
    "Hub toolbar filter trigger — size-8 funnel icon with Badge count overlay when filters are active. Accent fill when the bar is open.",
  sections: [
    ex(
      { id: "states", title: "States" },
      <FilterButtonPreview />,
      "Default, one active filter (accent + overlay count), filters applied with bar collapsed (neutral chrome + overlay).",
    ),
    ex(
      { id: "count-overlay", title: "Count overlay" },
      <FilterButtonCountOverlayPreview />,
      "Same top-end Badge overlay as notification bell triggers — never inline count beside the icon.",
    ),
  ],
  anatomy: [
    { part: "FilterButton", description: "size-8 icon trigger; Badge at -top-1.5 -end-1.5 when activeCount > 0." },
  ],
  api: [
    { prop: "activeCount", type: "number", defaultValue: "0", description: "Shows count overlay when > 0." },
    { prop: "highlighted", type: "boolean", defaultValue: "activeCount > 0", description: "Accent fill; set false when bar is collapsed." },
  ],
  guidelines: {
    do: [
      "Use on DataTable / HubTable toolbars beside search and Table properties.",
      "Pair with FilterBar for inline chips when filterBarVisible is true.",
      "Keep the trigger size-8 — count lives in the overlay Badge only.",
    ],
    dont: [
      "Do not use for catalog tier browsing — FilterChipGroup.",
      "Do not place the count beside the funnel icon.",
    ],
  },
  relatedSlugs: ["filter-bar", "data-table", "hub-table", "badge", "filter-chip-group"],
}
